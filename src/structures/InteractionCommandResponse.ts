import { APIInteractionResponse } from 'discord-api-types/v9'

export class InteractionCommandResponse {
  constructor(public data: APIInteractionResponse) {}
}
