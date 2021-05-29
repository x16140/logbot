import { Action, Params, Command, Ctx, Param } from '@cmdify/common'

import { Message, MessageEmbed, MessageReaction } from 'discord.js'

import { Entry } from '../model'
import { Bot } from '../bot'
import config from '../config'
import { promises as fs } from "fs"

const emojis = [ '❌', '🔶', '✅' ]

@Command({
  name: 'commit',
  aliases: ['save', 'publish']
})
export class Commit {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx message: Message
  ) {
    const index = client.entries.findKey(e => e.author === message.author.id && e.state === Entry.State.Scaffolding)

    if (index === undefined)
      return

    let value = client.entries.get(index)!!

    value.state = value.approvals < 1
      ? Entry.State.InProgress
      : Entry.State.WaitingApproval

    const m = await Entry.update(client, value)

    client.entries.set(index, value)

    if (value.approvals < 1)
      return

    for (const user of message.guild?.members.cache.array().map(m => m.user) || [])
      if (!config.BLACKLIST.includes(user.id) && !user.bot && user.id !== message.author.id)
        await (await user.createDM())?.send(
          new MessageEmbed()
            .setColor('GOLD')
            .setTitle('Approval Request')
            .setDescription(`Please approve/deny ${message.author.tag}'s request for approval.\n\n> [Click Here to Review](${m.url})`)
        )

    const collector = m.createReactionCollector(
      (r: MessageReaction) => emojis.includes(r.emoji.name)
    )

    collector.on('collect', async r => {
      value = client.entries.get(index)!!

      const total = r.users.cache.array().filter(u => u.id !== message.author.id && !u.bot).length

      if (r.emoji.name === '❌' && r.users.cache.array().find(u => u.id === message.author.id)) {
        // value.cancelledBy = message.author.tag
        // value.state = Entry.State.Cancelled
        // value.timestamps.push(`Cancelled by ${value.cancelledBy} *(${new Date().toLocaleString('en-US')})*`)
        //
        // collector.stop()
        // client.entries.set(index, value)
        // setTimeout(async () => await m.reactions.removeAll(), 2000)
        await (await Entry.message(client, value)).delete()
        return
        // await fs.appendFile('./log.tsv', `\nCancelled (by author)\t${value.name.replace(/\n/g, '//')}\t${value.description?.replace(/\n/g, '//')}\t${value.attachments.map(k => k[0] + ': ' + k[1]).join(', ').replace(/\n/g, '//')}\t${value.comments.join('―').replace(/\n/g, '//')}\t${value.timestamps.join(';')}`)
      }

      if (r.emoji.name === '✅' && total >= value.approvals) {
        value.state = Entry.State.InProgress
        value.timestamps.push(`Approved by ${r.users.cache.array().filter(u => !u.bot && u.id !== value.author).map(u => u.username).join(', ')} *(${new Date().toLocaleString('en-US')})*`)

        collector.stop()
        client.entries.set(index, value)
        setTimeout(async () => await m.reactions.removeAll(), 2000)

        await (await message.author.createDM()).send(
          new MessageEmbed()
            .setColor('GOLD')
            .setTitle('Approval Granted')
            .setDescription(`Your log entry "${value.name}" has been approved.\n\n> [Click Here to View Status](${m.url})`)
        )

        await fs.appendFile('./log.tsv', `\nCompleted\t${value.name.replace(/\n/g, '//')}\t${value.description?.replace(/\n/g, '//')}\t${value.attachments.map(k => k[0] + ': ' + k[1]).join(', ').replace(/\n/g, '//')}\t${value.comments.join('―').replace(/\n/g, '//')}\t${value.timestamps.join(';')}`)
      }

      if ((r.emoji.name === '❌' || r.emoji.name === '🔶') && total > config.MAX_VOTES - value.approvals) {
        value.cancelledBy = '<Insufficient Approval>'
        value.state = Entry.State.Cancelled
        value.timestamps.push(`Approval Denied *(${new Date().toLocaleString('en-US')})*`)

        collector.stop()
        client.entries.set(index, value)
        setTimeout(async () => await m.reactions.removeAll(), 2000)

        await (await message.author.createDM()).send(
          new MessageEmbed()
            .setColor('GOLD')
            .setTitle('Approval Denied')
            .setDescription(`Your log entry "${value.name}" has been denied.\n\n> [Click Here to View Status](${m.url})`)
        )

        await fs.appendFile('./log.tsv', `\nCancelled (Approval Denied)\t${value.name.replace(/\n/g, '//')}\t${value.description?.replace(/\n/g, '//')}\t${value.attachments.map(k => k[0] + ': ' + k[1]).join(', ').replace(/\n/g, '//')}\t${value.comments.join('―').replace(/\n/g, '//')}\t${value.timestamps.join(';')}`)
      }

      await Entry.update(client, value)
    })

    for (const emoji of emojis)
      await m.react(emoji)
  }
}