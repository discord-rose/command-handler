import { Worker } from 'jadl'
import { Symbols } from '../Symbols'
import { CommandInteraction } from '../types'
import { Decorators } from '../utils/Decorators'

export const Run = Decorators.createCommandDecorator((_, cmd, base, descriptor) => {
  cmd.name = Symbols.baseCommand

  const method = descriptor.value!

  descriptor.value = function (int: CommandInteraction, worker?: Worker) {
    const args = [int, worker]
    cmd.params.forEach((param, i) => {
      args[i] = param(int, worker!)
    })

    return method.bind(this)(...args)
  }
})
