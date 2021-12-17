import { APIApplicationCommandInteractionDataOption, APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types'
import { Symbols } from '../..'
import { APIApplicationCommandArgumentOptions } from '../../types'
import { Decorators } from '../../utils/Decorators'

export const CommandOption = Decorators.createParameterDecorator<[
  data: APIApplicationCommandOption & Omit<APIApplicationCommandArgumentOptions, 'type'>
]>(([data], cmd, base) => {
  if (!base[Symbols.interaction].options) base[Symbols.interaction].options = []

  if (!cmd.interactionOptions) cmd.interactionOptions = []
  cmd.interactionOptions.push(data)

  return (int) => {
    if (int.data.type !== ApplicationCommandType.ChatInput) return

    let val: APIApplicationCommandInteractionDataOption | undefined
    if (cmd.name !== Symbols.baseCommand) {
      const subCommand = int.data.options?.find(x => x.name === cmd.name)
      if (subCommand?.type === ApplicationCommandOptionType.Subcommand) {
        val = subCommand.options?.find(x => x.name === data.name)
      }
    } else {
      val = int.data.options?.find(x => x.name === data.name)
    }

    if (!val) return undefined

    if (!('value' in val)) return

    return val.value
  }
})

const CreateOption = (type: ApplicationCommandOptionType) => {
  return (name: string, description: string, options?: Omit<APIApplicationCommandArgumentOptions, 'type' | 'name' | 'description'>) => CommandOption({ type, name, description, ...options } as any)
}

export const Options = {
  String: CreateOption(ApplicationCommandOptionType.String),
  Integer: CreateOption(ApplicationCommandOptionType.Integer),
  Boolean: CreateOption(ApplicationCommandOptionType.Boolean),
  User: CreateOption(ApplicationCommandOptionType.User),
  Channel: CreateOption(ApplicationCommandOptionType.Channel),
  Role: CreateOption(ApplicationCommandOptionType.Role),
  Mentionable: CreateOption(ApplicationCommandOptionType.Mentionable),
  Number: CreateOption(ApplicationCommandOptionType.Number)
}
