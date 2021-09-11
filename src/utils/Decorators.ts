import { Symbols } from '../symbols'

import type { APIApplicationCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types'

export interface CommandMeta {
  canRun: Array<(interaction: APIApplicationCommandInteraction) => boolean | Promise<boolean>>
  name: string|symbol
  method: string
}

const baseSymbols = {
  [Symbols.commandName]: '',
  [Symbols.aliases]: [] as string[],
  [Symbols.interaction]: {} as RESTPostAPIChatInputApplicationCommandsJSONBody,

  [Symbols.commands]: [] as CommandMeta[]
}

export type BaseSymbols = typeof baseSymbols

export type baseDecorator <O extends any> = (options: O, command: BaseSymbols) => void | Promise<void>

export const createBaseDecorator = <O extends any[] = undefined[]> (handler: baseDecorator<O>): (...options: O) => ClassDecorator => {
  return function (...options): ClassDecorator {
    return function (target: any) {
      [Symbols.commandName, Symbols.aliases, Symbols.interaction].forEach(symbol => {
        if (target[symbol] === undefined) {
          target[symbol] = new baseSymbols[symbol].constructor()
        } else if (!target.hasOwnProperty(symbol)) {
          target[symbol] = Object.assign(target[symbol], new baseSymbols[symbol].constructor())
        }
      })

      handler(options, target)
    }
  }
}

export type commandDecorator <O extends any> = (options: O, command: CommandMeta, base: BaseSymbols) => void | Promise<void>

export const createCommandDecorator = <O extends any[] = undefined[]> (running: commandDecorator<O>): (...options: O) => MethodDecorator => {
  return function (...options): MethodDecorator {
    return function (target: BaseSymbols, method: string) {
      if (target[Symbols.commands] === undefined) {
        target[Symbols.commands] = []
      } else if (!target.hasOwnProperty(Symbols.commands)) {
        target[Symbols.commands] = [ ...target[Symbols.commands] ]
      }

      if (!target[Symbols.interaction]) target[Symbols.interaction] = { name: 'null', description: 'null' }

      let command = target[Symbols.commands].find(x => x.method === method)
      if (!command) {
        command = {
          canRun: [],
          method,
          name: ''
        }

        target[Symbols.commands].push(command)
      }

      running(options, command, target)
    }
  }
}
