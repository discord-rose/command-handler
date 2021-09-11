import { DiscordEventMap, Worker } from 'jadl'

import { MessagesResource, MessageTypes } from '@discord-rose/rest'

import { CommandFactory } from '..'
import { Symbols } from '../Symbols'
import { ApplicationCommandType, InteractionResponseType, InteractionType, Snowflake } from 'discord-api-types'

import { CommandError } from '../structures/CommandError'
import { CommandInteraction } from '../types'

export interface CommandHandlerOptions {
  interactionGuild?: Snowflake
}

export class CommandHandler extends CommandFactory {
  constructor (private readonly worker: Worker, commands: Array<new() => any>, options: CommandHandlerOptions = {

  }) {
    super(commands, worker)

    worker.on('INTERACTION_CREATE', (int) => {
      void this.handleInteraction(int)
    })

    worker.on('READY', () => {
      void this.worker.api.interactions.set(
        this.commands.map(x => x[Symbols.interaction]),
        this.worker.user.id,
        options.interactionGuild
      ).then(() => {
        console.log('Set interactions')
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

    console.log('running command')

    try {
      for (const runner of baseCommand.canRun) {
        if (!await runner(interaction as CommandInteraction, this.worker)) return
      }

      for (const runner of baseCommand.onRun) {
        await runner(interaction as CommandInteraction, this.worker)
      }

      const res = await command[baseCommand.method]?.(interaction, this.worker)

      this.handleRes?.(res, interaction as CommandInteraction)
    } catch (err: unknown) {
      if (err instanceof CommandError) {
        this.handleRes(err.response, interaction as CommandInteraction)
      } else if (err instanceof Error) {
        err.message += ` (In command ${baseCommand.name === Symbols.baseCommand ? command[Symbols.commandName] : baseCommand.name.toString()})`
        console.error(err)
      } else {
        console.error(err)
      }
    }
  }

  handleRes (res: MessageTypes, int: CommandInteraction): void {
    if (!int.responded) {
      void this.worker.api.interactions.callback(int.id, int.token, { type: InteractionResponseType.ChannelMessageWithSource, data: MessagesResource._formMessage(res) })
    } else {
      int.responded = true
      void this.worker.api.webhooks.editMessage(this.worker.user.id, int.token, '@original', res)
    }
  }
}
