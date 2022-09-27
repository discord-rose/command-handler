import { Worker } from 'jadl'

import { CommandFactory } from '../handler/CommandFactory'

import { Symbols } from '../Symbols'
import {
  APIApplicationCommand,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  GatewayInteractionCreateDispatchData,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  Snowflake
} from 'discord-api-types/v9'

import { CommandError } from '../structures/CommandError'
import { CommandInteraction } from '../types'
import { SeekInteractions } from '../utils/InteractionChanges'
import { RequestData } from '@discordjs/rest'
import { MessageTypes, parse, parseMessage } from '@jadl/builders'
import FormData from 'form-data'
import {
  APIInteraction,
  APIInteractionResponse,
  RESTPostAPIInteractionCallbackJSONBody
} from 'discord-api-types/v10'
import { InteractionCommandResponse } from '../structures/InteractionCommandResponse'
import { WorkerInject } from '../structures/WorkerInject'

export type MessageReturnType = MessageTypes | InteractionCommandResponse

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

  constructor(
    public readonly worker: Worker,
    injections: Array<WorkerInject | (new () => any)>,
    options: CommandHandlerOptions = {}
  ) {
    super(
      injections.filter((x) => !(x instanceof WorkerInject)) as Array<
        new () => any
      >
    )

    const workerInjects = injections.filter(
      (x) => x instanceof WorkerInject
    ) as WorkerInject[]

    this.commands.forEach((x) => {
      if (x[Symbols.injections]) workerInjects.push(...x[Symbols.injections])
    })

    workerInjects.forEach((inject) => inject._setup(this.worker))

    this.options = {
      interactionGuild: options.interactionGuild,
      ephemeralError: options.ephemeralError ?? true
    }

    worker.on('INTERACTION_CREATE', (int) => {
      void this.handleInteraction(int as any)
      workerInjects.forEach((inject) => inject._onInteraction(int, this.worker))
    })

    worker.on('READY', () => {
      if (this.worker.comms.id === '0') void this.updateInteractions()
    })
  }

  private formCommandEndpoint(
    guildId?: Snowflake,
    interactionId?: Snowflake
  ): `/${string}` {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `/applications/${this.worker.user.id}/${
      this.options.interactionGuild ?? guildId
        ? `/guilds/${this.options.interactionGuild ?? guildId}/`
        : ''
    }commands${interactionId ? `/${interactionId}` : ''}`
  }

  async updateInteractions(): Promise<void> {
    const oldInteractions = (await this.worker.api.get(
      this.formCommandEndpoint()
    )) as APIApplicationCommand[]
    const newInteractions = this.commands.map((cmd) => cmd[Symbols.interaction])

    const changes = SeekInteractions(oldInteractions, newInteractions)

    await Promise.all<any>([
      ...[
        ...changes.added,
        ...newInteractions.filter(
          (x) => this.findCommand(x.name)?.[Symbols.guild]
        )
      ].map(
        async (x) =>
          await this.worker.api.post(
            this.formCommandEndpoint(this.findCommand(x.name)?.[Symbols.guild]),
            { body: x }
          )
      ),
      ...changes.updated.map(
        async (x) =>
          await this.worker.api.post(
            this.formCommandEndpoint(this.findCommand(x.name)?.[Symbols.guild]),
            {
              body: x
            }
          )
      ),
      ...changes.deleted.map(
        async (x) =>
          await this.worker.api.delete(
            this.formCommandEndpoint(undefined, x.id)
          )
      )
    ])

    this.worker.log(
      `Added ${changes.added.length}, deleted ${changes.deleted.length}, and updated ${changes.updated.length} command interactions`
    )
  }

  async handleInteraction(
    _interaction: GatewayInteractionCreateDispatchData
  ): Promise<void> {
    if (_interaction.type !== InteractionType.ApplicationCommand) return
    if (
      !_interaction.data ||
      (_interaction.data.type !== ApplicationCommandType.ChatInput &&
        _interaction.data.type !== ApplicationCommandType.User &&
        _interaction.data.type !== ApplicationCommandType.Message)
    )
      return

    const command = this.findCommand(_interaction.data.name)
    if (!command) return

    const interaction: CommandInteraction = {
      ..._interaction,
      responded: false
    }

    // TODO sub commands

    const running =
      interaction.data.type === ApplicationCommandType.ChatInput
        ? interaction.data.options &&
          [
            ApplicationCommandOptionType.Subcommand,
            ApplicationCommandOptionType.SubcommandGroup
          ].includes(interaction.data.options[0].type)
          ? interaction.data.options[0].name
          : Symbols.baseCommand
        : Symbols.baseCommand

    const baseCommand = command[Symbols.commands].find(
      (x) => x.name === running
    )
    if (!baseCommand) return

    try {
      for (const runner of baseCommand.canRun) {
        if (!(await runner(interaction, this))) return
      }

      for (const runner of baseCommand.onRun) {
        await runner(interaction, this)
      }

      const res = await command[baseCommand.method]?.(interaction, this)

      await this.handleRes?.(res, interaction)
    } catch (err: unknown) {
      if (err instanceof CommandError) {
        if (this.options.ephemeralError) {
          const formatted = parseMessage(err.response)
          if (!(formatted instanceof FormData)) {
            err.response = {
              ...formatted,
              flags: MessageFlags.Ephemeral
            }
          }
        }
        void this.handleRes(err.response, interaction).catch((err) => {
          console.error(err)
        })
      } else if (err instanceof Error) {
        err.message += ` (In command ${
          baseCommand.name === Symbols.baseCommand
            ? command[Symbols.commandName]
            : baseCommand.name.toString()
        })`
        console.error(err)
      } else {
        console.error(err)
      }
    }
  }

  private async editOriginal(res: MessageTypes, int: CommandInteraction) {
    await this.worker.api.patch(
      `/webhooks/${this.worker.user.id}/${int.token}/messages/@original`,
      parse(res)
    )
  }

  static async callback(
    worker: Worker,
    body: RESTPostAPIInteractionCallbackJSONBody,
    int: APIInteraction
  ) {
    return await worker.api.post(
      `/interactions/${int.id}/${int.token}/callback`,
      {
        body
      }
    )
  }

  private async callback(
    body: RESTPostAPIInteractionCallbackJSONBody,
    int: CommandInteraction
  ) {
    return await CommandHandler.callback(this.worker, body, int)
  }

  async handleRes(
    res: MessageReturnType,
    int: CommandInteraction
  ): Promise<void> {
    if (res instanceof InteractionCommandResponse) {
      await this.callback(res.data, int)
    } else if (int.responded) {
      await this.editOriginal(res, int)
    } else {
      const msg = parseMessage(res)
      if (msg instanceof FormData) {
        await this.callback(
          { type: InteractionResponseType.DeferredChannelMessageWithSource },
          int
        )
        await this.editOriginal(res, int)
      } else {
        await this.callback(
          { type: InteractionResponseType.ChannelMessageWithSource, data: msg },
          int
        )
      }
    }
  }
}
