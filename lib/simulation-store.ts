import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  SimulationAgent,
  SimulationEvent,
  SimulationPost,
  SimulationReport,
  SimulationRound,
  SimulationWorldBrief,
} from '@/types/simulation'
import {
  getScenarioLifecycleStatus,
  mergeScenarioMetadata,
  resolveScenarioProgressUpdate,
  type RawScenarioMetadata,
} from '@/lib/simulation-contract'
import { buildEventInsertRows, isMissingColumnError, isMissingRelatedPostIdColumnError } from '@/lib/simulation-persistence'

export interface PersistedSimulationResults {
  agents: SimulationAgent[]
  posts: SimulationPost[]
  events: SimulationEvent[]
  rounds: SimulationRound[]
  summary: string
  predictions: string[]
  brief?: SimulationWorldBrief
  report?: SimulationReport
}

export interface SimulationProgress {
  stage: 'queued' | 'initializing' | 'running' | 'analyzing' | 'persisting' | 'completed' | 'failed'
  message: string
  currentRound?: number
  totalRounds?: number
  postsCount?: number
  eventsCount?: number
  updatedAt: string
}

interface ProgressMetadata {
  workflowRunId?: string
  mockMode?: boolean
  error?: string
}

type DatabaseColumnError = { code?: string; message?: string }

async function updateLinkedProjectForScenario(
  scenarioId: string,
  update: Record<string, unknown>
) {
  const { data: scenario, error: scenarioError } = await supabaseAdmin
    .from('mirofish_scenarios')
    .select('project_id')
    .eq('id', scenarioId)
    .single()

  if (scenarioError) {
    throw new Error(`Failed to load scenario project link: ${scenarioError.message}`)
  }

  if (!scenario.project_id) {
    return
  }

  const { error: projectError } = await supabaseAdmin
    .from('mirofish_projects')
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scenario.project_id)

  if (projectError) {
    throw new Error(`Failed to update linked project: ${projectError.message}`)
  }
}

