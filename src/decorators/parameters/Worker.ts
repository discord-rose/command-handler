import { Decorators } from '../../utils/Decorators'

export const Worker = Decorators.createParameterDecorator((opt, cmd, base) => {
  return (_int, { worker }) => worker
})
