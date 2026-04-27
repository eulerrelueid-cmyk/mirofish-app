import { getStaleScenarioMessage, isScenarioStale, type RawScenarioMetadata } from './simulation-contract.ts'
import type {
  SimulationHistoryItem,
  SimulationScenario,
} from '../types/simulation.ts'

interface RawHistoryScenarioRecord {
  id: string
  title?: string
  description?: string
  status?: string
  created_at?: string
  updated_at?: string
  results?: RawScenarioMetadata | null
}

function getSummaryExcerpt(summary: string | undefined) {
  if (!summary) {
    return undefined
  }

  return summary.length > 160 ? `${summary.slice(0, 157).trimEnd()}...` : summary
}

function getResultCounts(results: RawScenarioMetadata | null | undefined) {
  if (
    !results ||
    !Array.isArray(results.agents) ||
    !Array.isArray(results.posts) ||
    !Array.isArray(results.events) ||
    !Array.isArray(results.rounds)
  ) {
    return null
  }

  return {
    agents: results.agents.length,
    posts: results.posts.length,
    events: results.events.length,
    rounds: results.rounds.length,
  }
}

export function buildHistoryItemFromScenarioRow(
  row: RawHistoryScenarioRecord,
  now = Date.now()
): SimulationHistoryItem {
  const stale = isScenarioStale(row.status, row.updated_at, now)
  const status = stale ? 'failed' : row.status === 'completed' || row.status === 'failed' || row.status === 'pending' ? row.status : 'running'
  const errorMessage = stale
    ? getStaleScenarioMessage(row.updated_at)
    : row.results?.error

  return {
    id: row.id,
    title: row.title ?? 'Untitled scenario',
    description: row.description ?? '',
    status,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    mockMode: row.results?.mockMode,
    workflowRunId: row.results?.workflowRunId,
    errorMessage,
    progress: row.results?.progress,
    summaryExcerpt: getSummaryExcerpt(row.results?.summary),
    resultCounts: getResultCounts(row.results),
  }
}

export function buildHistoryItemFromScenario(scenario: SimulationScenario): SimulationHistoryItem {
  return {
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
    status: scenario.status,
    createdAt: scenario.createdAt,
    updatedAt: scenario.updatedAt,
    mockMode: scenario.mockMode,
    workflowRunId: scenario.workflowRunId,
    errorMessage: scenario.errorMessage,
    progress: scenario.progress,
    summaryExcerpt: getSummaryExcerpt(scenario.results?.summary),
    resultCounts: scenario.results
      ? {
          agents: scenario.results.agents.length,
          posts: scenario.results.posts.length,
          events: scenario.results.events.length,
          rounds: scenario.results.rounds.length,
        }
      : null,
  }
}

export function upsertHistoryItem(
  items: SimulationHistoryItem[],
  incoming: SimulationHistoryItem
) {
  const next = [incoming, ...items.filter((item) => item.id !== incoming.id)]
  return next.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export function buildHistoryItemsFromApi(rows: RawHistoryScenarioRecord[]) {
  return rows
    .map((row) => buildHistoryItemFromScenarioRow(row))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}
