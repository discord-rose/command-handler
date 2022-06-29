import { APIInteractionResponse, InteractionResponseType, MessageFlags } from 'discord-api-types/v9'
import { Decorators } from '../../utils/Decorators'
import { EphemeralEmbed } from '../../utils/EphemeralEmbed'

export const Thinks = Decorators.createCommandDecorator<[ephemeral?: boolean]>(
  ([ephemeral], cmd) => {
  cmd.onRun.push(async (int, { worker }) => {
    int.responded = true

    const body: APIInteractionResponse = {
      type: InteractionResponseType.DeferredChannelMessageWithSource
    }

    if (ephemeral === true) body.data = {
      flags: MessageFlags.Ephemeral
    }

    await worker.api.post(`/interactions/${int.id}/${int.token}/callback`, {
      body
    })
  })
})
