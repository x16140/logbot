import { Action, Command, Ctx, Param, Params } from '@cmdify/common'

import { Message } from 'discord.js'
import { Bot } from '../bot'
import { Entry } from '../model'

@Command({
  name: 'attach',
  aliases: ['image', 'upload']
})
export class Attach {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Param(0) name: string,
    @Param(1) link: string,
    @Params rest: string[]
  ) {
    if (rest.length > 2) {
      const idx = parseInt(rest[0])
      const value = client.entries.get(idx)

      if (!value)
        return

      if (value.state === Entry.State.Completed || value.state == Entry.State.Cancelled)
        return

      value.attachments.push([ rest[1], rest[2] ])

      const date = new Date()
      const day = date.getDate()
      const month = date.getMonth() + 1

      value.comments.push(
        `<@${message.author.id}> *(${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')})* - Attached [*${rest[1]}*](${rest[2]})`
      )

      client.entries.set(idx, value)
      await Entry.update(client, value)

      return
    }

    const index = client.entries.findKey(e => e.author === message.author.id && e.state === Entry.State.Scaffolding)

    if (index === undefined)
      return

    const value = client.entries.get(index)!!
    value.attachments.push([ name, link ])

    client.entries.set(index, value)
    await Entry.update(client, value)
  }
}