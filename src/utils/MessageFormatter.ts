import { Embed } from '@jadl/embed'
import { APIInteractionResponseCallbackData, MessageFlags } from 'discord-api-types'

import FormData from 'form-data'
import { FileBuilder } from '../structures/FileBuilder'
import { EphemeralEmbed } from './EphemeralEmbed'

type StringifiedMessageTypes = string | Function | bigint | number | symbol | undefined

export enum SendMessageType {
  JSON,
  FormData
}

export type NonBufferTypes = APIInteractionResponseCallbackData | StringifiedMessageTypes | Embed<any> | EphemeralEmbed

export type MessageTypes = NonBufferTypes | FileBuilder

export function resolveString (data: any): string {
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return data.join(', ')

  return String(data)
}

const isStringified = (val: any): val is StringifiedMessageTypes => {
  return ['bigint', 'function', 'number', 'string', 'symbol', 'undefined'].includes(typeof val)
}

export const turnNonBuffer = (message: NonBufferTypes): APIInteractionResponseCallbackData => {
  if (message instanceof Embed) {
    return {
      embeds: [message.render()],
      flags: message instanceof EphemeralEmbed ? MessageFlags.Ephemeral : 0
    }
  } else if (isStringified(message)) {
    return {
      content: resolveString(message)
    }
  }

  return message
}

export type FormattedResult <CreateFormData = true> = {
  data: CreateFormData extends true ? FormData : FileBuilder
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

export const internalFormatMessage = (message: MessageTypes): FormattedResult<false> => {
  if (message instanceof FileBuilder) {
    return {
      data: message,
      type: SendMessageType.FormData
    }
  }

  return formatMessage(message) as any
}
