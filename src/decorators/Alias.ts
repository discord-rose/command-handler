import { Symbols } from '../symbols'
import { createBaseDecorator } from '../utils/Decorators'

export const Alias = createBaseDecorator<[
  alias: string | string[],
  thing: 'a'
]>(([alias], command) => {
  const aliases = command[Symbols.aliases]

  if (Array.isArray(alias)) aliases.push(...alias)
  else aliases.push(alias)
})
