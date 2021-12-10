import { APIChatInputApplicationCommandInteraction } from 'discord-api-types'

export interface CommandInteraction extends APIChatInputApplicationCommandInteraction {
  responded?: boolean
}
