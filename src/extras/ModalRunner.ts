import { MessageTypes, parseMessage } from '@jadl/builders'
import {
  APIInteractionResponse,
  APIModalInteractionResponseCallbackData,
  APIModalSubmitInteraction,
  APITextInputComponent,
  ComponentType,
  InteractionResponseType,
  ModalSubmitComponent,
  Routes
} from 'discord-api-types/v10'
import { APIInteraction, InteractionType } from 'discord-api-types/v9'
import { Worker } from 'jadl'
import { CommandHandler, MessageReturnType } from '../handler/CommandHandler'
import { InteractionCommandResponse } from '../structures/InteractionCommandResponse'
import { WorkerInject } from '../structures/WorkerInject'

const createCustomId = (title: string) =>
  title.split(' ').join('-').toLowerCase()

type ModalRunnerHandler<
  W extends Worker = Worker,
  D = undefined,
  OO extends ObjectOptions[] = []
> = (
  options: {
    [key in OO[number]['name']]: string
  } & D,
  worker: W,
  int: APIModalSubmitInteraction
) => MessageReturnType | Promise<MessageReturnType> | void

interface ObjectOptions {
  name: string
}

export class ModalRunner<
  W extends Worker = Worker,
  D = undefined,
  OO extends ObjectOptions[] = []
> extends WorkerInject<W> {
  private data: APIModalInteractionResponseCallbackData = {
    custom_id: '',
    components: [],
    title: ''
  }

  private handle?: ModalRunnerHandler<W, any, OO>

  constructor(public title: string, public customId = createCustomId(title)) {
    super()

    this.data.title = title
    this.data.custom_id = customId
  }

  setHandle(handle: ModalRunnerHandler<W, D, OO>): this {
    this.handle = handle

    return this
  }

  addTextInput<N extends string>(
    name: N,
    data: Omit<APITextInputComponent, 'custom_id' | 'label' | 'type'>,
    customId?: string
  ): ModalRunner<W, D, [...OO, { name: N }]> {
    customId = customId || createCustomId(name)

    this.data.components.push({
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.TextInput,
          custom_id: customId,
          label: name,
          ...data
        }
      ]
    })

    return this as any
  }

  async _onInteraction(int: APIInteraction, worker: W) {
    if (int.type !== InteractionType.ModalSubmit) return
    if (int.data.custom_id !== this.customId) return

    const data = int.data.components!.map((x) => x.components).flat()
    let options = {}

    const components = this.data.components!.map((x) => x.components).flat()
    data.forEach((opt) => {
      options[
        components.find(
          (x) => x.custom_id === opt.custom_id.split('$')[0]
        )!.label
      ] = opt.value
    })

    const dataComponent = int.data.components![0]?.components?.[0]
    if (dataComponent) {
      const [customId, possibleData] = dataComponent.custom_id.split('$')
      dataComponent.custom_id = customId

      if (possibleData) {
        const obj = Object.fromEntries(
          new URLSearchParams(possibleData).entries()
        )

        options = { ...options, ...obj }
      }
    }

    const res = await this.handle?.(options, worker, int)

    if (!res) {
      await CommandHandler.callback(
        worker,
        { type: InteractionResponseType.DeferredMessageUpdate },
        int
      )
    } else if (res instanceof InteractionCommandResponse) {
      await CommandHandler.callback(worker, res.data, int)
    } else {
      await CommandHandler.callback(
        worker,
        {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: parseMessage(res) as any
        },
        int
      )
    }
  }

  render(extraInfo?: D): InteractionCommandResponse {
    let data = this.data
    if (extraInfo) {
      data = JSON.parse(JSON.stringify(this.data))

      data.components[0].components[0].custom_id += `$${new URLSearchParams(
        extraInfo as unknown as Record<string, string>
      ).toString()}`
    }
    return new InteractionCommandResponse({
      type: InteractionResponseType.Modal,
      data: data
    })
  }
}
