import { MessageTypes, parseMessage } from '@jadl/builders'
import {
  APIInteractionResponse,
  APIMessageActionRowComponent,
  InteractionResponseType,
  APIBaseInteraction,
  InteractionType,
  APIMessageComponentInteractionData,
  Routes,
  APIInteraction
} from 'discord-api-types/v9'
import { Worker } from 'jadl'
import { WorkerInject } from '../structures/WorkerInject'

type ComponentHandle<
  T extends APIMessageActionRowComponent['type'],
  W extends Worker = Worker
> = (
  int: APIBaseInteraction<
    InteractionType.MessageComponent,
    APIMessageComponentInteractionData & { component_type: T }
  > & {
    data: APIMessageComponentInteractionData & { component_type: T }
  },
  worker: W
) => MessageTypes | Promise<MessageTypes>

export class ComponentRunner<
  T extends APIMessageActionRowComponent['type'],
  W extends Worker = Worker
> extends WorkerInject<W> {
  private handle?: ComponentHandle<T, W>
  constructor(
    public component: APIMessageActionRowComponent & {
      type: T
      custom_id: string
    }
  ) {
    super()
  }

  async _onInteraction(int: APIInteraction, worker: W) {
    if (int.type !== InteractionType.MessageComponent) return
    if (int.data.component_type !== this.component.type) return
    if (int.data.custom_id !== this.component.custom_id) return

    const res = await this.handle?.(int as any, worker)

    if (!res) return

    await worker.api.post(Routes.interactionCallback(int.id, int.token), {
      body: {
        type: InteractionResponseType.UpdateMessage,
        data: parseMessage(res)
      } as APIInteractionResponse
    })
  }

  render() {
    return this.component
  }

  setHandle(handle: ComponentHandle<T, W>): this {
    this.handle = handle

    return this
  }
}
