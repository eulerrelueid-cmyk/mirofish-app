import type {
  SimulationAgent,
  SimulationComment,
  SimulationEvent,
  SimulationPost,
  SimulationProject,
  SimulationReport,
  SimulationRound,
  SimulationScenario,
  SimulationScenarioResults,
  SimulationWorldBrief,
  SimulationProgressState,
} from '../types/simulation'

type ScenarioLifecycleStatus = SimulationScenario['status']

type RawTimestamp = string | Date
export const SCENARIO_STALE_AFTER_MS = 6 * 60 * 1000

interface RawScenarioRecord {
  id: string
  project_id?: string | null
  title?: string
  description?: string
  seed_text?: string | null
  status?: string
  created_at?: string
  updated_at?: string
  parameters?: SimulationScenario['parameters']
  results?: RawScenarioMetadata | null
}

interface RawProjectRecord {
  id: string
  name?: string
  objective?: string
  status?: SimulationProject['status']
  source_mode?: SimulationProject['sourceMode']
  source_reference?: string | null
  focus_areas?: string[] | null
  platforms?: Array<'twitter' | 'reddit'> | null
  latest_scenario_id?: string | null
  created_at?: string
  updated_at?: string
}

interface RawSimulationComment extends Omit<SimulationComment, 'timestamp'> {
  timestamp: RawTimestamp
}

interface RawSimulationPost extends Omit<SimulationPost, 'timestamp' | 'comments'> {
  timestamp: RawTimestamp
  comments: RawSimulationComment[]
}

interface RawSimulationEvent extends Omit<SimulationEvent, 'timestamp'> {
  timestamp: RawTimestamp
}

interface RawSimulationRound extends Omit<SimulationRound, 'timestamp'> {
  timestamp: RawTimestamp
}

interface RawSimulationScenarioResults extends Omit<SimulationScenarioResults, 'posts' | 'events' | 'rounds'> {
  posts: RawSimulationPost[]
  events: RawSimulationEvent[]
  rounds: RawSimulationRound[]
}

export interface RawScenarioMetadata {
  workflowRunId?: string
  mockMode?: boolean
  error?: string
  progress?: SimulationProgressState
  agents?: SimulationAgent[]
  posts?: RawSimulationPost[]
  events?: RawSimulationEvent[]
  rounds?: RawSimulationRound[]
  summary?: string
  predictions?: string[]
  brief?: SimulationWorldBrief
  report?: SimulationReport
}

export interface SimulationPollResponse {
  scenario: RawScenarioRecord
  project?: RawProjectRecord | null
  results?: RawScenarioMetadata | null
}

function normalizeProject(project: RawProjectRecord | null | undefined, previousProject?: SimulationProject): SimulationProject | undefined {
  if (!project && !previousProject) {
    return undefined
  }

  return {
    id: project?.id ?? previousProject?.id ?? 'unknown-project',
    name: project?.name ?? previousProject?.name ?? 'Untitled project',
    objective: project?.objective ?? previousProject?.objective ?? '',
    status: project?.status ?? previousProject?.status ?? 'draft',
    sourceMode: project?.source_mode ?? previousProject?.sourceMode ?? 'prompt_only',
    sourceReference: project?.source_reference ?? previousProject?.sourceReference ?? undefined,
    focusAreas: project?.focus_areas ?? previousProject?.focusAreas ?? [],
    platforms: project?.platforms ?? previousProject?.platforms ?? ['twitter', 'reddit'],
    latestScenarioId: project?.latest_scenario_id ?? previousProject?.latestScenarioId ?? undefined,
    createdAt: project?.created_at ? new Date(project.created_at) : previousProject?.createdAt ?? new Date(),
    updatedAt: project?.updated_at ? new Date(project.updated_at) : previousProject?.updatedAt ?? new Date(),
  }
}

function toDate(timestamp: RawTimestamp): Date {
  return timestamp instanceof Date ? timestamp : new Date(timestamp)
}

function normalizeComment(comment: RawSimulationComment): SimulationComment {
  return {
    ...comment,
    timestamp: toDate(comment.timestamp),
  }
}

function normalizePost(post: RawSimulationPost): SimulationPost {
  return {
    ...post,
    timestamp: toDate(post.timestamp),
    comments: post.comments.map(normalizeComment),
  }
}

function normalizeEvent(event: RawSimulationEvent): SimulationEvent {
  return {
    ...event,
    timestamp: toDate(event.timestamp),
  }
}

function normalizeRound(round: RawSimulationRound): SimulationRound {
  return {
    ...round,
    timestamp: toDate(round.timestamp),
  }
}

