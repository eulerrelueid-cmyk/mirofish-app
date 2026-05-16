import type { SimulationEvent } from '../types/simulation'

export interface SimulationEventInsertRow {
  scenario_id: string
  event_id: string
  timestamp: string
  type: SimulationEvent['type']
  description: string
  agents_involved: string[]
  impact: number
  round: number
  related_post_id?: string
}

export function buildEventInsertRows(
  scenarioId: string,
  events: SimulationEvent[],
  includeRelatedPostId: boolean
): SimulationEventInsertRow[] {
  return events.map((event) => {
    const row: SimulationEventInsertRow = {
      scenario_id: scenarioId,
      event_id: event.id,
      timestamp: event.timestamp.toISOString(),
      type: event.type,
      description: event.description,
      agents_involved: event.agentsInvolved,
      impact: event.impact,
      round: event.round,
    }

    if (includeRelatedPostId && event.relatedPostId) {
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
