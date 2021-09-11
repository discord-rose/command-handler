import { Symbols } from '../Symbols'
import { Decorators } from '../utils/Decorators'

export const Alias = Decorators.createBaseDecorator<[
  alias: string | string[],
  thing: 'a'
]>(([alias], command) => {
  const aliases = command[Symbols.aliases]

  if (Array.isArray(alias)) aliases.push(...alias)
  else aliases.push(alias)
})
