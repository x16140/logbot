import { Action, Command, Ctx, Param, Params } from '@cmdify/common'

import { Message, MessageEmbed, TextChannel } from 'discord.js'
import { Bot } from '../bot'
import config from '../config'
import { Entry } from '../model'

@Command({
  name: 'remind',
  aliases: ['reminder']
})
export class Remind {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Param(0) id: number,
    @Params note: string[]
  ) {
    const value = client.entries.get(id)

    if (value === undefined)
      return

    if (value.state === Entry.State.Scaffolding || value.state === Entry.State.Cancelled || value.state === Entry.State.Completed)
      return

    const m = await (await client.channels.fetch(config.LOGS_CHANNEL) as TextChannel).messages.fetch(value.message)

    for (const user of message.guild?.members.cache.array().map(m => m.user) || [])
      if (!config.BLACKLIST.includes(user.id) && !user.bot && user.id !== message.author.id)
        await (await user.createDM())?.send(
          new MessageEmbed()
            .setColor('GOLD')
            .setTitle('Reminder' + (note.length > 1 ? ' to ' + note.slice(1).join(' ') : ''))
            .setDescription(`Please view, approve, or review the following log entry (Reminder by ${message.author.tag}).\n\n> [Click Here to Review](${m.url})`)
        )
  }
}