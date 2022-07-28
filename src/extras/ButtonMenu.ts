import { MessageBuilder, parse, parseToMessageBuilder } from '@jadl/builders'
import { APIMessageComponentInteraction } from 'discord-api-types/v10'

import {
  APIMessageActionRowComponent,
  InteractionResponseType,
  APIButtonComponentWithCustomId,
  APIButtonComponentBase,
  ButtonStyle,
  ComponentType,
  InteractionType,
  Routes,
  APIInteraction
} from 'discord-api-types/v9'
import { Worker } from 'jadl'
import { WorkerInject } from '../structures/WorkerInject'

interface SectionOptions {
  row: number
  disableIf?: string[]
}

interface SectionData {
  method: string
  button: APIButtonComponentWithCustomId
  options: SectionOptions
}

const sectionsSymbol = Symbol.for('button menu sections')
type SectionEnabledObject = {
  [sectionsSymbol]: SectionData[]
}

export class ButtonMenu<D extends any = {}, W extends Worker = Worker>
  extends WorkerInject<W>
  implements SectionEnabledObject
{
  [sectionsSymbol]: SectionData[]

  async _onInteraction(int: APIInteraction, worker: W) {
    if (int.type !== InteractionType.MessageComponent) return
    if (int.data.component_type !== ComponentType.Button) return

    let [meta, ...splitData] = int.data.custom_id.split('#')
    const data = splitData.join('#')

    const [bm, menu, method] = meta.split('_')

    if (bm !== 'BM') return
    if (menu !== this.constructor.name) return

    const section = this[sectionsSymbol].find((x) => x.method === method)

    if (!section) return

    await worker.api
      .post(Routes.interactionCallback(int.id, int.token), {
        body: {
          type: InteractionResponseType.DeferredMessageUpdate
        }
      })
      .catch(() => {})

    const dataObject = Object.fromEntries(new URLSearchParams(data) as any) as D

    const res = await this[section.method](dataObject, int)

    const messageBuilder = parseToMessageBuilder(res)

    messageBuilder.message.components = []
    this.createButtons(section.method, dataObject, messageBuilder)

    await worker.api
      .patch(
        Routes.webhookMessage(int.application_id, int.token, int.message.id),
        parse(messageBuilder)
      )
      .catch(() => {})
  }

  private createButtons(
    selectedMethod: string,
    data: D,
    builder: MessageBuilder
  ) {
    const rows = this[sectionsSymbol].reduce<APIMessageActionRowComponent[][]>(
      (buttons, section) => {
        if (!buttons[section.options.row]) buttons[section.options.row] = []
        buttons[section.options.row].push({
          ...section.button,
          custom_id:
            section.button.custom_id +
            '#' +
            new URLSearchParams(data as Record<string, string>).toString(),
          disabled:
            section.button.custom_id.split('_')[2] === selectedMethod ||
            !!section.options.disableIf?.some((x) => data[x])
        })
        return buttons
      },
      []
    )
    rows.forEach((x) => builder.addComponentRow(x))
  }

  async start(
    section: string,
    data: D,
    interaction?: APIMessageComponentInteraction
  ) {
    const res = await this[section](data, interaction)

    const messageBuilder = parseToMessageBuilder(res)

    messageBuilder.message.components = []
    this.createButtons(section, data, messageBuilder)

    return messageBuilder
  }
}

export const Section: (
  button: Omit<
    APIButtonComponentBase<Exclude<ButtonStyle, ButtonStyle.Link>>,
    'type'
  >,
  options?: SectionOptions
) => MethodDecorator = (button, options = { row: 0 }) => {
  return (target: SectionEnabledObject, prop: string) => {
    if (!target[sectionsSymbol]) target[sectionsSymbol] = []

    target[sectionsSymbol].push({
      method: prop,
      button: {
        ...button,
        type: ComponentType.Button,
        custom_id: `BM_${target.constructor.name}_${prop}`
      },
      options
    })
  }
}
