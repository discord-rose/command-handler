import {
  RESTPostAPIApplicationCommandsJSONBody,
  RESTGetAPIApplicationCommandResult,
  APIApplicationCommandOption,
  Snowflake,
  APIApplicationCommandOptionChoice
} from 'discord-api-types/v9'

export interface InteractionChanges {
  added: RESTPostAPIApplicationCommandsJSONBody[]

  updated: Array<RESTPostAPIApplicationCommandsJSONBody & { id: Snowflake }>

  deleted: RESTGetAPIApplicationCommandResult[]
}

export const SeekInteractions = (
  oldInteractions: RESTGetAPIApplicationCommandResult[],
  newInteractions: RESTPostAPIApplicationCommandsJSONBody[]
): InteractionChanges => {
  const interactions: InteractionChanges = {
    added: [],
    updated: [],
    deleted: []
  }

  const mutuals = newInteractions.filter((newInt) =>
    oldInteractions.some((oldInt) => oldInt.name === newInt.name)
  )

  oldInteractions.forEach((int) => {
    if (!mutuals.some((x) => x.name === int.name))
      interactions.deleted.push(int)
  })
  newInteractions.forEach((int) => {
    if (!mutuals.some((x) => x.name === int.name)) interactions.added.push(int)
  })

  mutuals.forEach((newInteraction) => {
    const oldInteraction = oldInteractions.find(
      (x) => x.name === newInteraction.name
    )
    if (!oldInteraction) return

    const changed =
      String(oldInteraction.default_member_permissions) !==
        String(newInteraction.default_member_permissions ?? null) ||
      oldInteraction.name !== newInteraction.name ||
      ('description' in oldInteraction && oldInteraction.description) !==
        ('description' in newInteraction && newInteraction.description) ||
      OptionsChanged(oldInteraction.options, newInteraction.options)

    if (changed) {
      interactions.updated.push({
        ...newInteraction,
        id: oldInteraction.id
      })
    }
  })

  return interactions
}

const OptionsChanged = (
  oldOptions?: APIApplicationCommandOption[],
  newOptions?: APIApplicationCommandOption[]
): boolean => {
  if (!oldOptions && !newOptions) return false
  if (!oldOptions !== !newOptions) return true

  return (
    oldOptions!.length !== newOptions!.length ||
    oldOptions!.some((oldOpt, i) => {
      const newOpt = newOptions![i]

      return (
        oldOpt.name !== newOpt.name ||
        oldOpt.description !== newOpt.description ||
        oldOpt.type !== newOpt.type ||
        (oldOpt.required ?? false) !== (newOpt.required ?? false) ||
        OptionsChanged(
          'options' in oldOpt ? oldOpt.options : undefined,
          'options' in newOpt ? newOpt.options : undefined
        ) ||
        ChoicesChanged(
          'choices' in oldOpt ? oldOpt.choices : undefined,
          'choices' in newOpt ? newOpt.choices : undefined
        )
      )
    })
  )
}

const ChoicesChanged = (
  oldChoices?: APIApplicationCommandOptionChoice[],
  newChoices?: APIApplicationCommandOptionChoice[]
): boolean => {
  if (!oldChoices && !newChoices) return false
  if (!oldChoices !== !newChoices) return true

  return (
    oldChoices!.length !== newChoices!.length ||
    oldChoices!.some((oldChoice, i) => {
      const newChoice = newChoices![i]

      return (
        oldChoice.name !== newChoice.name || oldChoice.value !== newChoice.value
      )
    })
  )
}
