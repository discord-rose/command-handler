import { SimpleError } from '../../structures/SimpleError'
import { Decorators } from '../../utils/Decorators'

export const Me = Decorators.createParameterDecorator(() => {
  return (int, { worker }) => {
    if (!int.guild_id)
      throw new SimpleError('Command is only availabe when used in a server')

    return worker.selfMember.get(int.guild_id)
  }
})
