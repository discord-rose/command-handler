import { ApplicationCommandType } from 'discord-api-types/v9'
import { Symbols } from '../Symbols'
import { Decorators } from '../utils/Decorators'

export const Command = Decorators.createBaseDecorator<[
  name: string,
  description?: string,
  type?: ApplicationCommandType
]>(([name, description, type], command) => {
  command[Symbols.commandName] = name

  const interaction = command[Symbols.interaction]

  interaction.name = name
  interaction.type = type ?? ApplicationCommandType.ChatInput

  if (interaction.type === ApplicationCommandType.ChatInput) {
    interaction.description = description ?? 'Missing Description'
  }
})
