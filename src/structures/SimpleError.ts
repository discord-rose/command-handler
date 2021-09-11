import { Embed } from '@jadl/embed'
import { CommandError } from './CommandError'

export class SimpleError extends CommandError {
  constructor (message: string) {
    super(new Embed()
      .color('Red')
      .title('Error Occured')
      .description(message)
    )
  }
}
