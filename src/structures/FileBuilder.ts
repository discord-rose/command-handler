import { FileMessage, NonBufferTypes } from '../utils/MessageFormatter'

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
}
