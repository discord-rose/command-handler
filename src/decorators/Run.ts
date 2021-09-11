import { Symbols } from '../symbols'
import { createCommandDecorator } from '../utils/Decorators'

export const Run = createCommandDecorator((_, cmd) => {
  cmd.name = Symbols.baseCommand
})
