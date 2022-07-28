import {
  APICommandAutocompleteInteractionResponseCallbackData,
  APIInteractionResponse,
  InteractionResponseType
} from 'discord-api-types/v10'
import {
  APIApplicationCommandStringOption,
  ApplicationCommandOptionType,
  InteractionType,
  APIApplicationCommandInteractionDataStringOption,
  Routes
} from 'discord-api-types/v9'
import { Worker } from 'jadl'
import { Symbols } from '../../Symbols'
import { Decorators } from '../../utils/Decorators'

type AutoCompleteHandler<W extends Worker = Worker> = (
  term: string,
  worker: W,
  int: any
) =>
  | Required<APICommandAutocompleteInteractionResponseCallbackData['choices']>
  | Promise<
      Required<APICommandAutocompleteInteractionResponseCallbackData['choices']>
    >

export const AutoComplete = Decorators.createParameterAddition<
  [handler: AutoCompleteHandler]
>(([handle], cmd, base, index) => {
  if (!base[Symbols.injections]) base[Symbols.injections] = []

  const option = cmd.interactionOptions!.find(
    (x) => x.name === cmd.indexToOption[index]
  )! as APIApplicationCommandStringOption
  option.autocomplete = true

  base[Symbols.injections].push({
    async _onInteraction(int, worker) {
      if (int.type !== InteractionType.ApplicationCommandAutocomplete) return

      let opt: APIApplicationCommandInteractionDataStringOption | undefined

      if (cmd.name !== Symbols.baseCommand) {
        const subCommand = int.data.options?.find((x) => x.name === cmd.name)
        if (subCommand?.type === ApplicationCommandOptionType.Subcommand) {
          opt = subCommand.options?.find(
            (x) =>
              x.name === option.name &&
              x.type === ApplicationCommandOptionType.String &&
              x.focused
          ) as APIApplicationCommandInteractionDataStringOption
        }
      } else {
        opt = int.data.options?.find(
          (x) =>
            x.name === option.name &&
            x.type === ApplicationCommandOptionType.String &&
            x.focused
        ) as APIApplicationCommandInteractionDataStringOption
      }

      if (!opt) return

      const res = await handle(opt.value, worker, int)

      void worker.api.post(Routes.interactionCallback(int.id, int.token), {
        body: {
          type: InteractionResponseType.ApplicationCommandAutocompleteResult,
          data: {
            choices: res
          }
        } as APIInteractionResponse
      })
    },
    _setup() {}
  })
})
