import { ApplicationCommandOptionType } from 'discord-api-types/v9'
import { Symbols } from '../../Symbols'
import { Decorators } from '../../utils/Decorators'
import { Run } from '../Run'

export const SubCommand = Decorators.createCommandDecorator<
  [name: string, description: string]
>(([name, description], cmd, base) => {
  cmd.name = name
  if (!base[Symbols.interaction].options) base[Symbols.interaction].options = []
  base[Symbols.interaction].options!.push({
    name,
    description,
    type: ApplicationCommandOptionType.Subcommand
  })

  if (cmd.interactionOptions) {
    ;(
      base[Symbols.interaction].options!.find((x) => x.name === name) as any
    ).options = cmd.interactionOptions
  }
}, Run(true))
