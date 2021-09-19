import { Symbols } from '../Symbols'

import type { RESTPostAPIChatInputApplicationCommandsJSONBody, Snowflake } from 'discord-api-types'
import { Worker } from 'jadl'
import { CommandInteraction } from '../types'

export interface CommandMeta {
  canRun: Array<RunningFunction<boolean>>
  onRun: Array<RunningFunction<void>>
  name: string|symbol
  params: ParamResolver[]
  method: string
}

type ParamResolver = (int: CommandInteraction, worker: Worker) => any
type RunningFunction <R extends any> = (interaction: CommandInteraction, worker: Worker) => R | Promise<R>

const baseSymbols = {
  [Symbols.commandName]: '',
  [Symbols.aliases]: [] as string[],
  [Symbols.interaction]: {} as RESTPostAPIChatInputApplicationCommandsJSONBody,

  [Symbols.guild]: undefined as Snowflake|undefined,

  [Symbols.commands]: [] as CommandMeta[]
}

export type BaseSymbols = typeof baseSymbols

export type baseDecorator <O extends any> = (options: O, command: BaseSymbols) => void | Promise<void>
export type commandDecorator <O extends any> = (options: O, command: CommandMeta, base: BaseSymbols, descriptor: TypedPropertyDescriptor<Function>) => void | Promise<void>
export type parameterDecorator <O extends any> = (options: O, command: CommandMeta, base: BaseSymbols) => ParamResolver

export const Decorators = {
  createBaseDecorator: <O extends any[] = undefined[]> (handler: baseDecorator<O>): (...options: O) => ClassDecorator => {
    return function (...options): ClassDecorator {
      return function (target: any) {
        [Symbols.commandName, Symbols.aliases, Symbols.interaction, Symbols.guild].forEach(symbol => {
          if (target[symbol] === undefined && baseSymbols[symbol]) {
            target[symbol] = new baseSymbols[symbol].constructor()
          } else if (!Object.hasOwnProperty.call(target, symbol)) {
            if (baseSymbols[symbol]) {
              target[symbol] = Object.assign(
                target[symbol],
                new baseSymbols[symbol].constructor()
              )
            }
          }
        })

        void handler(options, target)
      }
    }
  },

  setupCommandMeta: (target: BaseSymbols) => {
    if (target[Symbols.commands] === undefined) {
      target[Symbols.commands] = []
    } else if (!Object.hasOwnProperty.call(target, Symbols.commands)) {
      target[Symbols.commands] = [...target[Symbols.commands]]
    }

    if (!target[Symbols.interaction]) target[Symbols.interaction] = { name: 'null', description: 'null' }
  },

  getCommandMeta (target: BaseSymbols, method: string) {
    let command = target[Symbols.commands].find(x => x.method === method)
    if (!command) {
      command = {
        canRun: [],
        onRun: [],
        method,
        params: [],
        name: ''
      }

      target[Symbols.commands].push(command)
    }

    return command
  },

  createCommandDecorator: <O extends any[] = undefined[]> (running: commandDecorator<O>): (...options: O) => MethodDecorator => {
    return function (...options) {
      return function (target: BaseSymbols, method: string, descriptor: TypedPropertyDescriptor<any>) {
        Decorators.setupCommandMeta(target)

        const command = Decorators.getCommandMeta(target, method)

        void running(options, command, target, descriptor)
      }
    }
  },

  createParameterDecorator: <O extends any[] = undefined[]> (paramHandler: parameterDecorator<O>): (...options: O) => ParameterDecorator => {
    return function (...options): ParameterDecorator {
      return function (target: BaseSymbols, method: string, index: number) {
        Decorators.setupCommandMeta(target)

        const command = Decorators.getCommandMeta(target, method)

        const fn = paramHandler(options, command, target)

        command.params[index] = fn
      }
    }
  }
}
