import { MessageTypes } from '@jadl/builders'

export class CommandError extends Error {
  name = 'CommandError'

  public constructor(public response: MessageTypes) {
    super('')
  }
}
