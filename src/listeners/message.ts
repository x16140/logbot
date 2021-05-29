import { Ctx, Event, Listener, MessageEvent, On } from '@cmdify/common'
import { Message } from 'discord.js'

import config from '../config'

import { Log, Commit, Approvals, Participant, Description } from '../commands'
import { Bot } from '../bot'

@Listener()
export class MessageListener {
  @On()
  public async message(
    @Event e: MessageEvent,
    @Ctx client: Bot,
    @Ctx message: Message
  ) {
    if (message.channel.id !== config.LOGS_CHANNEL)
      return

    if (message.author.bot)
      return

    await message.delete()

    // Foolproof mode

    let m = message.content

    if (!m.startsWith('-'))
      return

    m = m.slice(1)

    const parts = m.split(' ')
    const req = parseInt(parts.shift()!!)
    let title = parts.join(' ')

    for (const mention of message.mentions.users.array())
      title = title
        .replace(RegExp(`<@!?${mention.id}>`, 'g'), mention.tag)

    if (isNaN(req) || !title)
      return

    await Log.prototype.run(client, message, ['Log Entry'])
    await Description.prototype.run(client, message, [title])
    await Approvals.prototype.run(client, message, req)

    for (const mention of message.mentions.users.array())
      await Participant.prototype.run(client, message, `<@${mention.id}>`)

    await Commit.prototype.run(client, message)
  }
}

@Listener()
export class MessageDumpListener {
  @On()
  public async message(
    @Event e: MessageEvent,
    @Ctx client: Bot,
    @Ctx message: Message
  ): Promise<any> {
    if (message.channel.id !== config.DUMP_CHANNEL)
      return

    if (message.author.bot)
      return

    if (message.content.length > 0)
      return message.delete()

    const attachments = message.attachments.array()

    if (attachments.length !== 1)
      return message.delete()

    const attachment = attachments[0]

    await message.reply('here is your attachment URL:\n`' + attachment.url + '`')
  }
}