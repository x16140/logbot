import { Action, Command, Ctx, Params } from '@cmdify/common'

import { Message, TextChannel } from 'discord.js'

import { Bot } from '../bot'

@Command({
  name: 'eval'
})
export class Eval {
  @Action()
  public async run(
    @Ctx client: Bot,
    @Ctx channel: TextChannel,
    @Ctx message: Message,
    @Params args: string[]
  ) {
    await channel.send(`\`\`\`${eval(args.join(' '))}\`\`\``)
  }
}