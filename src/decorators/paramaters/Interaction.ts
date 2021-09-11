import { Decorators } from '../../utils/Decorators'

export const Interaction = Decorators.createParamaterDecorator(() => {
  return (int) => int
})
