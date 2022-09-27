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
import { CommandHandler, MessageReturnType } from '../handler/CommandHandler'
import { InteractionCommandResponse } from '../structures/InteractionCommandResponse'
import { WorkerInject } from '../structures/WorkerInject'

type ComponentHandle<
  T extends APIMessageActionRowComponent['type'],
  W extends Worker = Worker,
  D = any
> = (
  int: APIBaseInteraction<
    InteractionType.MessageComponent,
    APIMessageComponentInteractionData & { component_type: T }
  > & {
    data: APIMessageComponentInteractionData & { component_type: T }
  },
  worker: W,
  extraInfo?: D
) => MessageReturnType | Promise<MessageReturnType> | void

export class ComponentRunner<
  T extends APIMessageActionRowComponent['type'],
  W extends Worker = Worker,
  D = undefined
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
    if (int.data.custom_id.split('$')[0] !== this.component.custom_id) return

    let data
    const [customId, possibleData] = int.data.custom_id.split('$')
    int.data.custom_id = customId

    if (possibleData) {
      data = Object.fromEntries(new URLSearchParams(possibleData).entries())
    }

    const res = await this.handle?.(int as any, worker, data)

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
          type: InteractionResponseType.UpdateMessage,
          data: parseMessage(res) as any
        },
        int
      )
    }
  }

  render(extraInfo?: D) {
    let component = this.component
    if (extraInfo) {
      component = JSON.parse(JSON.stringify(component))

      component.custom_id += `$${new URLSearchParams(
        extraInfo as any
      ).toString()}`
    }
    return component
  }

  setHandle(handle: ComponentHandle<T, W, D>): this {
    this.handle = handle

    return this
  }
}
