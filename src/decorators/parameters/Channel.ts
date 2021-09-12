import { Decorators } from '../../utils/Decorators'

export const Channel = Decorators.createParameterDecorator(() => {
  return (int, worker) => {
    if (!int.channel_id) return undefined

    return worker.channels.get(int.channel_id)
  }
})
