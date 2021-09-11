import { APIInteraction, GatewayInteractionCreateDispatchData, InteractionType } from 'discord-api-types'
import { DiscordEventMap } from 'jadl'
import { Symbols } from '../symbols'
import { BaseSymbols } from '../utils/Decorators'

export class CommandFactory {
  commands: BaseSymbols[] = []

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

  constructor (commands: { new(): any }[]) {
    commands.forEach(Command => {
      const cmd = new Command()

      Object.getOwnPropertySymbols(Command).concat(Object.getOwnPropertySymbols(cmd)).forEach(symbol => {
        if (cmd[symbol]) cmd[symbol] = Object.assign(cmd[symbol], Command[symbol])
        else cmd[symbol] = Command[symbol]
      })

      console.log(JSON.stringify(CommandFactory.commandToJson(cmd), null, 4))

      this.commands.push(cmd)
    })
  }

  findCommand (name: string): BaseSymbols | undefined {
    return this.commands.find(cmd => cmd[Symbols.commandName] === name || cmd[Symbols.aliases].includes(name))
  }

  handleInteraction (interaction: DiscordEventMap['INTERACTION_CREATE']) {
    if (interaction.type !== InteractionType.ApplicationCommand) return

    const command = this.findCommand(interaction.data.name)
    if (!command) return

    // TODO sub commands

    const baseCommand = command[Symbols.commands].find(x => x.name === Symbols.baseCommand)
    if (!baseCommand) return

    command[baseCommand.method]?.()
  }
}
