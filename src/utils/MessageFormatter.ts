import { Embed } from '@jadl/embed'
import { APIInteractionResponseCallbackData } from 'discord-api-types'

import FormData from 'form-data'
import { FileBuilder } from '../structures/FileBuilder'

type StringifiedMessageTypes = string | Function | bigint | number | symbol | undefined

export enum SendMessageType {
  JSON,
  FormData
}

export type NonBufferTypes = APIInteractionResponseCallbackData | StringifiedMessageTypes | Embed<any>

export type MessageTypes = NonBufferTypes | FileBuilder

export function resolveString (data: any): string {
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return data.join(', ')

  return String(data)
}

const isStringified = (val: any): val is StringifiedMessageTypes => {
  return ['bigint', 'function', 'number', 'string', 'symbol', 'undefined'].includes(typeof val)
}

const turnNonBuffer = (message: NonBufferTypes): APIInteractionResponseCallbackData => {
  if (message instanceof Embed) {
    message = {
      embeds: [message.render()]
    }
  } else if (isStringified(message)) {
    message = {
      content: resolveString(message)
    }
  }

  return message
}

export type FormattedResult = {
  data: FormData
  type: SendMessageType.FormData
} | {
  data: Record<string, any>
  type: SendMessageType.JSON
}

export const formatMessage = (message: MessageTypes): FormattedResult => {
  if (message instanceof FileBuilder) {
    return {
      data: message.toFormData(),
      type: SendMessageType.FormData
    }
  }

  return {
    data: turnNonBuffer(message),
    type: SendMessageType.JSON
  }
}
