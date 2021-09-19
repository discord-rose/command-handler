import { Symbols } from '../Symbols'
import { Decorators, ParamResolver } from '../utils/Decorators'

export const Run = Decorators.createCommandDecorator((_, cmd, base, descriptor) => {
  cmd.name = Symbols.baseCommand

  const method = descriptor.value!

  descriptor.value = function (int, handler) {
    const args = [int, handler]
    cmd.params.forEach((param, i) => {
      args[i] = param(int, handler)
    })

    return method.bind(this)(...args)
  } as ParamResolver
})
