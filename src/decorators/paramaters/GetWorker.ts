import { Decorators } from '../../utils/Decorators'

export const GetWorker = Decorators.createParamaterDecorator((opt, cmd, base) => {
  return (_int, worker) => worker
})
