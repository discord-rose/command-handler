import { FileMessage, NonBufferTypes } from '../utils/MessageFormatter'

export class FileBuilder {
  data: FileMessage = {
    name: 'unknown.txt',
    buffer: Buffer.from('Missing file')
  }

  name (name: string): this {
    this.data.name = name

    return this
  }

  buffer (buffer: Buffer): this {
    this.data.buffer = buffer

    return this
  }

  extra (extra: NonBufferTypes): this {
    this.data.extra = extra

    return this
  }
}
