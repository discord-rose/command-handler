import { Symbols } from '../symbols'
import { createBaseDecorator } from '../utils/Decorators'

export const Command = createBaseDecorator<[
  name: string,
  description?: string
]>(([name, description], command) => {
  command[Symbols.commandName] = name

  command[Symbols.interaction].name = name
  command[Symbols.interaction].description = description || 'Missing Description'
})
