import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

// Kimi API configuration
const KIMI_BASE_URL = 'https://api.moonshot.cn/v1'
const KIMI_MODEL = 'kimi-k2-5K'

export async function POST(request: NextRequest) {
  try {
    const { title, description, seedText, userId } = await request.json()

    // Create scenario in database
    const { data: scenario, error: scenarioError } = await supabase
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
      return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 })
    }

    // Generate agents using Kimi AI
    const agents = await generateAgentsWithAI(title, description, seedText)
    
    // Save agents to database
    const { error: agentsError } = await supabase
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
    }

    // Generate events
    const events = generateEvents(agents)
    
    // Save events to database
    const { error: eventsError } = await supabase
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
    }

    // Generate summary and predictions using Kimi AI
    const { summary, predictions } = await generateAnalysisWithAI(
      title,
      description,
      seedText,
      agents
    )

    // Update scenario with results
    const results = {
      agents,
      events,
      summary,
      predictions,
    }

    const { error: updateError } = await supabase
      .from('mirofish_scenarios')
      .update({
        status: 'completed',
        results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenario.id)

    if (updateError) {
      console.error('Error updating scenario:', updateError)
    }

    return NextResponse.json({
      scenarioId: scenario.id,
      agents,
      events,
      summary,
      predictions,
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}

async function generateAgentsWithAI(
  title: string,
  description: string,
  seedText?: string
): Promise<Agent[]> {
  const apiKey = process.env.KIMI_API_KEY
  
  if (!apiKey) {
    console.warn('No Kimi API key found, using mock agents')
    return generateMockAgents()
  }

  try {
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
      console.error('Kimi API error:', errorData)
      throw new Error(`Kimi API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No content from Kimi AI')
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    const agentData = JSON.parse(jsonStr)

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
  } catch (error) {
    console.error('Kimi AI generation failed, using mock agents:', error)
    return generateMockAgents()
  }
}

function generateMockAgents(): Agent[] {
  const states: ('idle' | 'active' | 'interacting')[] = ['idle', 'active', 'interacting']
  
  return Array.from({ length: AGENT_COUNT }, (_, i) => ({
    id: `agent-${i}`,
    name: `Agent ${i + 1}`,
    role: ['Influencer', 'Observer', 'Critic', 'Supporter', 'Analyst'][Math.floor(Math.random() * 5)],
    personality: ['Optimistic', 'Pessimistic', 'Neutral', 'Aggressive', 'Cautious'][Math.floor(Math.random() * 5)],
    x: Math.random() * 800,
    y: Math.random() * 600,
    connections: [],
    state: states[Math.floor(Math.random() * 3)],
    sentiment: (Math.random() * 2 - 1),
    influence: Math.random(),
  }))
}

async function generateAnalysisWithAI(
  title: string,
  description: string,
  seedText: string | undefined,
  agents: Agent[]
): Promise<{ summary: string; predictions: string[] }> {
  const apiKey = process.env.KIMI_API_KEY
  
  if (!apiKey) {
    console.warn('No Kimi API key found, using mock analysis')
    return generateMockAnalysis(agents)
  }

  try {
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
      console.error('Kimi API error:', errorData)
      throw new Error(`Kimi API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No content from Kimi AI')
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    const analysis = JSON.parse(jsonStr)

    return {
      summary: analysis.summary || `Simulation completed with ${agents.length} agents. Sentiment distribution shows ${positiveAgents} positive, ${negativeAgents} negative, and ${neutralAgents} neutral agents.`,
      predictions: analysis.predictions || [
        `${(positiveAgents / agents.length * 100).toFixed(0)}% of agents lean positive on the outcome`,
        'Consensus building around key issues',
        'Risk factors require monitoring',
      ],
    }
  } catch (error) {
    console.error('Kimi AI analysis failed, using mock analysis:', error)
    return generateMockAnalysis(agents)
  }
}

function generateMockAnalysis(agents: Agent[]): { summary: string; predictions: string[] } {
  const positiveAgents = agents.filter(a => a.sentiment > 0).length
  const negativeAgents = agents.filter(a => a.sentiment < 0).length
  const neutralAgents = agents.filter(a => a.sentiment === 0).length
  const avgSentiment = agents.reduce((acc, a) => acc + a.sentiment, 0) / agents.length

  return {
    summary: `Simulation completed with ${agents.length} agents. Sentiment distribution shows ${positiveAgents} positive, ${negativeAgents} negative, and ${neutralAgents} neutral agents. Overall sentiment is ${avgSentiment > 0 ? 'positive' : avgSentiment < 0 ? 'negative' : 'neutral'}.`,
    predictions: [
      `${(positiveAgents / agents.length * 100).toFixed(0)}% probability of favorable outcome`,
      'Consensus emerging on key decision factors',
      `Early signals suggest ${avgSentiment > 0 ? 'optimistic' : 'cautious'} trajectory`,
      'Monitor influential agents for sentiment shifts',
    ],
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
