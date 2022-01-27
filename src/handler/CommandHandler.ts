import { Worker } from 'jadl'

import { CommandFactory } from '../handler/CommandFactory'

import { formatMessage, internalFormatMessage, MessageTypes, SendMessageType, turnNonBuffer } from '../utils/MessageFormatter'

import { Symbols } from '../Symbols'
import { APIApplicationCommand, ApplicationCommandOptionType, ApplicationCommandType, GatewayInteractionCreateDispatchData, InteractionResponseType, InteractionType, MessageFlags, Snowflake } from 'discord-api-types'

import { CommandError } from '../structures/CommandError'
import { CommandInteraction } from '../types'
import { SeekInteractions } from '../utils/InteractionChanges'
import { RequestData } from '@discordjs/rest'

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

  constructor (public readonly worker: Worker, commands: Array<new () => any>, options: CommandHandlerOptions = {}) {
    super(commands)

    this.options = {
      interactionGuild: options.interactionGuild,
      ephemeralError: options.ephemeralError ?? true
    }

    worker.on('INTERACTION_CREATE', (int) => {
      void this.handleInteraction(int as any)
    })

    worker.on('READY', () => {
      if (this.worker.comms.id === '0') void this.updateInteractions()
    })
  }

  private formCommandEndpoint (guildId?: Snowflake, interactionId?: Snowflake): `/${string}` {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `/applications/${this.worker.user.id}/${this.options.interactionGuild ?? guildId ? `/guilds/${this.options.interactionGuild ?? guildId}/` : ''}commands${interactionId ? `/${interactionId}` : ''}`
  }

  async updateInteractions (): Promise<void> {
    const oldInteractions = await this.worker.api.get(this.formCommandEndpoint()) as APIApplicationCommand[]
    const newInteractions = this.commands.map(cmd => cmd[Symbols.interaction])

    const changes = SeekInteractions(oldInteractions, newInteractions)
    console.log(JSON.stringify(changes, null, 4))

    await Promise.all<any>([
      ...[
        ...changes.added,
        ...newInteractions.filter(x => this.findCommand(x.name)?.[Symbols.guild])
      ].map(async x =>
        await this.worker.api.post(this.formCommandEndpoint(this.findCommand(x.name)?.[Symbols.guild]), { body: x })
      ),
      ...changes.updated.map(async x =>
        await this.worker.api.post(this.formCommandEndpoint(this.findCommand(x.name)?.[Symbols.guild]), {
          body: x
        })
      ),
      ...changes.deleted.map(async x =>
        await this.worker.api.delete(this.formCommandEndpoint(undefined, x.id))
      )
    ])

    this.worker.log(`Added ${changes.added.length}, deleted ${changes.deleted.length}, and updated ${changes.updated.length} command interactions`)
  }

  async handleInteraction (_interaction: GatewayInteractionCreateDispatchData): Promise<void> {
    if (_interaction.type !== InteractionType.ApplicationCommand) return
    if (!_interaction.data || (_interaction.data.type !== ApplicationCommandType.ChatInput && _interaction.data.type !== ApplicationCommandType.User &&
      _interaction.data.type !== ApplicationCommandType.Message)) return

    const command = this.findCommand(_interaction.data.name)
    if (!command) return

    const interaction: CommandInteraction = {
      ..._interaction,
      responded: false
    }

    // TODO sub commands

    const running = interaction.data.type === ApplicationCommandType.ChatInput
      ? (interaction.data.options && interaction.data.options[0].type === ApplicationCommandOptionType.Subcommand
          ? interaction.data.options[0].name
          : Symbols.baseCommand)
      : Symbols.baseCommand

    const baseCommand = command[Symbols.commands].find(x => x.name === running)
    if (!baseCommand) return

    try {
      for (const runner of baseCommand.canRun) {
        if (!await runner(interaction, this)) return
      }

      for (const runner of baseCommand.onRun) {
        await runner(interaction, this)
      }

      const res = await command[baseCommand.method]?.(interaction, this)

      void this.handleRes?.(res, interaction)
    } catch (err: unknown) {
      if (err instanceof CommandError) {
        if (this.options.ephemeralError) {
          const formatted = formatMessage(err.response)
          if (formatted.type === SendMessageType.JSON) {
            err.response = {
              ...formatted.data,
              flags: MessageFlags.Ephemeral
            }
          }
        }
        void this.handleRes(err.response, interaction)
      } else if (err instanceof Error) {
        err.message += ` (In command ${baseCommand.name === Symbols.baseCommand ? command[Symbols.commandName] : baseCommand.name.toString()})`
        console.error(err)
      } else {
        console.error(err)
      }
    }
  }

  async handleRes (res: MessageTypes, int: CommandInteraction): Promise<void> {
    const msg = internalFormatMessage(res)

    const toSend = msg.type === SendMessageType.JSON
      ? {
          body: int.responded
            ? msg.data
            : {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: msg.data
              }
        }
      : {
          body: turnNonBuffer(msg.data.data.extra),
          attachments: msg.data.data.files.map(x => ({ fileName: x.name, rawBuffer: x.buffer }))
        } as RequestData

    if (!int.responded && msg.type !== SendMessageType.FormData) {
      void this.worker.api.post(`/interactions/${int.id}/${int.token}/callback`, toSend)
    } else {
      if (!int.responded) {
        await this.worker.api.post(`/interactions/${int.id}/${int.token}/callback`, { body: { type: InteractionResponseType.DeferredChannelMessageWithSource } })
      }

      int.responded = true
      void this.worker.api.patch(`/webhooks/${this.worker.user.id}/${int.token}/messages/@original`, toSend)
    }
  }
}
