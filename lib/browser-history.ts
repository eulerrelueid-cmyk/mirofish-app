import type { SimulationHistoryItem, SimulationScenario } from '../types/simulation.ts'

import { upsertHistoryItem } from './simulation-history.ts'

const HISTORY_STORAGE_KEY = 'mirofish.history.items'
const SCENARIO_STORAGE_KEY = 'mirofish.history.scenarios'
const MAX_CACHED_HISTORY_ITEMS = 24
const MAX_CACHED_SCENARIOS = 12
type ScenarioResults = NonNullable<SimulationScenario['results']>

type SerializedHistoryItem = Omit<SimulationHistoryItem, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

type SerializedScenario = Omit<SimulationScenario, 'createdAt' | 'updatedAt' | 'results'> & {
  createdAt: string
  updatedAt: string
  results?: {
    agents: ScenarioResults['agents']
    summary: string
    predictions: string[]
    posts: Array<Omit<ScenarioResults['posts'][number], 'timestamp' | 'comments'> & {
      timestamp: string
      comments: Array<Omit<ScenarioResults['posts'][number]['comments'][number], 'timestamp'> & {
        timestamp: string
      }>
    }>
    events: Array<Omit<ScenarioResults['events'][number], 'timestamp'> & {
      timestamp: string
    }>
    rounds: Array<Omit<ScenarioResults['rounds'][number], 'timestamp'> & {
      timestamp: string
    }>
  }
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  if (!isBrowser()) {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota and serialization failures for cache-only data.
  }
}

export function mergeHistoryCollections(items: SimulationHistoryItem[]) {
  return items.reduce<SimulationHistoryItem[]>((merged, item) => upsertHistoryItem(merged, item), [])
}

export function serializeHistoryItem(item: SimulationHistoryItem): SerializedHistoryItem {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export function deserializeHistoryItem(item: SerializedHistoryItem): SimulationHistoryItem {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }
}

export function loadCachedHistoryItems() {
  return readStorage<SerializedHistoryItem[]>(HISTORY_STORAGE_KEY, []).map(deserializeHistoryItem)
}

export function saveCachedHistoryItems(items: SimulationHistoryItem[]) {
  writeStorage(
    HISTORY_STORAGE_KEY,
    mergeHistoryCollections(items)
      .slice(0, MAX_CACHED_HISTORY_ITEMS)
      .map(serializeHistoryItem)
  )
}

export function serializeScenario(scenario: SimulationScenario): SerializedScenario {
  return {
    ...scenario,
    createdAt: scenario.createdAt.toISOString(),
    updatedAt: scenario.updatedAt.toISOString(),
    results: scenario.results
      ? {
          ...scenario.results,
          posts: scenario.results.posts.map((post) => ({
            ...post,
            timestamp: post.timestamp.toISOString(),
            comments: post.comments.map((comment) => ({
              ...comment,
              timestamp: comment.timestamp.toISOString(),
            })),
          })),
          events: scenario.results.events.map((event) => ({
            ...event,
            timestamp: event.timestamp.toISOString(),
          })),
          rounds: scenario.results.rounds.map((round) => ({
            ...round,
            timestamp: round.timestamp.toISOString(),
          })),
        }
      : undefined,
  }
}

export function deserializeScenario(scenario: SerializedScenario): SimulationScenario {
  return {
    ...scenario,
    createdAt: new Date(scenario.createdAt),
    updatedAt: new Date(scenario.updatedAt),
    results: scenario.results
      ? {
          ...scenario.results,
          posts: scenario.results.posts.map((post) => ({
            ...post,
            timestamp: new Date(post.timestamp),
            comments: post.comments.map((comment) => ({
              ...comment,
              timestamp: new Date(comment.timestamp),
            })),
          })),
          events: scenario.results.events.map((event) => ({
            ...event,
            timestamp: new Date(event.timestamp),
          })),
          rounds: scenario.results.rounds.map((round) => ({
            ...round,
            timestamp: new Date(round.timestamp),
          })),
        }
      : undefined,
  }
}

export function loadCachedScenario(scenarioId: string) {
  const cached = readStorage<Record<string, SerializedScenario>>(SCENARIO_STORAGE_KEY, {})
  const scenario = cached[scenarioId]
  return scenario ? deserializeScenario(scenario) : null
}

export function saveCachedScenario(scenario: SimulationScenario | null) {
  if (!scenario || scenario.id.startsWith('pending-')) {
    return
  }

  const cached = readStorage<Record<string, SerializedScenario>>(SCENARIO_STORAGE_KEY, {})
  cached[scenario.id] = serializeScenario(scenario)

  const limited = Object.values(cached)
    .sort((left, right) => (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    ))
    .slice(0, MAX_CACHED_SCENARIOS)

  writeStorage(
    SCENARIO_STORAGE_KEY,
    Object.fromEntries(limited.map((item) => [item.id, item]))
  )
}
