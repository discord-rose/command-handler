import { Decorators } from '../../utils/Decorators'

import { ApplicationCommandType } from 'discord-api-types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createTargetDecorator = (prop: 'users' | 'members' | 'messages') => {
  return Decorators.createParameterDecorator(() => {
    return (int) => {
      const resolved = int.data.resolved

      if (int.data.type !== ApplicationCommandType.Message && int.data.type !== ApplicationCommandType.User) { throw new Error('Used an @Target decorator when the command type doesn\'t support targets') }
      if (!int.data.target_id) throw new Error('Used @Target and no target_id was provided')
      if (!resolved) throw new Error('Used @Target and no objects were resolved')

      const resolvedTarget = prop in resolved ? resolved?.[prop]?.[int.data.target_id] : undefined

      return resolvedTarget
    }
  })
}

export const Targets = {
  User: createTargetDecorator('users'),
  Member: createTargetDecorator('members'),

  Message: createTargetDecorator('messages')
}
