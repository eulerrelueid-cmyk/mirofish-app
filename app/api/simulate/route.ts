import { NextRequest, NextResponse } from 'next/server'
import { start } from 'workflow/api'

import { normalizeScenarioField, parseMultipartScenarioFormData } from '@/lib/scenario-request'
import { ensureScenarioOwner, setScenarioOwnerCookie } from '@/lib/scenario-owner'
import { buildSimulationWorldBrief } from '@/lib/project-artifacts'
import { getStaleScenarioMessage, isScenarioStale, type RawScenarioMetadata } from '@/lib/simulation-contract'
import { markScenarioFailed, updateScenarioProgress } from '@/lib/simulation-store'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runScenarioWorkflow } from '@/workflows/simulation'

import { IS_MOCK_MODE } from './engine'

const DEFAULT_AGENT_COUNT = 15
const DEFAULT_ROUNDS = 12
export const dynamic = 'force-dynamic'

interface ParsedScenarioRequest {
  title: string
  description: string
  seedText?: string
  userId: string | null
  uploadedFile: {
    extractedText: string
    metadata: {
      name: string
      type: string
      size: number
      extractedCharacters: number
    }
  } | null
  combinedSeedText?: string
}

async function parseScenarioRequest(request: NextRequest): Promise<ParsedScenarioRequest> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    return parseMultipartScenarioFormData(formData, async (file) => {
      const { parseUploadedScenarioFile } = await import('@/lib/document-parser')
      return parseUploadedScenarioFile(file)
    })
  }

  const body = (await request.json()) as {
    title?: string
    description?: string
    seedText?: string
    userId?: string | null
  }

  const seedText = normalizeScenarioField(body.seedText)

  return {
    title: normalizeScenarioField(body.title) ?? '',
    description: normalizeScenarioField(body.description) ?? '',
    seedText,
    userId: normalizeScenarioField(body.userId ?? undefined) ?? null,
    uploadedFile: null,
    combinedSeedText: seedText,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, seedText, userId, uploadedFile, combinedSeedText } = await parseScenarioRequest(request)

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Scenario title and description are required.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.KIMI_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'KIMI_API_KEY not configured' },
        { status: 500 }
      )
    }

    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json(
        { error: 'KIMI_API_KEY format invalid' },
        { status: 500 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase service role key not configured' },
        { status: 500 }
      )
    }

    const owner = ensureScenarioOwner(request)
    const worldBrief = buildSimulationWorldBrief({
      title,
      description,
      seedText: combinedSeedText,
      sourceReference: uploadedFile?.metadata.name,
    })

    const { data: project, error: projectError } = await supabaseAdmin
      .from('mirofish_projects')
      .insert({
        name: title,
        objective: description,
        status: 'simulation_running',
        owner_token_hash: owner.ownerHash,
        source_mode: worldBrief.sourceMode,
        source_reference: worldBrief.sourceReference ?? null,
        focus_areas: worldBrief.focusAreas,
        platforms: worldBrief.platforms,
        user_id: userId,
      })
      .select('id')
      .single()

    if (projectError) {
      console.error('Error creating project:', projectError)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    const { data: scenario, error: scenarioError } = await supabaseAdmin
      .from('mirofish_scenarios')
      .insert({
        project_id: project.id,
        title,
        description,
        seed_text: seedText,
        uploaded_file: uploadedFile?.metadata ?? null,
        owner_token_hash: owner.ownerHash,
        status: 'running',
        parameters: {
          agentCount: DEFAULT_AGENT_COUNT,
          simulationRounds: DEFAULT_ROUNDS,
          temperature: 0.8,
        },
        user_id: userId,
      })
      .select('id')
      .single()

    if (scenarioError) {
      console.error('Error creating scenario:', scenarioError)
      return NextResponse.json(
        { error: 'Failed to create scenario' },
        { status: 500 }
      )
    }

    try {
      const workflowRun = await start(runScenarioWorkflow, [{
        scenarioId: scenario.id,
        title,
        description,
        seedText: combinedSeedText,
        agentCount: DEFAULT_AGENT_COUNT,
        rounds: DEFAULT_ROUNDS,
        apiKey,
      }])

      await updateScenarioProgress(
        scenario.id,
        {
          stage: 'queued',
          message: 'Simulation queued for background execution',
          totalRounds: DEFAULT_ROUNDS,
          updatedAt: new Date().toISOString(),
        },
        {
          workflowRunId: workflowRun.runId,
          mockMode: IS_MOCK_MODE,
        }
      )

      const response = NextResponse.json({
        projectId: project.id,
        scenarioId: scenario.id,
        workflowRunId: workflowRun.runId,
        status: 'running',
        mockMode: IS_MOCK_MODE,
      })

      if (owner.shouldSetCookie) {
        setScenarioOwnerCookie(response, owner.token)
      }

      return response
    } catch (simError) {
      const failureMessage = simError instanceof Error ? simError.message : 'Simulation failed'

      await markScenarioFailed(scenario.id, failureMessage, {
        mockMode: IS_MOCK_MODE,
      })

      throw simError
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'DocumentParserError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Simulation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Simulation failed'
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const scenarioId = searchParams.get('id')

  if (!scenarioId) {
    return NextResponse.json(
      { error: 'Scenario ID required' },
      { status: 400 }
    )
  }

  try {
    const { data: scenario, error: scenarioError } = await supabaseAdmin
      .from('mirofish_scenarios')
      .select('id,project_id,title,description,seed_text,uploaded_file,status,created_at,updated_at,parameters,results')
      .eq('id', scenarioId)
      .single()

    if (scenarioError) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      )
    }

    if (isScenarioStale(scenario.status, scenario.updated_at)) {
      const staleMessage = getStaleScenarioMessage(scenario.updated_at)

      console.warn('[Simulation] Marking stale scenario as failed', {
        scenarioId,
        workflowRunId: scenario.results?.workflowRunId,
        updatedAt: scenario.updated_at,
      })

      try {
        await markScenarioFailed(scenarioId, staleMessage, {
          workflowRunId: (scenario.results as RawScenarioMetadata | null | undefined)?.workflowRunId,
          mockMode: (scenario.results as RawScenarioMetadata | null | undefined)?.mockMode,
        })

        scenario.status = 'failed'
        scenario.updated_at = new Date().toISOString()
        scenario.results = {
          ...(scenario.results || {}),
          error: staleMessage,
          progress: {
            ...scenario.results?.progress,
            stage: 'failed',
            message: staleMessage,
            updatedAt: new Date().toISOString(),
          },
        }
      } catch (staleError) {
        console.error('[Simulation] Failed to mark stale scenario', {
          scenarioId,
          error: staleError,
        })
      }
    }

    let project = null
    if (scenario.project_id) {
      const { data: projectData, error: projectError } = await supabaseAdmin
        .from('mirofish_projects')
        .select('id,name,objective,status,source_mode,source_reference,focus_areas,platforms,report_snapshot,latest_scenario_id,created_at,updated_at')
        .eq('id', scenario.project_id)
        .single()

      if (projectError) {
        console.error('Error fetching project:', projectError)
      } else {
        project = projectData
      }
    }

    if (scenario.status !== 'completed') {
      return NextResponse.json({
        scenario,
        project,
        agents: [],
        posts: [],
        events: [],
        results: scenario.results,
      })
    }

    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('mirofish_agents')
      .select('*')
      .eq('scenario_id', scenarioId)

    if (agentsError) {
      console.error('Error fetching agents:', agentsError)
    }

    const { data: posts, error: postsError } = await supabaseAdmin
      .from('mirofish_posts')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('round', { ascending: true })

    if (postsError) {
      console.error('Error fetching posts:', postsError)
    }

    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('mirofish_comments')
      .select('*')
      .eq('scenario_id', scenarioId)

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
    }

    const { data: events, error: eventsError } = await supabaseAdmin
      .from('mirofish_events')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('round', { ascending: true })

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
    }

    const postsWithComments = (posts || []).map((post: any) => ({
      ...post,
      comments: (comments || []).filter((comment: any) => comment.post_id === post.post_id),
    }))

    return NextResponse.json({
      scenario,
      project,
      agents: agents || [],
      posts: postsWithComments,
      events: events || [],
      results: scenario.results,
    })
  } catch (error) {
    console.error('Error fetching simulation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch simulation' },
      { status: 500 }
    )
  }
}
