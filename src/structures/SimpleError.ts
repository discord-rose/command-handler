import { Embed } from '@jadl/builders'
import { CommandError } from './CommandError'

export class SimpleError extends CommandError {
  constructor(message: string) {
    super(new Embed().color('Red').title('Error Occurred').description(message))
  }
}
