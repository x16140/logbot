import { promises as fs } from 'fs'

import { Action, Command, Ctx, Param } from '@cmdify/common'

import { Message } from 'discord.js'
import { Bot } from '../bot'
import { Entry } from '../model'

@Command({
  name: 'complete',
  aliases: ['finish']
})
export class Complete {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Param(0) index: number
  ) {
    if (!index)
      return

    const value = client.entries.get(index)

    if (!value)
      return

    if (value.state !== Entry.State.InProgress)
      return


    value.state = Entry.State.Completed
    value.timestamps.push(`Completed by ${message.author.tag} *(${new Date().toLocaleString('en-US')})*`)

    client.entries.set(index, value)
    await Entry.update(client, value)

    await fs.appendFile('./log.tsv', `\nCompleted\t${value.name.replace(/\n/g, '//')}\t${value.description?.replace(/\n/g, '//')}\t${value.attachments.map(k => k[0] + ': ' + k[1]).join(', ').replace(/\n/g, '//')}\t${value.comments.join('―').replace(/\n/g, '//')}\t${value.timestamps.join(';')}`)
  }
}