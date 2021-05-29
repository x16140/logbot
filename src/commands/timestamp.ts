import { Action, Command, Ctx, Param, Params } from '@cmdify/common'

import { Message } from 'discord.js'
import { Bot } from '../bot'
import { Entry } from '../model'

@Command({
  name: 'timestamp',
  aliases: ['time', 'date']
})
export class Timestamp {
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

    value.timestamps.push(
      `*${note.slice(1).join(' ')}* *(${new Date().toLocaleString('en-US')})*`
    )

    client.entries.set(id, value)
    await Entry.update(client, value)
  }
}