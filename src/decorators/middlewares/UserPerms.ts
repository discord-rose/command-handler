import { createCommandDecorator } from '../../utils/Decorators'

import { PermissionUtils } from 'jadl'

export const UserPerms = createCommandDecorator<[
  permission: keyof typeof PermissionUtils['bits'] | Array<keyof typeof PermissionUtils['bits']>
]>(
  ([_perms], cmd) => {
    const perms = Array.isArray(_perms) ? _perms : [_perms]

    cmd.canRun.push(function CheckUserPermissions (int) {
      if (!int.member) return true

      const missing = perms.filter(x => !PermissionUtils.has(BigInt(int.member?.permissions!), x))

      if (missing.length > 0) {
        return false // TODO
      }

      return true
    })
  }
)