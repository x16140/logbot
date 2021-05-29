import { Action, Command, Ctx, Param, Params } from '@cmdify/common'

import { Message } from 'discord.js'
import { Bot } from '../bot'
import { Entry } from '../model'

@Command({
  name: 'deadline',
  aliases: ['deadlines', 'limit']
})
export class Deadline {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Params time: string[]
  ) {
    const index = client.entries.findKey(e => e.author === message.author.id && e.state === Entry.State.Scaffolding)

    if (index === undefined)
      return

    const value = client.entries.get(index)!!
    const date = Date.parse(time.join(' '))

    if (isNaN(date))
      return

    value.timestamps.push(
      `Deadline *(**${new Date(date).toLocaleString('en-US')}**)*`
    )

    client.entries.set(index, value)
    await Entry.update(client, value)
  }
}