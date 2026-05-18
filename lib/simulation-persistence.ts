import type { SimulationEvent } from '../types/simulation'

export type PersistedSimulationEventType = Extract<
  SimulationEvent['type'],
  'interaction' | 'sentiment_shift' | 'emergence' | 'milestone'
>

export interface SimulationEventInsertRow {
  scenario_id: string
  event_id: string
  timestamp: string
  type: PersistedSimulationEventType
  description: string
  agents_involved: string[]
  impact: number
  round?: number
  related_post_id?: string
}

export interface BuildEventInsertRowsOptions {
  includeRelatedPostId: boolean
  includeRound: boolean
}

export function normalizeEventTypeForPersistence(type: SimulationEvent['type']): PersistedSimulationEventType {
  if (type === 'post_viral') {
    return 'milestone'
  }

  if (type === 'consensus') {
    return 'emergence'
  }

  if (type === 'conflict') {
    return 'sentiment_shift'
  }

  return type
}

export function buildEventInsertRows(
  scenarioId: string,
  events: SimulationEvent[],
  options: BuildEventInsertRowsOptions
): SimulationEventInsertRow[] {
  return events.map((event) => {
    const row: SimulationEventInsertRow = {
      scenario_id: scenarioId,
      event_id: event.id,
      timestamp: event.timestamp.toISOString(),
      type: normalizeEventTypeForPersistence(event.type),
      description: event.description,
      agents_involved: event.agentsInvolved,
      impact: event.impact,
    }

    if (options.includeRound) {
      row.round = event.round
    }

    if (options.includeRelatedPostId && event.relatedPostId) {
      row.related_post_id = event.relatedPostId
    }

    return row
  })
}

export function isMissingRelatedPostIdColumnError(error: { message?: string } | null | undefined) {
  return isMissingColumnError(error, 'mirofish_events', 'related_post_id')
}

export function isMissingColumnError(
  error: { code?: string; message?: string } | null | undefined,
  table: string,
  column: string
) {
  const message = error?.message ?? ''
  return Boolean(
    message.includes(table) &&
      (message.includes(`'${column}' column`) ||
        message.includes(`column ${table}.${column} does not exist`) ||
        message.includes(`column "${column}"`) ||
        (error?.code === '42703' && message.includes(column)))
  )
}
