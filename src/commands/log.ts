import { Action, Params, Command, Ctx } from '@cmdify/common'

import { Message, MessageEmbed } from 'discord.js'

import { Entry } from '../model'
import { Bot } from '../bot'

import config from '../config'

@Command({
  name: 'log',
  aliases: ['request']
})
export class Log {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Params args: string[]
  ) {
    if (message.channel.id !== config.LOGS_CHANNEL)
      return

    const title = args.join(' ')

    if (client.entries.find(e => e.state === Entry.State.Scaffolding && e.author === message.author.id))
      return

    const entry = {
      id: client.cid,
      approvals: 0,
      attachments: [],
      comments: [],
      timestamps: [`Created *(${new Date().toLocaleString('en-US')})*`],
      participants: [],
      author: message.author.id,
      message: '',
      name: title,
      state: Entry.State.Scaffolding
    }

    const response = await message.channel.send(
      new MessageEmbed()
        .setColor('WHITE')
        .setDescription('Creating log... Hang on tight!')
    )

    entry.message = response.id
    client.entries.set(entry.id, entry)

    await response.edit(await Entry.embed(client, entry))
  }
}