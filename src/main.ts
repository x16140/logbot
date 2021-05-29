import 'reflect-metadata'

import { MainModule } from '@cmdify/core'
import { Init } from '@cmdify/common'

import * as commands from './commands'
import * as listeners from './listeners'

import { Bot } from './bot'

@MainModule({
  name: 'module:main',
  token: process.env.TOKEN,

  prefix: '.',

  client: Bot,

  commands: Object.values(commands),
  listeners: Object.values(listeners)
})
class Main {
  @Init()
  public async init() {
    console.log('Initialized!')
  }
}
