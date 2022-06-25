import { SimpleError } from '../../structures/SimpleError'
import { Decorators } from '../../utils/Decorators'

export const Member = Decorators.createParameterDecorator(() => {
  return (int) => {
    if (!int.member)
      throw new SimpleError('Command is only availabe when used in a server')

    return int.member
  }
})
