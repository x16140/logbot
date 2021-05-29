import { Action, Command, Ctx, Params } from '@cmdify/common'

import { Message, TextChannel } from 'discord.js'
import { Bot } from '../bot'
import { Entry } from '../model'
import config from '../config'

@Command({
  name: 'description',
  aliases: ['desc']
})
export class Description {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Params args: string[]
  ) {
    const index = client.entries.findKey(e => e.author === message.author.id && e.state === Entry.State.Scaffolding)

    if (index === undefined)
      return

    const value = client.entries.get(index)!!

    value.description = args.join(' ')

    const logs = await client.channels.fetch(config.LOGS_CHANNEL) as TextChannel

    for (const entry of client.entries.array()) {
      if (!value.description.includes('#' + entry.id))
        continue

      value.description = value.description?.replace(new RegExp('#' + entry.id, 'g'), `[${'#' + entry.id}](${(await logs.messages.fetch(entry.message)).url})`)
    }

    client.entries.set(index, value)
    await Entry.update(client, value)
  }
}