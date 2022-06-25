import { PermissionUtils } from 'jadl'
import { Symbols } from '../../Symbols'
import { Decorators } from '../../utils/Decorators'

export const Permissions = Decorators.createBaseDecorator<
  [
    permissions:
      | keyof typeof PermissionUtils['bits']
      | Array<keyof typeof PermissionUtils['bits']>
  ]
>(([permissions], base) => {
  let bit = 0n
  if (Array.isArray(permissions)) {
    permissions.forEach((perm) => {
      bit |= PermissionUtils.bits[perm]
    })
  } else {
    bit |= PermissionUtils.bits[permissions]
  }

  base[Symbols.interaction].default_member_permissions = String(bit)
})
