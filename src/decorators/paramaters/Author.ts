import { Decorators } from '../../utils/Decorators'

export const Author = Decorators.createParamaterDecorator(() => {
  return (int) => int.user ?? int.member?.user
})
