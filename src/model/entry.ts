import { ColorResolvable, Message, MessageEmbed, TextChannel, User } from 'discord.js'
import { Client } from '@cmdify/common'

import config from '../config'
import { Bot } from '../bot'

export interface Entry {
  id: number

  message: string
  author: string

  name: string
  description?: string
  participants: string[]
  comments: string[]
  timestamps: string[]
  attachments: [string, string][]
  approvals: number
  state: Entry.State

  cancelledBy?: string
}

export namespace Entry {
  export enum State {
    Scaffolding,
    WaitingApproval,
    InProgress,
    WaitingReview,
    Completed,
    Cancelled
  }

  export const approvals = async (client: Client, entry: Entry): Promise<number> =>
    (await message(client, entry))
      .reactions.cache.array()
      .find(r => r.emoji.name === '✅')
      ?.users.cache.array()
      .filter(u => u.id !== entry.author && !u.bot)
      .length || 0

  export const skips = async (client: Client, entry: Entry): Promise<number> =>
    (await message(client, entry))
      .reactions.cache.array()
      .find(r => r.emoji.name === '🔶')
      ?.users.cache.array()
      .filter(u => u.id !== entry.author && !u.bot)
      .length || 0

  export const message = async (client: Client, entry: Entry): Promise<Message> =>
    await ((await client.channels.fetch(config.LOGS_CHANNEL)) as TextChannel)
      .messages
      .fetch(entry.message)

  export const author = async (client: Client, entry: Entry): Promise<User> =>
    await client.users.fetch(entry.author)

  export const embed = async (client: Bot, entry: Entry): Promise<MessageEmbed> => {
    const user = await author(client, entry)

    const embed = new MessageEmbed()
      .attachFiles(entry.attachments.map(v => v[1]))
      .setColor(color(entry))
      .setTitle(entry.name)
      .setFooter(
        `Log Entry #${entry.id} | By ${user.tag}`,
        user.displayAvatarURL()
      )

    if (entry.description)
      embed.setDescription(entry.description)

    if (entry.participants.length > 0)
      embed.addField('Participants', entry.participants.join('\n'))

    if (entry.attachments.length > 0)
      embed.addField('Attachments', entry.attachments.map(v => `[${v[0]}](${v[1]})`).join('\n'))

    if (entry.timestamps.length > 0)
      embed.addField('Timeline', entry.timestamps.join('\n'))

    if (entry.comments.length > 0)
      embed.addField('Comments', entry.comments.join('\n'))

    if (entry.approvals > 0 && entry.state === Entry.State.Scaffolding)
      embed.addField('Approvals Required', entry.approvals)

    embed.addField('Status', await status(client, entry))

    return embed
  }

  export const update = async (client: Bot, entry: Entry): Promise<Message> =>
    await (await Entry.message(client, entry))
      .edit(await Entry.embed(client, entry))

  export const color = (entry: Entry): ColorResolvable => [
    'WHITE',
    'GOLD',
    'BLUE',
    'PURPLE',
    'GREEN',
    'RED'
  ][entry.state]

  export const status = async (client: Client, entry: Entry): Promise<string> => [
    `Scaffolding`,
    `Awaiting Approval (${await approvals(client, entry)}/${entry.approvals}${await skips(client, entry) > 0 ? (await skips(client, entry) === 1 ? `, ${await skips(client, entry)} skip` : `, ${await skips(client, entry)} skips`) : ''})`,
    'In progress',
    `Awaiting Review (${await approvals(client, entry)}/${entry.approvals})`,
    'Completed',
    `Cancelled`
  ][entry.state]
}