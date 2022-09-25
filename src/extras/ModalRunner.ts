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
import { InteractionCommandResponse } from '../structures/InteractionCommandResponse'
import { WorkerInject } from '../structures/WorkerInject'

const createCustomId = (title: string) =>
  title.split(' ').join('-').toLowerCase()

type ModalRunnerHandler<
  W extends Worker = Worker,
  OO extends ObjectOptions[] = []
> = (
  options: {
    [key in OO[number]['name']]: string
  },
  worker: W,
  int: APIModalSubmitInteraction
) => MessageTypes | Promise<MessageTypes> | void

interface ObjectOptions {
  name: string
}

export class ModalRunner<
  W extends Worker = Worker,
  OO extends ObjectOptions[] = []
> extends WorkerInject<W> {
  private data: APIModalInteractionResponseCallbackData = {
    custom_id: '',
    components: [],
    title: ''
  }

  private handle?: ModalRunnerHandler<W>

  constructor(public title: string, public customId = createCustomId(title)) {
    super()

    this.data.title = title
    this.data.custom_id = customId
  }

  setHandle(handle: ModalRunnerHandler<W, OO>): this {
    this.handle = handle

    return this
  }

  addTextInput<N extends string>(
    name: N,
    data: Omit<APITextInputComponent, 'custom_id' | 'label' | 'type'>,
    customId?: string
  ): ModalRunner<W, [...OO, { name: N }]> {
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
    const options = {}

    const components = this.data.components!.map((x) => x.components).flat()
    data.forEach((opt) => {
      options[components.find((x) => x.custom_id === opt.custom_id)!.label] =
        opt.value
    })

    const res = await this.handle?.(options, worker, int)

    if (!res) {
      await worker.api.post(Routes.interactionCallback(int.id, int.token), {
        body: {
          type: InteractionResponseType.DeferredChannelMessageWithSource
        } as APIInteractionResponse
      })
    } else {
      await worker.api.post(Routes.interactionCallback(int.id, int.token), {
        body: {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: parseMessage(res)
        } as APIInteractionResponse
      })
    }
  }

  render(): InteractionCommandResponse {
    return new InteractionCommandResponse({
      type: InteractionResponseType.Modal,
      data: this.data
    })
  }
}
