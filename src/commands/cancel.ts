import { Action, Command, Ctx, Param } from '@cmdify/common'

import { Message } from 'discord.js'
import { Bot } from '../bot'
import { Entry } from '../model'
import { promises as fs } from "fs"

@Command({
  name: 'cancel',
  aliases: ['stop', 'abort']
})
export class Cancel {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Param(0) index: number
  ) {
    if (!index) {
      const index = client.entries.findKey(e => e.author === message.author.id && e.state === Entry.State.Scaffolding)

      if (index === undefined)
        return

      const value = client.entries.get(index)!!

      await (await Entry.message(client, value)).delete()

      value.cancelledBy = message.author.tag
      value.state = Entry.State.Cancelled

      client.entries.delete(index)
      return
    }

    const value = client.entries.get(index)

    if (!value)
      return

    if (value.state === Entry.State.Completed || value.state === Entry.State.Scaffolding)
      return

    if (value.author === message.author.id && (value.state === Entry.State.WaitingApproval || value.state === Entry.State.InProgress && value.approvals === 0)) {
      await (await Entry.message(client, value)).delete()
      return
    }

    value.cancelledBy = message.author.tag
    value.state = Entry.State.Cancelled
    value.timestamps.push(`Cancelled by ${message.author.tag} *(${new Date().toLocaleString('en-US')})*`)

    client.entries.set(index, value)
    await (await Entry.message(client, value)).reactions.removeAll()
    await Entry.update(client, value)

    await fs.appendFile('./log.tsv', `\nCancelled (by ${message.author.username})\t${value.name.replace(/\n/g, '//')}\t${value.description?.replace(/\n/g, '//')}\t${value.attachments.map(k => k[0] + ': ' + k[1]).join(', ').replace(/\n/g, '//')}\t${value.comments.join('―').replace(/\n/g, '//')}\t${value.comments.join('―').replace('\n', '//')}\t${value.timestamps.join(';')}`)
  }
}