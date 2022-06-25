import { Symbols } from '../Symbols'
import { Decorators, ParamResolver } from '../utils/Decorators'

export const Run = Decorators.createCommandDecorator<[dontImply?: boolean]>(
  ([dontImply], cmd, base, descriptor) => {
    cmd.name = Symbols.baseCommand

    if (cmd.interactionOptions && !dontImply) {
      base[Symbols.interaction].options = cmd.interactionOptions
    }

    const method = descriptor.value!

    descriptor.value = async function (int, handler) {
      const args = [int, handler]

      for (let i = 0; i < cmd.params.length; i++) {
        args[i] = await cmd.params[i](int, handler)
      }

      return method.bind(this)(...args)
    } as ParamResolver
  }
)
