import { InteractionResponseType } from 'discord-api-types'
import { Decorators } from '../../utils/Decorators'

export const Thinks = Decorators.createCommandDecorator((_opt, cmd) => {
  cmd.onRun.push(async (int, { worker }) => {
    int.responded = true
    await worker.api.interactions.callback(int.id, int.token, {
      type: InteractionResponseType.DeferredChannelMessageWithSource
    })
  })
})
