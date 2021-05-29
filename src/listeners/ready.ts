import { Listener, On, Event, ReadyEvent, Ctx } from '@cmdify/common'
import { Bot } from '../bot'
import { Entry } from '../model'
import { MessageEmbed, MessageReaction, TextChannel } from 'discord.js'
import { promises as fs } from "fs"
import config from '../config'

const emojis = [ '❌', '🔶', '✅' ]

@Listener()
export class ReadyListener {
  @On()
  public async ready(@Event e: ReadyEvent, @Ctx client: Bot) {
    for (const entry of client.entries.array()) {
      try {
      if (entry.state === Entry.State.WaitingApproval) {
        let value = entry
        let message = { author: (await client.users.fetch(entry.author)) }
        let m = await (await client.channels.fetch(config.LOGS_CHANNEL) as TextChannel).messages.fetch(entry.message)
        let index = entry.id

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

      }

      if (entry.state === Entry.State.WaitingReview) {
        let unluckyMode = false
        let value = entry
        let message = { author: (await client.users.fetch(entry.author)) }
        let m = await (await client.channels.fetch(config.LOGS_CHANNEL) as TextChannel).messages.fetch(entry.message)
        let index = entry.id

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
      }
      } catch(e) {}
    }


    console.log('Ready!')
  }
}