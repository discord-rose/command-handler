import { Decorators } from '../../utils/Decorators'

export const Author = Decorators.createParameterDecorator(() => {
  return (int) => int.user ?? int.member?.user
})
