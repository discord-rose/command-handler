import { Decorators } from '../../utils/Decorators'

import { humanReadablePermissions, PermissionUtils } from 'jadl'
import { CommandError } from '../../structures/CommandError'
import { Embed } from '@jadl/embed'

export const UserPerms = Decorators.createCommandDecorator<[
  permission: keyof typeof PermissionUtils['bits'] | Array<keyof typeof PermissionUtils['bits']>
]>(
  ([_perms], cmd) => {
    const perms = Array.isArray(_perms) ? _perms : [_perms]

    cmd.canRun.push(function CheckUserPermissions (int) {
      if (!int.member) return true

      const missing = perms.filter(x => !PermissionUtils.has(BigInt(int.member!.permissions), x))

      if (missing.length > 0) {
        throw new CommandError(new Embed()
          .color('Red')
          .description(`You're missing the following permissions: ${missing.map(x => humanReadablePermissions[x]).join(', ')}`)
        )
      }

      return true
    })
  }
)
