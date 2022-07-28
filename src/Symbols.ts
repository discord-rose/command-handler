// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Symbols {
  static prefix = '__jadl.'

  static readonly commandName = Symbol(Symbols.prefix + 'command-name')
  static readonly aliases = Symbol(Symbols.prefix + 'aliases')
  static readonly commands = Symbol(Symbols.prefix + 'commands')
  static readonly interaction = Symbol(Symbols.prefix + 'interaction')
  static readonly guild = Symbol(Symbols.prefix + 'guilds')

  static readonly baseCommand = Symbol(Symbols.prefix + 'base-command')

  static readonly injections = Symbol(Symbols.prefix + 'injections')
}
