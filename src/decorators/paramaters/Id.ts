import { Decorators } from '../../utils/Decorators'

export const Id = Decorators.createParamaterDecorator((options, command) => {
  return (int) => {
    return int.id
  }
})
