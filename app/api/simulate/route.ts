import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const AGENT_COUNT = 20

interface Agent {
  id: string
  name: string
  role: string
  personality: string
  x: number
  y: number
  connections: string[]
  state: 'idle' | 'active' | 'interacting'
  sentiment: number
  influence: number
}

interface SimulationEvent {
  id: string
  timestamp: Date
  type: 'interaction' | 'sentiment_shift' | 'emergence' | 'milestone'
  description: string
  agentsInvolved: string[]
  impact: number
}

// Kimi API configuration - auto-detect endpoint from env
const KIMI_BASE_URL = process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1'
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k2.5'

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
          details: 'Please add KIMI_API_KEY to your Vercel environment variables',
          diagnostics: errors
        },
        { status: 500 }
      )
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      errors.push(`KIMI_API_KEY format invalid - should start with 'sk-', got: ${apiKey.substring(0, 10)}...`)
      return NextResponse.json(
        { 
          error: 'KIMI_API_KEY format invalid',
          details: 'Kimi API keys should start with "sk-". Check your key in Vercel environment variables.',
          hint: 'Remove any quotes if you accidentally added them around the key value',
          keyPreview: apiKey.substring(0, 10) + '...',
          diagnostics: errors
        },
        { status: 500 }
      )
    }
    
    errors.push(`KIMI_API_KEY loaded: ${apiKey.substring(0, 12)}... (length: ${apiKey.length})`)
    
    // Test API key with a simple request first
    const testResponse = await fetch(`${KIMI_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    
    if (!testResponse.ok) {
      const testError = await testResponse.text()
      errors.push(`Kimi API test failed: ${testResponse.status} - ${testError}`)
      return NextResponse.json(
        { 
          error: 'Kimi API authentication test failed',
          details: `Test request to /models returned ${testResponse.status}`,
          rawError: testError,
          hint: 'Your API key may be expired, revoked, or you may need to add credits to your Moonshot account',
          diagnostics: errors
        },
        { status: 500 }
      )
    }
    
    errors.push('Kimi API key validation passed')
    
    // Validate Supabase service role key (required for API routes to bypass RLS)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
      return NextResponse.json(
        { 
          error: 'Supabase service role key not configured',
          details: 'Please add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables',
          hint: 'Get it from Supabase Dashboard → Project Settings → API → service_role key',
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
        parameters: { agentCount: AGENT_COUNT, simulationRounds: 100, temperature: 0.7 },
        user_id: userId,
      })
      .select()
      .single()

    if (scenarioError) {
      console.error('Error creating scenario:', scenarioError)
      errors.push(`Database error: ${scenarioError.message}`)
      errors.push(`Error code: ${scenarioError.code}`)
      errors.push(`Error details: ${JSON.stringify(scenarioError.details)}`)
      return NextResponse.json({ 
        error: 'Failed to create scenario',
        details: scenarioError.message,
        code: scenarioError.code,
        hint: scenarioError.code === '42P01' ? 'Table does not exist - run schema.sql in Supabase' : undefined,
        diagnostics: errors
      }, { status: 500 })
    }

    try {
      // Generate agents using Kimi AI
      const agents = await generateAgentsWithAI(title, description, seedText, apiKey)
      
      // Save agents to database
      const { error: agentsError } = await supabaseAdmin
        .from('mirofish_agents')
        .insert(
          agents.map(agent => ({
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
        throw new Error('Failed to save agents')
      }

      // Generate events
      const events = generateEvents(agents)
      
      // Save events to database
      const { error: eventsError } = await supabaseAdmin
        .from('mirofish_events')
        .insert(
          events.map(event => ({
            scenario_id: scenario.id,
            event_id: event.id,
            timestamp: event.timestamp.toISOString(),
            type: event.type,
            description: event.description,
            agents_involved: event.agentsInvolved,
            impact: event.impact,
          }))
        )

      if (eventsError) {
        console.error('Error saving events:', eventsError)
        throw new Error('Failed to save events')
      }

      // Generate summary and predictions using Kimi AI
      const { summary, predictions } = await generateAnalysisWithAI(
        title,
        description,
        seedText,
        agents,
        apiKey
      )

      // Update scenario with results
      const results = {
        agents,
        events,
        summary,
        predictions,
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
        throw new Error('Failed to update scenario')
      }

      return NextResponse.json({
        scenarioId: scenario.id,
        agents,
        events,
        summary,
        predictions,
      })
    } catch (error) {
      // Update scenario status to failed
      await supabaseAdmin
        .from('mirofish_scenarios')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scenario.id)

      throw error
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

async function generateAgentsWithAI(
  title: string,
  description: string,
  seedText: string | undefined,
  apiKey: string
): Promise<Agent[]> {
  const prompt = `You are creating a multi-agent simulation for scenario analysis.

Scenario Title: ${title}
Scenario Description: ${description}
${seedText ? `Context/Seed Text: ${seedText}` : ''}

Generate ${AGENT_COUNT} diverse AI agents with unique personalities, roles, and initial sentiment positions.
Each agent should have:
- A unique name (first name + last name)
- A specific role relevant to the scenario
- A personality trait
- Initial sentiment (-1.0 to +1.0, negative to positive)
- Influence level (0.0 to 1.0, how much they affect others)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "string",
    "role": "string",
    "personality": "string",
    "sentiment": number,
    "influence": number
  }
]