function hasFinalResults(value: RawScenarioMetadata | null | undefined): value is RawSimulationScenarioResults & RawScenarioMetadata {
  return Boolean(
    value &&
      Array.isArray(value.agents) &&
      Array.isArray(value.posts) &&
      Array.isArray(value.events) &&
      Array.isArray(value.rounds) &&
      typeof value.summary === 'string' &&
      Array.isArray(value.predictions)
  )
}

export function getScenarioLifecycleStatus(status?: string): ScenarioLifecycleStatus {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'pending':
      return 'pending'
    case 'queued':
    case 'initializing':
    case 'running':
    case 'analyzing':
    case 'persisting':
    default:
      return 'running'
  }
}

export function mergeScenarioMetadata(
  existing: RawScenarioMetadata | null | undefined,
  incoming: RawScenarioMetadata
): RawScenarioMetadata {
  return {
    ...existing,
    ...incoming,
    workflowRunId: incoming.workflowRunId ?? existing?.workflowRunId,
    mockMode: incoming.mockMode ?? existing?.mockMode,
    error: incoming.error ?? existing?.error,
    progress: incoming.progress ?? existing?.progress,
  }
}

export function isScenarioStale(
  status: string | undefined,
  updatedAt: RawTimestamp | undefined,
  now = Date.now()
) {
  if (getScenarioLifecycleStatus(status) !== 'running' || !updatedAt) {
    return false
  }

  return now - toDate(updatedAt).getTime() > SCENARIO_STALE_AFTER_MS
}

export function getStaleScenarioMessage(updatedAt: RawTimestamp | undefined) {
  const staleAt = updatedAt ? toDate(updatedAt).toISOString() : 'unknown time'
  return `Scenario stalled with no progress updates since ${staleAt}.`
}

function normalizeSimulationResults(
  value: RawScenarioMetadata | null | undefined
): SimulationScenarioResults | undefined {
  if (!hasFinalResults(value)) {
    return undefined
  }

  return {
    agents: value.agents,
    posts: value.posts.map(normalizePost),
    events: value.events.map(normalizeEvent),
    rounds: value.rounds.map(normalizeRound),
    summary: value.summary,
    predictions: value.predictions,
    brief: value.brief,
    report: value.report,
  }
}

export function buildScenarioFromPollResponse(
  payload: SimulationPollResponse,
  previousScenario?: SimulationScenario | null
): SimulationScenario {
  const rawMetadata = mergeScenarioMetadata(payload.scenario.results, payload.results ?? {})
  const lifecycleStatus = getScenarioLifecycleStatus(payload.scenario.status)
  const staleScenario = isScenarioStale(payload.scenario.status, payload.scenario.updated_at)
  const normalizedResults =
    normalizeSimulationResults(rawMetadata) ??
    (lifecycleStatus === 'completed' ? previousScenario?.results : undefined)
  const missingFinalResults = lifecycleStatus === 'completed' && !normalizedResults
  const errorMessage =
    missingFinalResults
      ? 'Scenario was marked completed, but the payload was missing final results.'
      : staleScenario
      ? getStaleScenarioMessage(payload.scenario.updated_at)
      : rawMetadata.error ?? previousScenario?.errorMessage

  return {
    id: payload.scenario.id,
    title: payload.scenario.title ?? previousScenario?.title ?? 'Untitled scenario',
    description: payload.scenario.description ?? previousScenario?.description ?? '',
    project: normalizeProject(payload.project, previousScenario?.project),
    seedText: payload.scenario.seed_text ?? previousScenario?.seedText ?? undefined,
    uploadedFile: previousScenario?.uploadedFile,
    status: missingFinalResults || staleScenario ? 'failed' : normalizedResults ? 'completed' : lifecycleStatus,
    createdAt: payload.scenario.created_at
      ? new Date(payload.scenario.created_at)
      : previousScenario?.createdAt ?? new Date(),
    updatedAt: payload.scenario.updated_at
      ? new Date(payload.scenario.updated_at)
      : previousScenario?.updatedAt ?? new Date(),
    mockMode: rawMetadata.mockMode ?? previousScenario?.mockMode,
    workflowRunId: rawMetadata.workflowRunId ?? previousScenario?.workflowRunId,
    errorMessage,
    progress: rawMetadata.progress ?? previousScenario?.progress,
    parameters: payload.scenario.parameters ?? previousScenario?.parameters ?? {
      agentCount: 15,
      simulationRounds: 12,
      temperature: 0.8,
    },
    results: normalizedResults,
  }
}
