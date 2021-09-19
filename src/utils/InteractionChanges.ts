import { RESTPostAPIChatInputApplicationCommandsJSONBody, RESTGetAPIApplicationCommandResult, APIApplicationCommandOption, Snowflake, APIApplicationCommandOptionChoice } from 'discord-api-types'

export interface InteractionChanges {
  added: RESTPostAPIChatInputApplicationCommandsJSONBody[]

  updated: Array<RESTPostAPIChatInputApplicationCommandsJSONBody & { id: Snowflake }>

  deleted: RESTGetAPIApplicationCommandResult[]
}

export const SeekInteractions = (
  oldInteractions: RESTGetAPIApplicationCommandResult[],
  newInteractions: RESTPostAPIChatInputApplicationCommandsJSONBody[]
): InteractionChanges => {
  const interactions: InteractionChanges = {
    added: [],
    updated: [],
    deleted: []
  }

  const mutuals = newInteractions.filter(newInt => oldInteractions.some(oldInt => oldInt.name === newInt.name))

  oldInteractions.forEach(int => {
    if (!mutuals.some(x => x.name === int.name)) interactions.deleted.push(int)
  })
  newInteractions.forEach(int => {
    if (!mutuals.some(x => x.name === int.name)) interactions.added.push(int)
  })

  mutuals.forEach(newInteraction => {
    const oldInteraction = oldInteractions.find(x => x.name === newInteraction.name)
    if (!oldInteraction) return

    const changed =
      (oldInteraction.default_permission ?? true) !== (newInteraction.default_permission ?? true) ||
      oldInteraction.name !== newInteraction.name ||
      oldInteraction.description !== newInteraction.description ||
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
        oldOpt.default !== newOpt.default ||
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
        oldChoice.name !== newChoice.name ||
        oldChoice.value !== newChoice.value
      )
    })
  )
}
