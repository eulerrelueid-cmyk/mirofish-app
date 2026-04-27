import { IS_MOCK_MODE, runSimulation, type SimulationProgressUpdate } from '@/app/api/simulate/engine'
import {
  markScenarioFailed,
  persistSimulationResults,
  type SimulationProgress,
  updateScenarioProgress,
} from '@/lib/simulation-store'

const PROGRESS_WRITE_TIMEOUT_MS = 8_000
const FAILURE_WRITE_TIMEOUT_MS = 10_000
const SIMULATION_TIMEOUT_MS = 12 * 60 * 1000
const PERSIST_TIMEOUT_MS = 45_000

interface RunScenarioWorkflowInput {
  scenarioId: string
  title: string
  description: string
  seedText?: string
  agentCount: number
  rounds: number
  apiKey: string
  workflowRunId?: string
}

export async function runScenarioWorkflow(input: RunScenarioWorkflowInput) {
  'use workflow'

  console.log('[Workflow] Starting scenario workflow', {
    scenarioId: input.scenarioId,
    workflowRunId: input.workflowRunId,
    title: input.title,
  })

  try {
    const simulationResults = await executeSimulation(input)
    await persistResults(input.scenarioId, simulationResults, input.workflowRunId)

    console.log('[Workflow] Scenario workflow completed', {
      scenarioId: input.scenarioId,
      workflowRunId: input.workflowRunId,
    })

    return {
      scenarioId: input.scenarioId,
      status: 'completed',
    }
  } catch (error) {
    console.error('[Workflow] Scenario execution failed', {
      scenarioId: input.scenarioId,
      error,
    })
    const message = error instanceof Error ? error.message : 'Simulation failed'
    await failScenario(input.scenarioId, message, input.workflowRunId)
    throw error
  }
}

async function executeSimulation(input: RunScenarioWorkflowInput) {
  'use step'

  console.log('[Workflow] Entering executeSimulation step', {
    scenarioId: input.scenarioId,
    workflowRunId: input.workflowRunId,
  })

  await safeUpdateProgress(
    input.scenarioId,
    {
      stage: 'initializing',
      message: 'Preparing agents and scenario context',
      totalRounds: input.rounds,
      updatedAt: new Date().toISOString(),
    },
    {
      workflowRunId: input.workflowRunId,
      mockMode: IS_MOCK_MODE,
    }
  )

  const simulationResults = await withTimeout(
    runSimulation({
      agentCount: input.agentCount,
      rounds: input.rounds,
      apiKey: input.apiKey,
      scenarioTitle: input.title,
      scenarioDescription: input.description,
      seedText: input.seedText,
      onProgress: async (progress: SimulationProgressUpdate) => {
        await safeUpdateProgress(
          input.scenarioId,
          {
            stage: progress.stage,
            message: progress.message,
            currentRound: progress.currentRound,
            totalRounds: progress.totalRounds,
            postsCount: progress.postsCount,
            eventsCount: progress.eventsCount,
            updatedAt: new Date().toISOString(),
          },
          {
            workflowRunId: input.workflowRunId,
            mockMode: IS_MOCK_MODE,
          }
        )
      },
    }),
    SIMULATION_TIMEOUT_MS,
    `simulation execution for ${input.scenarioId}`
  )

  console.log('[Workflow] executeSimulation step completed', {
    scenarioId: input.scenarioId,
    workflowRunId: input.workflowRunId,
    posts: simulationResults.posts.length,
    events: simulationResults.events.length,
    rounds: simulationResults.rounds.length,
  })

  return simulationResults
}

async function persistResults(
  scenarioId: string,
  simulationResults: Awaited<ReturnType<typeof runSimulation>>,
  workflowRunId?: string
) {
  'use step'

  console.log('[Workflow] Entering persistResults step', {
    scenarioId,
    workflowRunId,
    posts: simulationResults.posts.length,
    events: simulationResults.events.length,
    rounds: simulationResults.rounds.length,
  })

  await safeUpdateProgress(
    scenarioId,
    {
      stage: 'persisting',
      message: 'Saving simulation artifacts',
      currentRound: simulationResults.rounds.length,
      totalRounds: simulationResults.rounds.length,
      postsCount: simulationResults.posts.length,
      eventsCount: simulationResults.events.length,
      updatedAt: new Date().toISOString(),
    },
    {
      workflowRunId,
      mockMode: IS_MOCK_MODE,
    }
  )

  await withTimeout(
    persistSimulationResults(scenarioId, simulationResults, {
      workflowRunId,
      mockMode: IS_MOCK_MODE,
    }),
    PERSIST_TIMEOUT_MS,
    `result persistence for ${scenarioId}`
  )

  console.log('[Workflow] persistResults step completed', {
    scenarioId,
    workflowRunId,
  })
}

async function failScenario(scenarioId: string, errorMessage: string, workflowRunId?: string) {
  'use step'

  console.log('[Workflow] Entering failScenario step', {
    scenarioId,
    workflowRunId,
    errorMessage,
  })

  try {
    await withTimeout(
      markScenarioFailed(scenarioId, errorMessage, {
        workflowRunId,
        mockMode: IS_MOCK_MODE,
      }),
      FAILURE_WRITE_TIMEOUT_MS,
      `failure persistence for ${scenarioId}`
    )
  } catch (error) {
    console.error('[Workflow] Failed to persist scenario failure state', {
      scenarioId,
      workflowRunId,
      error,
    })
  }
}

async function safeUpdateProgress(
  scenarioId: string,
  progress: SimulationProgress,
  metadata: { workflowRunId?: string; mockMode?: boolean }
) {
  console.log('[Workflow] Progress update requested', {
    scenarioId,
    workflowRunId: metadata.workflowRunId,
    stage: progress.stage,
    message: progress.message,
    currentRound: progress.currentRound,
    totalRounds: progress.totalRounds,
  })

  try {
    await withTimeout(
      updateScenarioProgress(scenarioId, progress, metadata),
      PROGRESS_WRITE_TIMEOUT_MS,
      `progress update (${progress.stage}) for ${scenarioId}`
    )
  } catch (error) {
    console.error('[Workflow] Progress update failed but workflow will continue', {
      scenarioId,
      workflowRunId: metadata.workflowRunId,
      stage: progress.stage,
      error,
    })
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms while waiting for ${label}`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
