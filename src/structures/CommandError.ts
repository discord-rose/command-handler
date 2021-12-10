import { MessageTypes } from '../utils/MessageFormatter'

export class CommandError extends Error {
  name = 'CommandError'

  public constructor (public response: MessageTypes) {
    super('')
  }
}
