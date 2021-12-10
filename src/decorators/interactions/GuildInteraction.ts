import { Snowflake } from 'discord-api-types'
import { Symbols } from '../..'
import { Decorators } from '../../utils/Decorators'

export const GuildInteraction = Decorators.createBaseDecorator<[ id: Snowflake ]>(([id], cmd) => {
  cmd[Symbols.guild] = id
})
