import { APIApplicationCommandOption, ApplicationCommandOptionType } from 'discord-api-types'
import { Symbols } from '../..'
import { createCommandDecorator } from '../../utils/Decorators'

export const CommandOption = createCommandDecorator<[
  data: APIApplicationCommandOption
]>(([data], _cmd, base) => {
  if (!base[Symbols.interaction].options) base[Symbols.interaction].options = []

  base[Symbols.interaction].options?.push(data)
})

export const Options = {
  Boolean: (name: string, description: string) => CommandOption({ type: ApplicationCommandOptionType.Boolean, name, description })
}