Make agents diverse in their perspectives and relevant to the scenario.`

  const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.KIMI_MODEL || KIMI_MODEL,
      messages: [
        { role: 'system', content: 'You are a simulation engine that generates diverse AI agents for scenario analysis.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Kimi API error (generateAgents):', errorData)
    console.error('Kimi API status:', response.status)
    console.error('Kimi API statusText:', response.statusText)
    
    let errorMessage = `Kimi API error: ${response.status}`
    if (response.status === 401) {
      errorMessage = `Kimi API authentication failed - invalid or expired API key. Raw response: ${errorData}`
    } else if (response.status === 429) {
      errorMessage = 'Kimi API rate limit exceeded - please try again later'
    } else if (response.status === 500 || response.status === 502 || response.status === 503) {
      errorMessage = 'Kimi API server error - temporary issue, please retry'
    }
    
    throw new Error(errorMessage)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content
  
  if (!content) {
    throw new Error('No content from Kimi AI (generateAgents)')
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  const jsonStr = jsonMatch ? jsonMatch[0] : content
  let agentData
  try {
    agentData = JSON.parse(jsonStr)
  } catch (parseError) {
    console.error('Failed to parse agent JSON:', jsonStr)
    throw new Error('Invalid JSON format from Kimi AI (generateAgents)')
  }

  if (!Array.isArray(agentData) || agentData.length !== AGENT_COUNT) {
    throw new Error(`Expected ${AGENT_COUNT} agents, got ${agentData?.length || 0}`)
  }

  // Convert to full Agent objects
  return agentData.map((agent: any, i: number) => ({
    id: `agent-${i}`,
    name: agent.name,
    role: agent.role,
    personality: agent.personality,
    x: Math.random() * 800,
    y: Math.random() * 600,
    connections: [],
    state: ['idle', 'active', 'interacting'][Math.floor(Math.random() * 3)] as Agent['state'],
    sentiment: Math.max(-1, Math.min(1, agent.sentiment)),
    influence: Math.max(0, Math.min(1, agent.influence)),
  }))
}

async function generateAnalysisWithAI(
  title: string,
  description: string,
  seedText: string | undefined,
  agents: Agent[],
  apiKey: string
): Promise<{ summary: string; predictions: string[] }> {
  const avgSentiment = agents.reduce((acc, a) => acc + a.sentiment, 0) / agents.length
  const positiveAgents = agents.filter(a => a.sentiment > 0).length
  const negativeAgents = agents.filter(a => a.sentiment < 0).length
  const neutralAgents = agents.filter(a => a.sentiment === 0).length

  const prompt = `Analyze this multi-agent simulation scenario:

Scenario Title: ${title}
Scenario Description: ${description}
${seedText ? `Context: ${seedText}` : ''}

Agent Distribution:
- Total Agents: ${agents.length}
- Positive Sentiment: ${positiveAgents} agents
- Negative Sentiment: ${negativeAgents} agents  
- Neutral Sentiment: ${neutralAgents} agents
- Average Sentiment: ${avgSentiment.toFixed(2)}

Top Influential Agents:
${agents
  .sort((a, b) => b.influence - a.influence)
  .slice(0, 5)
  .map(a => `- ${a.name} (${a.role}): ${a.personality}, sentiment ${a.sentiment.toFixed(2)}, influence ${a.influence.toFixed(2)}`)
  .join('\n')}

Provide:
1. A concise executive summary (2-3 sentences) of the simulation outcome
2. 3-4 specific predictions based on the agent sentiment distribution

Return ONLY valid JSON:
{
  "summary": "string",
  "predictions": ["string", "string", "string", "string"]
}`

  const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.KIMI_MODEL || KIMI_MODEL,
      messages: [
        { role: 'system', content: 'You are a strategic analysis engine that interprets multi-agent simulation results.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Kimi API error (generateAnalysis):', errorData)
    console.error('Kimi API status:', response.status)
    console.error('Kimi API statusText:', response.statusText)
    
    let errorMessage = `Kimi API error: ${response.status}`
    if (response.status === 401) {
      errorMessage = 'Kimi API authentication failed - invalid or expired API key'
    } else if (response.status === 429) {
      errorMessage = 'Kimi API rate limit exceeded - please try again later'
    } else if (response.status === 500 || response.status === 502 || response.status === 503) {
      errorMessage = 'Kimi API server error - temporary issue, please retry'
    }
    
    throw new Error(errorMessage)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content
  
  if (!content) {
    throw new Error('No content from Kimi AI (generateAnalysis)')
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? jsonMatch[0] : content
  let analysis
  try {
    analysis = JSON.parse(jsonStr)
  } catch (parseError) {
    console.error('Failed to parse analysis JSON:', jsonStr)
    throw new Error('Invalid JSON format from Kimi AI (generateAnalysis)')
  }

  if (!analysis.summary || !Array.isArray(analysis.predictions)) {
    throw new Error('Invalid response format from Kimi AI - missing summary or predictions')
  }

  return {
    summary: analysis.summary,
    predictions: analysis.predictions,
  }
}

function generateEvents(agents: Agent[]): SimulationEvent[] {
  const eventTypes: ('interaction' | 'sentiment_shift' | 'emergence' | 'milestone')[] = ['interaction', 'sentiment_shift', 'emergence', 'milestone']
  
  return Array.from({ length: 12 }, (_, i) => ({
    id: `event-${i}`,
    timestamp: new Date(Date.now() - (12 - i) * 60000),
    type: eventTypes[Math.floor(Math.random() * 4)],
    description: [
      'Agent cluster formed around topic',
      'Sentiment shift detected in discussion',
      'Emergent behavior observed',
      'Consensus reached on key issue',
      'New connection established between agents',
      'Influential agent changed position',
    ][Math.floor(Math.random() * 6)],
    agentsInvolved: [
      agents[Math.floor(Math.random() * agents.length)]?.id || 'agent-0',
      agents[Math.floor(Math.random() * agents.length)]?.id || 'agent-1',
    ],
    impact: Math.random(),
  }))
}
