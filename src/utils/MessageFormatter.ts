import { Embed } from '@jadl/embed'
import { APIInteractionResponseCallbackData } from 'discord-api-types'

import FormData from 'form-data'
import { FileBuilder } from '../structures/FileBuilder'

type StringifiedMessageTypes = string | Function | bigint | number | symbol | undefined

export interface FileMessage {
  files: Array<{
    name: string
    buffer: Buffer
  }>

  extra?: NonBufferTypes
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
  type: 'formdata'
} | {
  data: Record<string, any>
  type: 'json'
}

export const formatMessage = (message: MessageTypes): FormattedResult => {
  if (message instanceof FileBuilder) {
    const form = new FormData()
    if (message.data.files.length < 2) {
      form.append('file', message.data.files[0].buffer, message.data.files[0].name)
    } else {
      for (let i = 0; i < message.data.files.length; i++) {
        const file = message.data.files[i]
        form.append(`file${i}`, file.buffer, file.name)
      }
    }

    if (message.data.extra) form.append('payload_json', JSON.stringify(turnNonBuffer(message.data.extra)))
    return {
      data: form,
      type: 'formdata'
    }
  }

  return {
    data: turnNonBuffer(message),
    type: 'json'
  }
}
