import { Decorators } from '../../utils/Decorators'

export const Id = Decorators.createParameterDecorator((options, command) => {
  return (int) => {
    return int.id
  }
})
