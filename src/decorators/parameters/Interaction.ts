import { Decorators } from '../../utils/Decorators'

export const Interaction = Decorators.createParameterDecorator(() => {
  return (int) => int
})