export async function updateScenarioProgress(
  scenarioId: string,
  progress: SimulationProgress,
  metadata: ProgressMetadata = {}
) {
  const { data: scenario, error: fetchError } = await supabaseAdmin
    .from('mirofish_scenarios')
    .select('results')
    .eq('id', scenarioId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to load scenario metadata: ${fetchError.message}`)
  }

  const existingMetadata = (scenario.results ?? null) as RawScenarioMetadata | null
  const resolved = resolveScenarioProgressUpdate(existingMetadata?.progress, progress)

  if (resolved.heartbeatOnly) {
    console.warn('[Simulation] Ignoring regressive progress update from workflow retry', {
      scenarioId,
      existingStage: existingMetadata?.progress?.stage,
      incomingStage: progress.stage,
      existingRound: existingMetadata?.progress?.currentRound,
      incomingRound: progress.currentRound,
    })
  }

  const results = mergeScenarioMetadata(existingMetadata, {
    progress: resolved.progress,
    workflowRunId: metadata.workflowRunId,
    mockMode: metadata.mockMode,
    error: metadata.error,
  })

  const { error } = await supabaseAdmin
    .from('mirofish_scenarios')
    .update({
      status: getScenarioLifecycleStatus(resolved.progress.stage),
      results,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scenarioId)

  if (error) {
    throw new Error(`Failed to update scenario progress: ${error.message}`)
  }
}

export async function markScenarioFailed(
  scenarioId: string,
  errorMessage: string,
  metadata: ProgressMetadata = {}
) {
  await updateScenarioProgress(
    scenarioId,
    {
      stage: 'failed',
      message: errorMessage,
      updatedAt: new Date().toISOString(),
    },
    {
      ...metadata,
      error: errorMessage,
    }
  )

  await updateLinkedProjectForScenario(scenarioId, {
    status: 'simulation_failed',
  })
}

async function clearScenarioArtifacts(scenarioId: string) {
  const tables = [
    'mirofish_comments',
    'mirofish_events',
    'mirofish_rounds',
    'mirofish_agents',
    'mirofish_posts',
  ] as const

  for (const table of tables) {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('scenario_id', scenarioId)

    if (error) {
      throw new Error(`Failed clearing ${table}: ${error.message}`)
    }
  }
}

export async function persistSimulationResults(
  scenarioId: string,
  simulationResults: PersistedSimulationResults,
  metadata: ProgressMetadata = {}
) {
  await clearScenarioArtifacts(scenarioId)

  const { error: agentsError } = await supabaseAdmin
    .from('mirofish_agents')
    .insert(
      simulationResults.agents.map((agent) => ({
        scenario_id: scenarioId,
        agent_id: agent.id,
        name: agent.name,
        role: agent.role,
        personality: agent.personality,
        x: agent.x,
        y: agent.y,
        connections: agent.connections,
        state: agent.state,
        sentiment: agent.sentiment,
        influence: agent.influence,
      }))
    )

  if (agentsError) {
    throw new Error(`Failed to save agents: ${agentsError.message}`)
  }

  const { error: postsError } = await supabaseAdmin
    .from('mirofish_posts')
    .insert(
      simulationResults.posts.map((post) => ({
        scenario_id: scenarioId,
        post_id: post.id,
        agent_id: post.agentId,
        agent_name: post.agentName,
        agent_role: post.agentRole,
        content: post.content,
        timestamp: post.timestamp.toISOString(),
        round: post.round,
        platform: post.platform,
        sentiment: post.sentiment,
        engagement: post.engagement,
        likes: post.likes,
      }))
    )

  if (postsError) {
    throw new Error(`Failed to save posts: ${postsError.message}`)
  }

  const commentsToInsert = simulationResults.posts.flatMap((post) =>
    post.comments.map((comment) => ({
      scenario_id: scenarioId,
      comment_id: comment.id,
      post_id: post.id,
      agent_id: comment.agentId,
      agent_name: comment.agentName,
      content: comment.content,
      timestamp: comment.timestamp.toISOString(),
      round: post.round,
      likes: comment.likes,
    }))
  )

  if (commentsToInsert.length > 0) {
    const { error: commentsError } = await supabaseAdmin
      .from('mirofish_comments')
      .insert(commentsToInsert)

    if (commentsError) {
      throw new Error(`Failed to save comments: ${commentsError.message}`)
    }
  }

  if (simulationResults.events.length > 0) {
    let includeRelatedPostId = true
    let includeRound = true
    let eventsError: { code?: string; message?: string } | null = null

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const insertResponse = (await supabaseAdmin
        .from('mirofish_events')
        .insert(buildEventInsertRows(scenarioId, simulationResults.events, {
          includeRelatedPostId,
          includeRound,
        }))) as { error: DatabaseColumnError | null }

      const insertError: DatabaseColumnError | null = insertResponse.error
      eventsError = insertError

      if (!eventsError) {
        break
      }

      const missingRelatedPostId: boolean =
        includeRelatedPostId && isMissingRelatedPostIdColumnError(eventsError)
      const missingRound: boolean =
        includeRound && isMissingColumnError(eventsError, 'mirofish_events', 'round')

      if (!missingRelatedPostId && !missingRound) {
        break
      }

      includeRelatedPostId = includeRelatedPostId && !missingRelatedPostId
      includeRound = includeRound && !missingRound

      console.warn('[Simulation] Retrying event persistence for older database schema', {
        scenarioId,
        includeRelatedPostId,
        includeRound,
      })
    }

    if (eventsError) {
      throw new Error(`Failed to save events: ${eventsError.message}`)
    }
  }

  const { error: roundsError } = await supabaseAdmin
    .from('mirofish_rounds')
    .insert(
      simulationResults.rounds.map((round) => ({
        scenario_id: scenarioId,
        round: round.round,
        timestamp: round.timestamp.toISOString(),
        actions: round.actions,
        sentiment_changes: round.sentimentChanges,
        new_connections: round.newConnections,
      }))
    )

  if (roundsError) {
    throw new Error(`Failed to save rounds: ${roundsError.message}`)
  }

  const results = {
    ...simulationResults,
    workflowRunId: metadata.workflowRunId,
    mockMode: metadata.mockMode,
    progress: {
      stage: 'completed',
      message: 'Simulation complete',
      currentRound: simulationResults.rounds.length,
      totalRounds: simulationResults.rounds.length,
      postsCount: simulationResults.posts.length,
      eventsCount: simulationResults.events.length,
      updatedAt: new Date().toISOString(),
    },
  }

  const { error: updateError } = await supabaseAdmin
    .from('mirofish_scenarios')
    .update({
      status: 'completed',
      results,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scenarioId)

  if (updateError) {
    throw new Error(`Failed to update scenario: ${updateError.message}`)
  }

  await updateLinkedProjectForScenario(scenarioId, {
    latest_scenario_id: scenarioId,
    status: 'simulation_completed',
    focus_areas: simulationResults.brief?.focusAreas ?? null,
    platforms: simulationResults.brief?.platforms ?? null,
    source_mode: simulationResults.brief?.sourceMode ?? null,
    source_reference: simulationResults.brief?.sourceReference ?? null,
    report_snapshot: simulationResults.report ?? null,
  })
}
