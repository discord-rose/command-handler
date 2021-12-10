import { SimpleError } from '../../structures/SimpleError'
import { Decorators } from '../../utils/Decorators'

export const Guild = Decorators.createParameterDecorator<[ required?: boolean ]>(([required]) => {
  return (int, { worker }) => {
    if (!int.guild_id && required) throw new SimpleError('Command is only availabe when used in a server')

    if (!int.guild_id) return undefined

    return worker.guilds.get(int.guild_id)
  }
})
