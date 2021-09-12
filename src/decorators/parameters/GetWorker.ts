import { Decorators } from '../../utils/Decorators'

export const GetWorker = Decorators.createParameterDecorator((opt, cmd, base) => {
  return (_int, worker) => worker
})
