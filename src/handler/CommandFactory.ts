import { Symbols } from '../Symbols'
import { BaseSymbols } from '../utils/Decorators'

export class CommandFactory {
  commands: BaseSymbols[] = []

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  static commandToJson (cmd: BaseSymbols) {
    const json = {
      name: cmd[Symbols.commandName],
      aliases: cmd[Symbols.aliases],
      interaction: cmd[Symbols.interaction],
      commands: cmd[Symbols.commands].map(x => ({
        ...x,
        name: x.name === Symbols.baseCommand ? 'baseCommand' : x.name,
        canRun: x.canRun.map(fn => fn.name)
      }))
    }

    Object.getOwnPropertySymbols(cmd).forEach(sym => {
      json[sym] = cmd[sym]
    })

    return json
  }

  constructor (commands: Array<new() => any>) {
    commands.forEach(Command => {
      const cmd = new Command()

      Object.getOwnPropertySymbols(Command).concat(Object.getOwnPropertySymbols(cmd)).forEach(symbol => {
        if (cmd[symbol]) cmd[symbol] = Object.assign(cmd[symbol], Command[symbol])
        else cmd[symbol] = Command[symbol]
      })

      this.commands.push(cmd)
    })
  }

  findCommand (name: string): BaseSymbols | undefined {
    return this.commands.find(cmd => cmd[Symbols.commandName] === name || cmd[Symbols.aliases].includes(name))
  }
}
