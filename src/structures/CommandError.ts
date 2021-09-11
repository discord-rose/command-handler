import { MessageTypes } from '@discord-rose/rest'

export class CommandError extends Error {
  name = 'CommandError'

  public constructor (public response: MessageTypes) {
    super('')
  }
}