import { DiscordEventMap, Worker } from 'jadl'

import { CommandFactory } from '../handler/CommandFactory'

import { formatMessage, MessageTypes } from '../utils/MessageFormatter'

import { Symbols } from '../Symbols'
import { ApplicationCommandType, InteractionResponseType, InteractionType, MessageFlags, Snowflake } from 'discord-api-types'

import { CommandError } from '../structures/CommandError'
import { CommandInteraction } from '../types'

export interface CommandHandlerOptions {
  /**
   * Guild to post all commands to (useful for testing)
   */
  interactionGuild?: Snowflake
  /**
   * Whether or not to make errors ephemeral
   * @default true
   */
  ephemeralError?: boolean
}

export class CommandHandler extends CommandFactory {
  public options: CommandHandlerOptions

  constructor (private readonly worker: Worker, commands: Array<new() => any>, options: CommandHandlerOptions = {}) {
    super(commands)

    this.options = {
      interactionGuild: options.interactionGuild,
      ephemeralError: options.ephemeralError ?? true
    }

    worker.on('INTERACTION_CREATE', (int) => {
      void this.handleInteraction(int)
    })

    worker.on('READY', () => {
      void this.worker.api.interactions.set(
        this.commands.map(x => x[Symbols.interaction]),
        this.worker.user.id,
        options.interactionGuild
      ).then(() => {
        this.worker.log('Posted interactions')
      })
    })
  }

  async handleInteraction (interaction: DiscordEventMap['INTERACTION_CREATE']): Promise<void> {
    if (interaction.type !== InteractionType.ApplicationCommand) return
    if (interaction.data.type !== ApplicationCommandType.ChatInput) return

    const command = this.findCommand(interaction.data.name)
    if (!command) return

    // TODO sub commands

    const baseCommand = command[Symbols.commands].find(x => x.name === Symbols.baseCommand)
    if (!baseCommand) return

    try {
      for (const runner of baseCommand.canRun) {
        if (!await runner(interaction as CommandInteraction, this.worker)) return
      }

      for (const runner of baseCommand.onRun) {
        await runner(interaction as CommandInteraction, this.worker)
      }

      const res = await command[baseCommand.method]?.(interaction, this.worker)

      void this.handleRes?.(res, interaction as CommandInteraction)
    } catch (err: unknown) {
      if (err instanceof CommandError) {
        if (this.options.ephemeralError) {
          const formatted = formatMessage(err.response)
          if (formatted.type === 'json') {
            err.response = {
              ...formatted.data,
              flags: MessageFlags.Ephemeral
            }
          }
        }
        void this.handleRes(err.response, interaction as CommandInteraction)
      } else if (err instanceof Error) {
        err.message += ` (In command ${baseCommand.name === Symbols.baseCommand ? command[Symbols.commandName] : baseCommand.name.toString()})`
        console.error(err)
      } else {
        console.error(err)
      }
    }
  }

  async handleRes (res: MessageTypes, int: CommandInteraction): Promise<void> {
    const msg = formatMessage(res)

    const toSend = msg.type === 'json'
      ? {
          body: int.responded
            ? msg.data
            : {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: msg.data
              }
        }
      : {
          body: msg.data,
          parser: (_) => _,
          headers: msg.data.getHeaders()
        }

    if (!int.responded && msg.type !== 'formdata') {
      void this.worker.api.request('POST', `/interactions/${int.id}/${int.token}/callback`, toSend)
    } else {
      if (!int.responded) {
        await this.worker.api.interactions.callback(int.id, int.token, { type: InteractionResponseType.DeferredChannelMessageWithSource })
      }

      int.responded = true
      void this.worker.api.request('PATCH', `/webhooks/${this.worker.user.id}/${int.token}/messages/@original`, toSend)
    }
  }
}
