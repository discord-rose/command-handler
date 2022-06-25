import { Snowflake } from 'discord-api-types/v9'
import { Symbols } from '../..'
import { Decorators } from '../../utils/Decorators'

export const GuildInteraction = Decorators.createBaseDecorator<[id: Snowflake]>(
  ([id], cmd) => {
    cmd[Symbols.guild] = id
  }
)
