import { InteractionResponseType } from 'discord-api-types/v9'
import { Decorators } from '../../utils/Decorators'

export const Thinks = Decorators.createCommandDecorator((_opt, cmd) => {
  cmd.onRun.push(async (int, { worker }) => {
    int.responded = true
    await worker.api.post(`/interactions/${int.id}/${int.token}/callback`, {
      body: {
        type: InteractionResponseType.DeferredChannelMessageWithSource
      }
    })
  })
})
