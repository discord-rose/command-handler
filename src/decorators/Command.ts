import { ApplicationCommandType } from 'discord-api-types/v9'
import { Symbols } from '../Symbols'
import { Decorators } from '../utils/Decorators'

export const Command = Decorators.createBaseDecorator<
  [name: string, description?: string, type?: ApplicationCommandType]
>(([name, description, type], command) => {
  command[Symbols.commandName] = name

  const interaction = command[Symbols.interaction]

  interaction.name = name
  interaction.type = type ?? ApplicationCommandType.ChatInput
  if (!interaction.default_member_permissions)
    interaction.default_member_permissions = null

  if (interaction.type === ApplicationCommandType.ChatInput) {
    interaction.description = description ?? 'Missing Description'
  }
})
