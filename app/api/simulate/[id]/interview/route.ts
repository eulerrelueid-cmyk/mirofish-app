import { NextRequest, NextResponse } from 'next/server'

import { requestKimiTextCompletion } from '@/lib/kimi-chat'
import { buildSimulationInterviewMessages } from '@/lib/simulation-interview'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  SimulationEvent,
  SimulationInterviewTurn,
  SimulationProject,
  SimulationReport,
  SimulationWorldBrief,
} from '@/types/simulation'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: {
    id: string
  }
}

interface RawScenarioResults {
  summary?: string
  predictions?: string[]
  brief?: SimulationWorldBrief
  report?: SimulationReport
  posts?: Array<{
    agentName: string
    agentRole: string
    platform: 'twitter' | 'reddit'
    round: number
    engagement: number
    content: string
  }>
  events?: Array<{
    type: SimulationEvent['type']
    round: number
    impact: number
    description: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const apiKey = process.env.KIMI_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'KIMI_API_KEY not configured' }, { status: 500 })
    }

    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json({ error: 'KIMI_API_KEY format invalid' }, { status: 500 })
    }

    const body = (await request.json()) as {
      question?: string
      history?: SimulationInterviewTurn[]
    }

    const question = body.question?.trim()
    if (!question) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 })
    }

    if (question.length > 600) {
      return NextResponse.json({ error: 'Question is too long.' }, { status: 400 })
    }

    const { data: scenario, error: scenarioError } = await supabaseAdmin
      .from('mirofish_scenarios')
      .select('id,project_id,title,description,status,results')
      .eq('id', params.id)
      .single()

    if (scenarioError || !scenario) {
      return NextResponse.json({ error: 'Scenario not found.' }, { status: 404 })
    }

    if (scenario.status !== 'completed') {
      return NextResponse.json({ error: 'Only completed simulations can be queried.' }, { status: 400 })
    }

    const results = (scenario.results || {}) as RawScenarioResults
    if (typeof results.summary !== 'string') {
      return NextResponse.json({ error: 'Completed simulation was missing final analysis.' }, { status: 400 })
    }

    let project: SimulationProject | undefined
    if (scenario.project_id) {
      const { data: projectData } = await supabaseAdmin
        .from('mirofish_projects')
        .select('id,name,objective,status,source_mode,source_reference,focus_areas,platforms,report_snapshot,latest_scenario_id,created_at,updated_at')
        .eq('id', scenario.project_id)
        .single()

      if (projectData) {
        project = {
          id: projectData.id,
          name: projectData.name || 'Untitled project',
          objective: projectData.objective || '',
          status: projectData.status || 'draft',
          sourceMode: projectData.source_mode || 'prompt_only',
          sourceReference: projectData.source_reference || undefined,
          focusAreas: projectData.focus_areas || [],
          platforms: projectData.platforms || ['twitter', 'reddit'],
          reportSnapshot: projectData.report_snapshot || undefined,
          latestScenarioId: projectData.latest_scenario_id || undefined,
          createdAt: new Date(projectData.created_at),
          updatedAt: new Date(projectData.updated_at),
        }
      }
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter((turn) => turn && typeof turn.question === 'string' && typeof turn.answer === 'string')
          .slice(-4)
      : []

    const answer = await requestKimiTextCompletion({
      apiKey,
      messages: buildSimulationInterviewMessages({
        question,
        history,
        source: {
          title: scenario.title || 'Untitled scenario',
          description: scenario.description || '',
          project,
          brief: results.brief,
          summary: results.summary,
          predictions: Array.isArray(results.predictions) ? results.predictions.slice(0, 5) : [],
          report: results.report || project?.reportSnapshot,
          posts: Array.isArray(results.posts) ? results.posts.slice(0, 6) : [],
          events: Array.isArray(results.events) ? results.events.slice(0, 6) : [],
        },
      }),
      temperature: 0.4,
      maxTokens: 700,
      timeoutMs: 30_000,
    })

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('[SimulationInterview] Failed to answer question', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Interview request failed.' },
      { status: 500 }
    )
  }
}
