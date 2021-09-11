import { APIApplicationCommandOption, ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types'
import { Symbols } from '../..'
import { Decorators } from '../../utils/Decorators'

export const CommandOption = Decorators.createParamaterDecorator<[
  data: APIApplicationCommandOption
]>(([data], _cmd, base) => {
  if (!base[Symbols.interaction].options) base[Symbols.interaction].options = []

  base[Symbols.interaction].options?.push(data)

  return (int) => {
    if (int.data.type !== ApplicationCommandType.ChatInput) return

    const val = int.data.options?.find(x => x.name === data.name)

    if (!val) return undefined

    if (!('value' in val)) return

    return val.value
  }
})

const CreateOption = (type: ApplicationCommandOptionType) => {
  return (name: string, description: string, required?: boolean) => CommandOption({ type, name, description, required })
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
