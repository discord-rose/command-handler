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

export const Options = {
  String: (name: string, description: string) => CommandOption({ type: ApplicationCommandOptionType.String, name, description }),
  Integer: (name: string, description: string) => CommandOption({ type: ApplicationCommandOptionType.Integer, name, description }),
  Boolean: (name: string, description: string) => CommandOption({ type: ApplicationCommandOptionType.Boolean, name, description }),
  User: (name: string, description: string) => CommandOption({ type: ApplicationCommandOptionType.User, name, description }),
  Channel: (name: string, description: string) => CommandOption({ type: ApplicationCommandOptionType.Channel, name, description }),
  Role: (name: string, description: string) => CommandOption({ type: ApplicationCommandOptionType.Role, name, description }),
  Mentionable: (name: string, description: string) => CommandOption({ type: ApplicationCommandOptionType.Mentionable, name, description }),
  Number: (name: string, description: string) => CommandOption({ type: ApplicationCommandOptionType.Number, name, description })
}
