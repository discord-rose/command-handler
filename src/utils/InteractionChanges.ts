import {
  RESTPostAPIApplicationCommandsJSONBody,
  RESTGetAPIApplicationCommandResult,
  Snowflake
} from 'discord-api-types/v9'

import deepEqual from 'deep-equal'

const INTERACTION_CHANGED_PROPS: Array<
  keyof RESTGetAPIApplicationCommandResult
> = [
  'name',
  'type',
  'description',
  'options',
  'default_member_permissions',
  'description_localizations'
]

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

    let cleanObject = {}
    INTERACTION_CHANGED_PROPS.forEach((x) => {
      cleanObject[x] = oldInteraction[x]

      if (!Object.keys(newInteraction).includes(x))
        newInteraction[x] = undefined
    })

    if (!deepEqual(cleanObject, newInteraction)) {
      interactions.updated.push({ ...newInteraction, id: oldInteraction.id })
    }
  })

  return interactions
}
