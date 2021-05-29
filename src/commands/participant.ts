import { Action, Command, Ctx, Param } from '@cmdify/common'

import { Message } from 'discord.js'
import { Bot } from '../bot'
import { Entry } from '../model'

@Command({
  name: 'participant',
  aliases: ['person', 'people']
})
export class Participant {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Param(0) participant: string,
  ) {
    const index = client.entries.findKey(e => e.author === message.author.id && e.state === Entry.State.Scaffolding)

    if (index === undefined)
      return

    const value = client.entries.get(index)!!
    value.participants.push(participant)

    client.entries.set(index, value)
    await Entry.update(client, value)
  }
}