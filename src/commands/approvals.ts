import { Action, Command, Ctx, Param } from '@cmdify/common'

import { Message } from 'discord.js'
import { Bot } from '../bot'
import { Entry } from '../model'

@Command({
  name: 'approvals',
  aliases: ['approve', 'approval']
})
export class Approvals {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Param(0) count: number
  ) {
    const index = client.entries.findKey(e => e.author === message.author.id && e.state === Entry.State.Scaffolding)

    if (index === undefined)
      return

    const value = client.entries.get(index)!!

    value.approvals = count

    client.entries.set(index, value)
    await Entry.update(client, value)
  }
}