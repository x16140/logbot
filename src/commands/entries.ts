import { Action, Command, Ctx } from '@cmdify/common'

import { TextChannel } from 'discord.js'

import { Bot } from '../bot'

@Command({
  name: 'entries',
  aliases: ['totalentries', 'count']
})
export class Entries {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx channel: TextChannel
  ) {
    await channel.send(`Tracking: ${client.entries.size - 1}\nTotal: ${client.data.ensure('id', 0) - 1}`)
  }
}