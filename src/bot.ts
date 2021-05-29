import { Bot as CmdifyBot } from '@cmdify/core'

import Enmap from 'enmap'

import { Entry } from './model'

export class Bot extends CmdifyBot {
  public entries = new Enmap<number, Entry>({
    name: 'entries',
    fetchAll: true
  })

  public data = new Enmap<string, any>({
    name: 'data',
    fetchAll: true
  })

  public get cid(): number {
    const id = this.data.ensure('id', 1)
    this.data.set('id', id + 1)

    return id
  }
}