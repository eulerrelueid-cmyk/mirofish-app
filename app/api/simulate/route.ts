import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { runSimulation } from './engine'

const DEFAULT_AGENT_COUNT = 15
const DEFAULT_ROUNDS = 12

// Kimi API configuration
const KIMI_BASE_URL = process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1'
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k2.5'
const IS_MOCK_MODE = process.env.USE_MOCK_SIMULATION === 'true' || (process.env.VERCEL === '1' && process.env.USE_MOCK_SIMULATION !== 'false')

export async function POST(request: NextRequest) {
  const errors: string[] = []
  
  try {
    const { title, description, seedText, userId } = await request.json()

    // Validate API key is present
    const apiKey = process.env.KIMI_API_KEY?.trim()
    if (!apiKey) {
      errors.push('KIMI_API_KEY environment variable is not set')
      return NextResponse.json(
        { 
          error: 'KIMI_API_KEY not configured',
          details: 'Please add KIMI_API_KEY to your environment variables',
          diagnostics: errors
        },
        { status: 500 }
      )
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      errors.push(`KIMI_API_KEY format invalid - should start with 'sk-'`)
      return NextResponse.json(
        { 
          error: 'KIMI_API_KEY format invalid',
          details: 'Kimi API keys should start with "sk-"',
          diagnostics: errors
        },
        { status: 500 }
      )
    }
    
    errors.push(`KIMI_API_KEY loaded: ${apiKey.substring(0, 12)}... (length: ${apiKey.length})`)
    errors.push(`Using model: ${KIMI_MODEL}`)
    errors.push(`Using API: ${KIMI_BASE_URL}`)

    // Validate Supabase service role key
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY not set')
      return NextResponse.json(
        { 
          error: 'Supabase service role key not configured',
          diagnostics: errors
        },
        { status: 500 }
      )
    }

    // Create scenario in database
    const { data: scenario, error: scenarioError } = await supabaseAdmin
      .from('mirofish_scenarios')
      .insert({
        title,
        description,
        seed_text: seedText,
        status: 'running',
        parameters: { 
          agentCount: DEFAULT_AGENT_COUNT, 
          simulationRounds: DEFAULT_ROUNDS, 
          temperature: 0.8 
        },
        user_id: userId,
      })
      .select()
      .single()

    if (scenarioError) {
      console.error('Error creating scenario:', scenarioError)
      errors.push(`Database error: ${scenarioError.message}`)
      return NextResponse.json({ 
        error: 'Failed to create scenario',
        details: scenarioError.message,
        diagnostics: errors
      }, { status: 500 })
    }

    try {
      // Run the actual multi-agent simulation
      console.log('[API] Starting simulation engine...')
      console.log('[API] Using API URL:', KIMI_BASE_URL)
      
      const simulationResults = await runSimulation({
        agentCount: DEFAULT_AGENT_COUNT,
        rounds: DEFAULT_ROUNDS,
        apiKey,
        scenarioTitle: title,
        scenarioDescription: description,
        seedText
      })

      console.log('[API] Simulation complete, saving to database...')

      // Save agents to database
      const { error: agentsError } = await supabaseAdmin
        .from('mirofish_agents')
        .insert(
          simulationResults.agents.map(agent => ({
            scenario_id: scenario.id,
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
        console.error('Error saving agents:', agentsError)
        errors.push(`Failed to save agents: ${agentsError.message}`)
      }

      // Save posts to database
      const { error: postsError } = await supabaseAdmin
        .from('mirofish_posts')
        .insert(
          simulationResults.posts.map(post => ({
            scenario_id: scenario.id,
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
        console.error('Error saving posts:', postsError)
        errors.push(`Failed to save posts: ${postsError.message}`)
      }

      // Save comments to database
      const commentsToInsert = simulationResults.posts.flatMap(post =>
        post.comments.map(comment => ({
          scenario_id: scenario.id,
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
          console.error('Error saving comments:', commentsError)
          // Non-fatal, continue
        }
      }

      // Save events to database
      const { error: eventsError } = await supabaseAdmin
        .from('mirofish_events')
        .insert(
          simulationResults.events.map(event => ({
            scenario_id: scenario.id,
            event_id: event.id,
            timestamp: event.timestamp.toISOString(),
            type: event.type,
            description: event.description,
            agents_involved: event.agentsInvolved,
            impact: event.impact,
            round: event.round,
            related_post_id: event.relatedPostId,
          }))
        )

      if (eventsError) {
        console.error('Error saving events:', eventsError)
        errors.push(`Failed to save events: ${eventsError.message}`)
      }

      // Save rounds to database
      const { error: roundsError } = await supabaseAdmin
        .from('mirofish_rounds')
        .insert(
          simulationResults.rounds.map(round => ({
            scenario_id: scenario.id,
            round: round.round,
            timestamp: round.timestamp.toISOString(),
            actions: round.actions,
            sentiment_changes: round.sentimentChanges,
            new_connections: round.newConnections,
          }))
        )

      if (roundsError) {
        console.error('Error saving rounds:', roundsError)
        // Non-fatal, continue
      }

      // Update scenario with results
      const results = {
        agents: simulationResults.agents,
        posts: simulationResults.posts,
        events: simulationResults.events,
        rounds: simulationResults.rounds,
        summary: simulationResults.summary,
        predictions: simulationResults.predictions,
      }

      const { error: updateError } = await supabaseAdmin
        .from('mirofish_scenarios')
        .update({
          status: 'completed',
          results,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scenario.id)

      if (updateError) {
        console.error('Error updating scenario:', updateError)
        errors.push(`Failed to update scenario: ${updateError.message}`)
      }

      console.log('[API] Simulation complete!')

      return NextResponse.json({
        scenarioId: scenario.id,
        agents: simulationResults.agents,
        posts: simulationResults.posts,
        events: simulationResults.events,
        rounds: simulationResults.rounds,
        summary: simulationResults.summary,
        predictions: simulationResults.predictions,
        warnings: errors.length > 0 ? errors : undefined,
        mockMode: IS_MOCK_MODE,
      })

    } catch (simError) {
      // Update scenario status to failed
      await supabaseAdmin
        .from('mirofish_scenarios')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scenario.id)

      // Add simulation error details
      if (simError instanceof Error) {
        errors.push(`Simulation error: ${simError.message}`)
      }
      
      throw simError
    }

  } catch (error) {
    console.error('Simulation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Simulation failed'
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json({ 
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      diagnostics: errors
    }, { status: 500 })
  }
}

// GET endpoint to retrieve simulation results
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
    // Get scenario with all related data
    const { data: scenario, error: scenarioError } = await supabaseAdmin
      .from('mirofish_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single()

    if (scenarioError) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      )
    }

    // Get agents
    const { data: agents, error: agentsError } = await supabaseAdmin
      .from('mirofish_agents')
      .select('*')
      .eq('scenario_id', scenarioId)

    if (agentsError) {
      console.error('Error fetching agents:', agentsError)
    }

    // Get posts with comments
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('mirofish_posts')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('round', { ascending: true })

    if (postsError) {
      console.error('Error fetching posts:', postsError)
    }

    // Get comments for all posts
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('mirofish_comments')
      .select('*')
      .eq('scenario_id', scenarioId)

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
    }

    // Get events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('mirofish_events')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('round', { ascending: true })

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
    }

    // Assemble posts with comments
    const postsWithComments = (posts || []).map((post: any) => ({
      ...post,
      comments: (comments || []).filter((c: any) => c.post_id === post.post_id)
    }))

    return NextResponse.json({
      scenario,
      agents: agents || [],
      posts: postsWithComments,
      events: events || [],
      results: scenario.results
    })

  } catch (error) {
    console.error('Error fetching simulation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch simulation' },
      { status: 500 }
    )
  }
}
