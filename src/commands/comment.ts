import { Action, Command, Ctx, Param, Params } from '@cmdify/common'

import { Message } from 'discord.js'
import { Bot } from '../bot'
import { Entry } from '../model'

@Command({
  name: 'comment',
  aliases: ['message', 'update']
})
export class Comment {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Param(0) id: number,
    @Params update: string[]
  ) {
    const value = client.entries.get(id)

    if (value === undefined)
      return

    const date = new Date()

    const day = date.getDate()
    const month = date.getMonth() + 1

    value.comments.push(
      `<@${message.author.id}> *(${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')})* - ${update.slice(1).join(' ')}`
    )

    client.entries.set(id, value)
    await Entry.update(client, value)
  }
}