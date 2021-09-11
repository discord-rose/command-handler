import { Symbols } from '../Symbols'
import { Decorators } from '../utils/Decorators'

export const Command = Decorators.createBaseDecorator<[
  name: string,
  description?: string
]>(([name, description], command) => {
  command[Symbols.commandName] = name

  command[Symbols.interaction].name = name
  command[Symbols.interaction].description = description ?? 'Missing Description'
})
