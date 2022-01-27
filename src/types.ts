import { APIApplicationCommandInteraction, APIApplicationCommandOptionChoice, ApplicationCommandOptionType } from 'discord-api-types'

export type CommandInteraction = APIApplicationCommandInteraction & {
  responded?: boolean
}

interface APIApplicationCommandOptionBase {
  type:
  | ApplicationCommandOptionType.Boolean
  | ApplicationCommandOptionType.User
  | ApplicationCommandOptionType.Channel
  | ApplicationCommandOptionType.Role
  | ApplicationCommandOptionType.Mentionable
  name: string
  description: string
  default?: boolean
  required?: boolean
}

/**
 * This type is exported as a way to make it stricter for you when you're writing your commands
 *
 * In contrast to `APIApplicationCommandSubCommandOptions`, these types cannot have an `options` array,
 * but they can have a `choices` one
 */
export interface APIApplicationCommandArgumentOptions extends Omit<APIApplicationCommandOptionBase, 'type'> {
  type:
  | ApplicationCommandOptionType.String
  | ApplicationCommandOptionType.Integer
  | ApplicationCommandOptionType.Number
  choices?: APIApplicationCommandOptionChoice[]
}
