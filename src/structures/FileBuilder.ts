import { formatMessage, NonBufferTypes, SendMessageType } from '../utils/MessageFormatter'

import FormData from 'form-data'

export interface FileMessage {
  files: Array<{
    name: string
    buffer: Buffer
  }>

  extra?: NonBufferTypes
}

/**
 * File builder for easily sending file(s) as a response
 * @example
 * return new FileBuilder()
 *   .add('image.png', imageBuffer)
 *   .add('info.txt', Buffer.from('What\'s up!'))
 *   .extra(new Embed()
 *     .title('Your image and info')
 *   )
 */
export class FileBuilder {
  data: FileMessage = {
    files: []
  }

  /**
   * Adds a file to be sent
   * @param name Name of file
   * @param buffer Buffer of the file
   * @returns FileBuilder
   */
  add (name: string, buffer: Buffer): this {
    this.data.files.push({ name, buffer })

    return this
  }

  /**
   * Removes a file from the builder
   * @param name Name of file
   * @returns FileBuilder
   */
  remove (name: string): this {
    this.data.files = this.data.files.filter(x => x.name !== name)

    return this
  }

  /**
   * Adds message data to be sent along with the file
   * @param extra Extra message data
   * @returns FileBuilder
   */
  extra (extra: NonBufferTypes): this {
    this.data.extra = extra

    return this
  }

  toFormData (): FormData {
    const form = new FormData()
    if (this.data.files.length < 2) {
      form.append('file', this.data.files[0].buffer, this.data.files[0].name)
    } else {
      for (let i = 0; i < this.data.files.length; i++) {
        const file = this.data.files[i]
        form.append(`file${i}`, file.buffer, file.name)
      }
    }

    if (this.data.extra) {
      const payload = formatMessage(this.data.extra)
      if (payload.type === SendMessageType.FormData) throw new TypeError('FileBuilder extra data turned into FormData')

      form.append('payload_json', JSON.stringify(payload.data))
    }

    return form
  }
}
