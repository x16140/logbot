import { Action, Params, Command, Ctx, Param } from '@cmdify/common'

import { Message, MessageEmbed, MessageReaction } from 'discord.js'

import { Entry } from '../model'
import { Bot } from '../bot'
import config from '../config'
import { promises as fs } from "fs"

const emojis = [ '❌', '🔶', '✅' ]

@Command({
  name: 'review',
  aliases: []
})
export class Review {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message,
    @Param(0) index: number
  ) {
    let unluckyMode = false

    if (!index) {
      const idx = client.entries.findKey(e => e.author === message.author.id && e.state === Entry.State.Scaffolding)

      if (idx === undefined)
        return

      index = idx

      const value = client.entries.get(index)!!

      if (value.approvals < 1)
        return

      value.state = Entry.State.InProgress
      value.timestamps.push(`Skipped Approval *(${new Date().toLocaleString('en-US')})*`)

      client.entries.set(index, value)
      unluckyMode = true
    }

    let value = client.entries.get(index)!!

    if (value.state !== Entry.State.InProgress)
      return

    value.state = value.approvals < 1
      ? Entry.State.Completed
      : Entry.State.WaitingReview

    const m = await Entry.update(client, value)
    client.entries.set(index, value)

    if (value.approvals < 1)
      return

    for (const user of message.guild?.members.cache.array().map(m => m.user) || [])
      if (!config.BLACKLIST.includes(user.id) && !user.bot && user.id !== message.author.id)
        await (await user.createDM())?.send(
          new MessageEmbed()
            .setColor('GOLD')
            .setTitle('Review Request')
            .setDescription(`Please review ${message.author.tag}'s log entry (${value.name}).\n\n> [Click Here to Review](${m.url})`)
        )

    const collector = m.createReactionCollector(
      (r: MessageReaction) => emojis.includes(r.emoji.name)
    )

    collector.on('collect', async r => {
      value = client.entries.get(index)!!

      const total = r.users.cache.array().filter(u => u.id !== message.author.id && !u.bot).length

      // if (r.emoji.name === '🔶' && total >= config.MAX_VOTES) {
      //   value.state = Entry.State.InProgress
      //
      //   collector.stop()
      //   client.entries.set(index, value)
      //   setTimeout(async () => await m.reactions.removeAll(), 2000)
      // }

      if (r.emoji.name === '✅' && total >= value.approvals) {
        value.state = Entry.State.Completed
        value.timestamps.push(`Reviewed by ${r.users.cache.array().filter(u => !u.bot && u.id !== value.author).map(u => u.username).join(', ')} *(${new Date().toLocaleString('en-US')})*`)

        collector.stop()
        client.entries.set(index, value)
        setTimeout(async () => await m.reactions.removeAll(), 2000)

        await (await message.author.createDM()).send(
          new MessageEmbed()
            .setColor('GOLD')
            .setTitle('Review Complete')
            .setDescription(`Your log entry "${value.name}" has been reviewed and approved.\n\n> [Click Here to View Status](${m.url})`)
        )

        await fs.appendFile('./log.tsv', `\nCompleted\t${value.name.replace(/\n/g, '//')}\t${value.description?.replace(/\n/g, '//')}\t${value.attachments.map(k => k[0] + ': ' + k[1]).join(', ').replace(/\n/g, '//')}\t${value.comments.join('―').replace(/\n/g, '//')}\t${value.timestamps.join(';')}`)
      }

      if (r.emoji.name === '❌' && r.users.cache.array().find(u => u.id === message.author.id)) {
        value.state = unluckyMode ? Entry.State.Cancelled : Entry.State.InProgress
        value.cancelledBy = '<Insufficient Reviews>'
        value.timestamps.push(`Review Cancelled *(${new Date().toLocaleString('en-US')})*`)

        collector.stop()
        client.entries.set(index, value)
        setTimeout(async () => await m.reactions.removeAll(), 2000)
      }

      if (r.emoji.name === '❌' && total > 0) {
        value.state = unluckyMode ? Entry.State.Cancelled : Entry.State.InProgress
        value.cancelledBy = '<Insufficient Reviews>'
        value.timestamps.push(`Review Failed *(${new Date().toLocaleString('en-US')})*`)

        collector.stop()
        client.entries.set(index, value)
        setTimeout(async () => await m.reactions.removeAll(), 2000)

        await (await message.author.createDM()).send(
          new MessageEmbed()
            .setColor('GOLD')
            .setTitle('Review Denied')
            .setDescription(`Your review request for entry "${value.name}" has been denied by ${
              r.users.cache.array().filter(u => u.id !== message.author.id && !u.bot)[0].tag
            }.\n\n> [Click Here to View Status](${m.url})`)
        )
      }

      await Entry.update(client, value)
    })

    for (const emoji of emojis)
      await m.react(emoji)
  }
}