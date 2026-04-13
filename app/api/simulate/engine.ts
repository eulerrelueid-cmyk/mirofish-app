/**
 * Enhanced MiroFish Multi-Agent Simulation Engine v2.0
 * 
 * This engine runs a sophisticated multi-agent simulation where:
 * - Agents have rich personas with beliefs, goals, and communication styles
 * - Agents observe and react to a dynamic social environment
 * - Content is generated via LLM for each post/comment (rich, unique content)
 * - Social dynamics emerge: viral posts, cascade effects, polarization
 * - Agents remember interactions and form opinions about other agents
 * - Threads and conversations develop organically
 */

import { 
  SimulationAgent, 
  SimulationPost, 
  SimulationComment,
  SimulationEvent, 
  SimulationRound,
  AgentAction,
  AgentMemory,
  AgentProfile
} from '@/types/simulation'

const KIMI_BASE_URL = process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1'
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k2.5'

interface SimulationConfig {
  agentCount: number
  rounds: number
  apiKey: string
  scenarioTitle: string
  scenarioDescription: string
  seedText?: string
}

interface SimulationState {
  agents: SimulationAgent[]
  posts: SimulationPost[]
  events: SimulationEvent[]
  rounds: SimulationRound[]
  currentRound: number
  agentOpinions: Map<string, Map<string, number>> // agentId -> (targetAgentId -> opinion)
  trendingTopics: string[]
}

// Content templates for fallback generation
const POST_TEMPLATES = {
  support: [
    "This approach could really transform how we think about {topic}. The potential benefits are substantial.",
    "I've been advocating for something similar in my work. The data strongly supports this direction.",
    "Finally, someone addressing the core issues. This aligns with what our research has shown.",
    "The strategic implications here are significant. Organizations need to pay attention to this.",
    "This resonates with my experience. The timing couldn't be better for these insights."
  ],
  oppose: [
    "I'm concerned about the implications here. Have we considered the secondary effects?",
    "The risks outlined don't match what I've observed in practice. We need more rigorous analysis.",
    "This oversimplifies a complex issue. Real-world implementation would face serious challenges.",
    "I disagree with the fundamental assumptions. The data doesn't support such broad conclusions.",
    "We should be cautious about adopting this approach. The potential downsides are significant."
  ],
  neutral: [
    "Interesting perspective. I'd like to see more data on the implementation side.",
    "This raises important questions about balancing innovation with stability.",
    "The intersection of these factors creates a complex decision landscape.",
    "Multiple stakeholders would need to align for this to work effectively.",
    "The context matters significantly here. What works in one scenario may not transfer."
  ],
  question: [
    "What's the evidence base for these claims? I'd like to review the source data.",
    "How does this account for regional variations in market conditions?",
    "Has anyone modeled the 3-year impact of these recommendations?",
    "What's the fallback strategy if these assumptions don't hold?",
    "Are we considering the human factors in this analysis?"
  ]
}

const COMMENT_TEMPLATES = {
  agree: [
    "Well said. This captures the essence of the issue.",
    "Couldn't agree more. Your analysis is spot on.",
    "Exactly the point I was trying to make earlier.",
    "This perspective adds crucial context to the discussion.",
    "You've articulated this better than I could have."
  ],
  disagree: [
    "I see it differently. The reality is more nuanced.",
    "Respectfully, this misses some key constraints we're facing.",
    "Interesting take, but it doesn't align with my observations.",
    "We may need to agree to disagree on this one.",
    "The counter-evidence suggests a different conclusion."
  ],
  expand: [
    "To build on this point, we should also consider...",
    "This connects to a broader trend I've been tracking...",
    "The implications extend further than initially apparent...",
    "When we factor in the temporal dimension...",
    "There's a regional variation worth noting here..."
  ]
}

/**
 * Main simulation runner
 */
export async function runSimulation(config: SimulationConfig): Promise<{
  agents: SimulationAgent[]
  posts: SimulationPost[]
  events: SimulationEvent[]
  rounds: SimulationRound[]
  summary: string
  predictions: string[]
}> {
  const state: SimulationState = {
    agents: [],
    posts: [],
    events: [],
    rounds: [],
    currentRound: 0,
    agentOpinions: new Map(),
    trendingTopics: []
  }

  console.log(`[Simulation] Starting: ${config.scenarioTitle}`)
  console.log(`[Simulation] Config: ${config.agentCount} agents, ${config.rounds} rounds`)

  // Step 1: Generate rich agent personas
  console.log('[Simulation] Generating agent personas...')
  state.agents = await generateAgents(config)
  console.log(`[Simulation] Generated ${state.agents.length} agents with rich personas`)

  // Initialize agent opinions matrix
  state.agents.forEach(agent => {
    state.agentOpinions.set(agent.id, new Map())
  })

  // Step 2: Run simulation rounds
  for (let round = 1; round <= config.rounds; round++) {
    state.currentRound = round
    console.log(`[Simulation] Round ${round}/${config.rounds}`)
    
    const roundResult = await runSimulationRound(state, config, round)
    state.rounds.push(roundResult)
    
    // Generate events based on round activity
    const roundEvents = generateEventsFromRound(roundResult, state, round)
    state.events.push(...roundEvents)
    
    // Update trending topics every few rounds
    if (round % 3 === 0) {
      updateTrendingTopics(state)
    }
  }

  // Step 3: Generate comprehensive analysis
  console.log('[Simulation] Generating final analysis...')
  const { summary, predictions } = await generateAnalysis(state, config)

  console.log('[Simulation] Complete!')
  console.log(`[Simulation] Final: ${state.posts.length} posts, ${state.events.length} events`)

  return {
    agents: state.agents,
    posts: state.posts,
    events: state.events,
    rounds: state.rounds,
    summary,
    predictions
  }
}

/**
 * Generate diverse, rich agent personas using Kimi AI
 */
async function generateAgents(config: SimulationConfig): Promise<SimulationAgent[]> {
  const prompt = `You are creating personas for a multi-agent social simulation.

SCENARIO: "${config.scenarioTitle}"
DESCRIPTION: ${config.scenarioDescription}
${config.seedText ? `CONTEXT: ${config.seedText}` : ''}

Generate ${config.agentCount} diverse AI agents who would realistically participate in discussions about this scenario. Each agent should be a fully realized character with:

1. Distinct professional background and expertise
2. Specific personality traits that affect how they communicate
3. Clear stance on the scenario (strongly for, moderately for, neutral, moderately against, strongly against)
4. Communication style (e.g., "direct and data-driven", "diplomatic and consensus-building", "skeptical and questioning")
5. Personal motivations and biases
6. Network influence (how much others listen to them)

Create agents that would have DIFFERENT and potentially CONFLICTING perspectives. Include:
- Industry veterans with traditional views
- Innovators pushing for change  
- Risk-averse analysts
- Optimistic entrepreneurs
- Skeptical academics
- Pragmatic implementers

Return ONLY a valid JSON array with this structure:
[
  {
    "name": "Full Name",
    "role": "Specific Job Title",
    "personality": "Brief personality descriptor",
    "bio": "2-3 sentences about their background, expertise, and current position",
    "stance": "strongly_for" | "moderately_for" | "neutral" | "moderately_against" | "strongly_against",
    "communicationStyle": "How they communicate (e.g., 'assertive and data-heavy')",
    "expertise": ["area1", "area2"],
    "motivations": "What drives their opinion on this topic",
    "sentiment": number between -1.0 and 1.0,
    "influence": number between 0.1 and 1.0
  }
]

Make each agent feel like a real person with a credible professional background.`

  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: 'You are a persona generation engine for social simulations. Create diverse, realistic professional personas. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
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
    let agentData
    try {
      agentData = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse agent JSON:', jsonStr)
      throw new Error('Invalid JSON format from Kimi AI')
    }

    if (!Array.isArray(agentData)) {
      throw new Error(`Expected array of agents, got ${typeof agentData}`)
    }

    // Convert to full Agent objects
    return agentData.map((agent: any, i: number) => ({
      id: `agent-${i}`,
      name: agent.name,
      role: agent.role,
      personality: agent.personality,
      bio: agent.bio || `${agent.name} is a ${agent.role} with a ${agent.personality.toLowerCase()} perspective.`,
      stance: agent.stance || 'neutral',
      communicationStyle: agent.communicationStyle || 'balanced and professional',
      expertise: agent.expertise || ['General'],
      motivations: agent.motivations || 'Professional interest',
      x: 100 + Math.random() * 700,
      y: 100 + Math.random() * 500,
      connections: [],
      state: 'idle' as const,
      sentiment: Math.max(-1, Math.min(1, agent.sentiment)),
      influence: Math.max(0.1, Math.min(1, agent.influence)),
      memory: {
        postsSeen: [],
        interactions: [],
        sentimentHistory: [{ round: 0, sentiment: agent.sentiment }]
      }
    }))
  } catch (error) {
    console.error('Error generating agents:', error)
    // Fallback to default agents
    return generateFallbackAgents(config.agentCount)
  }
}

/**
 * Generate fallback agents if API fails
 */
function generateFallbackAgents(count: number): SimulationAgent[] {
  const roles = ['Strategy Consultant', 'Product Manager', 'Risk Analyst', 'CEO', 'Research Director', 'VP Engineering', 'CFO', 'Innovation Lead']
  const personalities = ['Analytical', 'Visionary', 'Skeptical', 'Pragmatic', 'Optimistic', 'Cautious', 'Assertive', 'Collaborative']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `agent-${i}`,
    name: `Agent ${i + 1}`,
    role: roles[i % roles.length],
    personality: personalities[i % personalities.length],
    bio: `A ${roles[i % roles.length].toLowerCase()} with expertise in strategic decision making.`,
    stance: i % 5 === 0 ? 'strongly_for' : i % 5 === 1 ? 'moderately_for' : i % 5 === 2 ? 'neutral' : i % 5 === 3 ? 'moderately_against' : 'strongly_against',
    communicationStyle: 'professional and balanced',
    expertise: ['Strategy', 'Analysis'],
    motivations: 'Professional growth and organizational success',
    x: 100 + Math.random() * 700,
    y: 100 + Math.random() * 500,
    connections: [],
    state: 'idle',
    sentiment: (Math.random() - 0.5) * 1.5,
    influence: 0.3 + Math.random() * 0.5,
    memory: {
      postsSeen: [],
      interactions: [],
      sentimentHistory: [{ round: 0, sentiment: (Math.random() - 0.5) * 1.5 }]
    }
  }))
}

/**
 * Run a single simulation round with rich interactions
 */
async function runSimulationRound(
  state: SimulationState,
  config: SimulationConfig,
  round: number
): Promise<SimulationRound> {
  const actions: AgentAction[] = []
  const sentimentChanges: SimulationRound['sentimentChanges'] = []
  const newConnections: { from: string; to: string }[] = []

  // Get recent posts for context (last 15 posts)
  const recentPosts = state.posts.slice(-15)
  
  // Calculate current conversation topics
  const topics = extractTopics(state.posts.slice(-30))

  // Shuffle agents for turn order (randomizes who acts first)
  const shuffledAgents = [...state.agents].sort(() => Math.random() - 0.5)

  // Each agent takes a turn
  for (const agent of shuffledAgents) {
    // Skip some agents naturally (not everyone posts every round)
    if (Math.random() < 0.35) continue

    // Get posts this agent hasn't seen
    const unseenPosts = recentPosts.filter(p => 
      p.agentId !== agent.id && 
      !agent.memory?.postsSeen.includes(p.id)
    )

    // Decide and execute action
    const action = await decideAgentAction(agent, state, unseenPosts, config, round, topics)
    
    if (action.action !== 'DO_NOTHING') {
      actions.push(action)
      
      // Execute the action
      if (action.action === 'CREATE_POST') {
        const post = await createAgentPost(agent, action, state, config, round)
        if (post) {
          state.posts.push(post)
          agent.state = 'active'
          
          // Mark post as seen by all agents
          state.agents.forEach(a => {
            if (a.id !== agent.id && a.memory) {
              a.memory.postsSeen.push(post.id)
            }
          })
          
          // Check for viral potential
          if (post.engagement > 5) {
            state.events.push({
              id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
              type: 'post_viral',
              description: `${agent.name}'s post is gaining traction: "${post.content.substring(0, 50)}..."`,
              agentsInvolved: [agent.id],
              impact: Math.min(1, post.engagement / 10),
              round,
              relatedPostId: post.id
            })
          }
        }
      }
      else if (action.action === 'LIKE_POST' && action.targetPostId) {
        const post = state.posts.find(p => p.id === action.targetPostId)
        if (post && !post.likes.includes(agent.id)) {
          post.likes.push(agent.id)
          post.engagement += 1
          
          // Update opinion of post author
          updateAgentOpinion(state, agent.id, post.agentId, 0.1)
          
          // Small sentiment shift for liker
          const oldSentiment = agent.sentiment
          agent.sentiment = Math.min(1, agent.sentiment + 0.03)
          sentimentChanges.push({
            agentId: agent.id,
            oldSentiment,
            newSentiment: agent.sentiment,
            reason: `Engaged with ${post.agentName}'s content`
          })
          
          agent.memory?.interactions.push({
            withAgentId: post.agentId,
            type: 'like',
            round,
            sentimentImpact: 0.03
          })
        }
      }
      else if (action.action === 'COMMENT' && action.targetPostId && action.content) {
        const post = state.posts.find(p => p.id === action.targetPostId)
        if (post) {
          const comment: SimulationComment = {
            id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            agentId: agent.id,
            agentName: agent.name,
            content: action.content,
            timestamp: new Date(),
            likes: []
          }
          post.comments.push(comment)
          post.engagement += 2
          agent.state = 'interacting'
          
          // Update opinion based on comment sentiment
          const commentSentiment = analyzeSentiment(action.content)
          updateAgentOpinion(state, agent.id, post.agentId, commentSentiment * 0.15)
          
          // Target agent's sentiment shifts based on comment
          const targetAgent = state.agents.find(a => a.id === post.agentId)
          if (targetAgent && targetAgent.id !== agent.id) {
            const oldSentiment = targetAgent.sentiment
            const impact = commentSentiment * 0.08 * agent.influence
            targetAgent.sentiment = Math.max(-1, Math.min(1, targetAgent.sentiment + impact))
            sentimentChanges.push({
              agentId: targetAgent.id,
              oldSentiment,
              newSentiment: targetAgent.sentiment,
              reason: `Received ${commentSentiment > 0 ? 'positive' : 'critical'} feedback from ${agent.name}`
            })
          }
        }
      }
      else if (action.action === 'FOLLOW' && action.targetAgentId) {
        if (!agent.connections.includes(action.targetAgentId)) {
          agent.connections.push(action.targetAgentId)
          newConnections.push({ from: agent.id, to: action.targetAgentId })
          
          // Mutual connection chance based on opinion
          const opinion = state.agentOpinions.get(action.targetAgentId)?.get(agent.id) || 0
          if (opinion > 0 || Math.random() > 0.6) {
            const targetAgent = state.agents.find(a => a.id === action.targetAgentId)
            if (targetAgent && !targetAgent.connections.includes(agent.id)) {
              targetAgent.connections.push(agent.id)
            }
          }
        }
      }
    }
    
    // Update sentiment history periodically
    if (agent.memory && round % 3 === 0) {
      agent.memory.sentimentHistory.push({ round, sentiment: agent.sentiment })
    }
  }

  return {
    round,
    timestamp: new Date(),
    actions,
    sentimentChanges,
    newConnections
  }
}

/**
 * Have an AI agent decide what action to take with rich context
 */
async function decideAgentAction(
  agent: SimulationAgent,
  state: SimulationState,
  unseenPosts: SimulationPost[],
  config: SimulationConfig,
  round: number,
  topics: string[]
): Promise<AgentAction> {
  
  // Natural pacing - higher chance to observe
  const activityLevel = agent.influence > 0.6 ? 0.7 : 0.5
  if (Math.random() > activityLevel) {
    return {
      agentId: agent.id,
      action: 'DO_NOTHING',
      round,
      reason: 'Observing the conversation'
    }
  }

  // Get agents this agent has opinions about
  const myOpinions = state.agentOpinions.get(agent.id) || new Map()
  
  // Get posts from agents I follow/respect
  const followedPosts = unseenPosts.filter(p => 
    agent.connections.includes(p.agentId) || (myOpinions.get(p.agentId) || 0) > 0.2
  )

  const prompt = `You are ${agent.name}, a ${agent.role}.

YOUR PROFILE:
- Personality: ${agent.personality}
- Communication style: ${agent.communicationStyle}
- Bio: ${agent.bio}
- Current sentiment: ${agent.sentiment.toFixed(2)} (-1=very negative, +1=very positive)
- Influence level: ${agent.influence.toFixed(2)}
- Stance: ${agent.stance}

SCENARIO CONTEXT:
Title: ${config.scenarioTitle}
Description: ${config.scenarioDescription}
Current topics being discussed: ${topics.slice(0, 5).join(', ') || 'General discussion'}

RECENT POSTS YOU CAN SEE:
${unseenPosts.slice(-5).map(p => {
  const opinion = myOpinions.get(p.agentId) || 0
  const opinionStr = opinion > 0.3 ? ' (you respect this person)' : opinion < -0.3 ? ' (you disagree with this person)' : ''
  return `- ${p.agentName}: "${p.content.substring(0, 120)}..." [sentiment: ${p.sentiment > 0 ? 'positive' : p.sentiment < 0 ? 'negative' : 'neutral'}]${opinionStr}`
}).join('\n') || '(No new posts to see)'}

YOUR RECENT ACTIVITY:
${agent.memory?.interactions.slice(-3).map(i => {
  const other = state.agents.find(a => a.id === i.withAgentId)
  return `- ${i.type}d ${other?.name}'s content (round ${i.round})`
}).join('\n') || '(No recent activity)'}

DECISION TIME:
Based on your personality, stance (${agent.stance}), and the conversation context, decide your next action.

Return ONLY valid JSON:
{
  "action": "CREATE_POST" | "LIKE_POST" | "COMMENT" | "FOLLOW" | "DO_NOTHING",
  "targetPostId": "string or null - ID of post to like/comment on",
  "targetAgentId": "string or null - ID of agent to follow",
  "content": "string - if CREATE_POST: write 1-3 sentences as yourself; if COMMENT: write 1 sentence response",
  "reason": "brief explanation of why you're taking this action"
}

For CREATE_POST: Express your genuine view on the scenario. Write in your voice.
For COMMENT: React to a specific post above - agree, disagree, or add perspective.
For LIKE_POST: target a post you genuinely agree with.
For FOLLOW: target an agent whose views align with yours or who posted insightful content.`

  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: `You are ${agent.name}. Stay in character. Be authentic to your personality and stance.` },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 400,
      }),
    })

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No content from Kimi AI')
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : content
    let decision
    try {
      decision = JSON.parse(jsonStr)
    } catch {
      // Fallback if JSON parsing fails
      return generateFallbackAction(agent, unseenPosts, round)
    }

    // Validate action
    const validActions = ['CREATE_POST', 'LIKE_POST', 'COMMENT', 'FOLLOW', 'DO_NOTHING']
    if (!validActions.includes(decision.action)) {
      decision.action = 'DO_NOTHING'
    }

    return {
      agentId: agent.id,
      action: decision.action,
      targetPostId: decision.targetPostId,
      targetAgentId: decision.targetAgentId,
      content: decision.content,
      round,
      reason: decision.reason || 'Decided based on context'
    }

  } catch (error) {
    console.error(`Error deciding action for ${agent.name}:`, error)
    return generateFallbackAction(agent, unseenPosts, round)
  }
}

/**
 * Generate fallback action if API fails
 */
function generateFallbackAction(
  agent: SimulationAgent,
  unseenPosts: SimulationPost[],
  round: number
): AgentAction {
  const actions: AgentAction['action'][] = ['CREATE_POST', 'LIKE_POST', 'COMMENT', 'DO_NOTHING', 'DO_NOTHING']
  const action = actions[Math.floor(Math.random() * actions.length)]
  
  if (action === 'CREATE_POST') {
    const templates = agent.sentiment > 0.2 ? POST_TEMPLATES.support : 
                      agent.sentiment < -0.2 ? POST_TEMPLATES.oppose : 
                      POST_TEMPLATES.neutral
    const template = templates[Math.floor(Math.random() * templates.length)]
    return {
      agentId: agent.id,
      action: 'CREATE_POST',
      content: template.replace('{topic}', 'this topic'),
      round,
      reason: 'Fallback content generation'
    }
  }
  
  if (action === 'LIKE_POST' && unseenPosts.length > 0) {
    const post = unseenPosts[Math.floor(Math.random() * unseenPosts.length)]
    return {
      agentId: agent.id,
      action: 'LIKE_POST',
      targetPostId: post.id,
      round,
      reason: 'Engaging with relevant content'
    }
  }
  
  if (action === 'COMMENT' && unseenPosts.length > 0) {
    const post = unseenPosts[Math.floor(Math.random() * unseenPosts.length)]
    const templates = agent.sentiment > 0 ? COMMENT_TEMPLATES.agree : COMMENT_TEMPLATES.disagree
    const template = templates[Math.floor(Math.random() * templates.length)]
    return {
      agentId: agent.id,
      action: 'COMMENT',
      targetPostId: post.id,
      content: template,
      round,
      reason: 'Responding to discussion'
    }
  }
  
  return {
    agentId: agent.id,
    action: 'DO_NOTHING',
    round,
    reason: 'Observing'
  }
}

/**
 * Create a post from an agent with rich content
 */
async function createAgentPost(
  agent: SimulationAgent,
  action: AgentAction,
  state: SimulationState,
  config: SimulationConfig,
  round: number
): Promise<SimulationPost | null> {
  
  let content = action.content
  
  // If no content provided, generate fallback
  if (!content || content.length < 10) {
    const templates = agent.sentiment > 0.3 ? POST_TEMPLATES.support : 
                      agent.sentiment < -0.3 ? POST_TEMPLATES.oppose : 
                      POST_TEMPLATES.question
    content = templates[Math.floor(Math.random() * templates.length)]
  }
  
  // Calculate engagement based on agent influence and content quality
  const baseEngagement = agent.influence * 3
  const randomFactor = Math.random() * 2
  const engagement = baseEngagement + randomFactor
  
  return {
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    agentId: agent.id,
    agentName: agent.name,
    agentRole: agent.role,
    content,
    timestamp: new Date(),
    round,
    platform: Math.random() > 0.5 ? 'twitter' : 'reddit',
    likes: [],
    comments: [],
    sentiment: analyzeSentiment(content),
    engagement
  }
}

/**
 * Extract trending topics from recent posts
 */
function extractTopics(posts: SimulationPost[]): string[] {
  const allContent = posts.map(p => p.content).join(' ')
  const words = allContent.toLowerCase().split(/\s+/)
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'this', 'that', 'these', 'those'])
  
  const wordFreq = new Map<string, number>()
  words.forEach(word => {
    if (word.length > 4 && !stopWords.has(word) && !word.match(/^\d/)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    }
  })
  
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}

/**
 * Update trending topics in state
 */
function updateTrendingTopics(state: SimulationState) {
  state.trendingTopics = extractTopics(state.posts.slice(-50))
}

/**
 * Update agent's opinion of another agent
 */
function updateAgentOpinion(
  state: SimulationState,
  agentId: string,
  targetAgentId: string,
  delta: number
) {
  const opinions = state.agentOpinions.get(agentId)
  if (opinions) {
    const currentOpinion = opinions.get(targetAgentId) || 0
    opinions.set(targetAgentId, Math.max(-1, Math.min(1, currentOpinion + delta)))
  }
}

/**
 * Enhanced sentiment analysis
 */
function analyzeSentiment(text: string): number {
  const positive = ['good', 'great', 'excellent', 'agree', 'support', 'positive', 'benefit', 'success', 'improve', 'best', 'love', 'perfect', 'yes', 'absolutely', 'transform', 'potential', 'opportunity', 'growth', 'innovation', 'progress', 'advantage', 'effective', 'efficient', 'optimized', 'solution', 'breakthrough', 'excited', 'optimistic', 'confident', 'promising', 'valuable', 'important', 'crucial', 'essential', 'key', 'critical']
  const negative = ['bad', 'terrible', 'disagree', 'oppose', 'negative', 'problem', 'fail', 'worse', 'worst', 'hate', 'wrong', 'no', 'never', 'concern', 'risk', 'danger', 'threat', 'issue', 'challenge', 'difficult', 'impossible', 'unrealistic', 'flawed', 'limited', 'restrict', 'prevent', 'avoid', 'stop', 'against', 'skeptical', 'doubt', 'worried', 'alarming', 'serious', 'significant', 'substantial', 'major']
  
  const words = text.toLowerCase().split(/\s+/)
  let score = 0
  
  words.forEach(word => {
    if (positive.some(p => word.includes(p))) score += 0.15
    if (negative.some(n => word.includes(n))) score -= 0.15
  })
  
  return Math.max(-1, Math.min(1, score))
}

/**
 * Generate events from round activity with richer descriptions
 */
function generateEventsFromRound(
  round: SimulationRound,
  state: SimulationState,
  roundNum: number
): SimulationEvent[] {
  const events: SimulationEvent[] = []
  
  // Event: Significant sentiment shift
  const significantShifts = round.sentimentChanges.filter(
    change => Math.abs(change.newSentiment - change.oldSentiment) > 0.12
  )
  
  significantShifts.forEach(shift => {
    const agent = state.agents.find(a => a.id === shift.agentId)
    const direction = shift.newSentiment > shift.oldSentiment ? 'more positive' : 'more negative'
    events.push({
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'sentiment_shift',
      description: `${agent?.name} shifted ${direction} on the topic: ${shift.reason}`,
      agentsInvolved: [shift.agentId],
      impact: Math.abs(shift.newSentiment - shift.oldSentiment),
      round: roundNum
    })
  })
  
  // Event: New connections formed
  if (round.newConnections.length > 0) {
    round.newConnections.forEach(connection => {
      const fromAgent = state.agents.find(a => a.id === connection.from)
      const toAgent = state.agents.find(a => a.id === connection.to)
      events.push({
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'interaction',
        description: `${fromAgent?.name} started following ${toAgent?.name}'s updates`,
        agentsInvolved: [connection.from, connection.to],
        impact: 0.3,
        round: roundNum
      })
    })
  }
  
  // Event: High activity (emergence)
  if (round.actions.length > Math.max(3, state.agents.length * 0.2)) {
    events.push({
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'emergence',
      description: `High engagement: ${round.actions.length} interactions in round ${roundNum}`,
      agentsInvolved: round.actions.slice(0, 5).map(a => a.agentId),
      impact: 0.5,
      round: roundNum
    })
  }
  
  // Event: Polarization detection
  const positiveAgents = state.agents.filter(a => a.sentiment > 0.4).length
  const negativeAgents = state.agents.filter(a => a.sentiment < -0.4).length
  const neutralAgents = state.agents.length - positiveAgents - negativeAgents
  
  if (positiveAgents > state.agents.length * 0.4 && negativeAgents > state.agents.length * 0.4 && neutralAgents < state.agents.length * 0.2) {
    events.push({
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'conflict',
      description: `Polarization detected: Community splitting into opposing camps`,
      agentsInvolved: state.agents.filter(a => Math.abs(a.sentiment) > 0.4).slice(0, 5).map(a => a.id),
      impact: 0.8,
      round: roundNum
    })
  }
  
  // Event: Consensus forming
  const avgSentiment = state.agents.reduce((acc, a) => acc + a.sentiment, 0) / state.agents.length
  if (Math.abs(avgSentiment) > 0.25 && roundNum > 3) {
    const alignedAgents = state.agents.filter(a => 
      (avgSentiment > 0 && a.sentiment > 0.1) || (avgSentiment < 0 && a.sentiment < -0.1)
    )
    if (alignedAgents.length > state.agents.length * 0.65) {
      events.push({
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'consensus',
        description: `Consensus emerging: ${alignedAgents.length} agents aligning ${avgSentiment > 0 ? 'positively' : 'negatively'}`,
        agentsInvolved: alignedAgents.slice(0, 5).map(a => a.id),
        impact: 0.7,
        round: roundNum
      })
    }
  }
  
  // Event: Influencer activity
  const influencerActions = round.actions.filter(a => {
    const agent = state.agents.find(ag => ag.id === a.agentId)
    return agent && agent.influence > 0.7
  })
  
  if (influencerActions.length >= 2) {
    const influencers = influencerActions.slice(0, 2).map(a => state.agents.find(ag => ag.id === a.agentId)?.name).join(' and ')
    events.push({
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'milestone',
      description: `Key influencers active: ${influencers} driving the conversation`,
      agentsInvolved: influencerActions.map(a => a.agentId),
      impact: 0.6,
      round: roundNum
    })
  }
  
  return events
}

/**
 * Generate comprehensive final analysis
 */
async function generateAnalysis(
  state: SimulationState,
  config: SimulationConfig
): Promise<{ summary: string; predictions: string[] }> {
  const avgSentiment = state.agents.reduce((acc, a) => acc + a.sentiment, 0) / state.agents.length
  const positiveAgents = state.agents.filter(a => a.sentiment > 0.3).length
  const negativeAgents = state.agents.filter(a => a.sentiment < -0.3).length
  const neutralAgents = state.agents.filter(a => Math.abs(a.sentiment) <= 0.3).length
  
  // Calculate sentiment distribution
  const sentimentDistribution = {
    stronglyPositive: state.agents.filter(a => a.sentiment > 0.6).length,
    moderatelyPositive: state.agents.filter(a => a.sentiment > 0.3 && a.sentiment <= 0.6).length,
    neutral: state.agents.filter(a => Math.abs(a.sentiment) <= 0.3).length,
    moderatelyNegative: state.agents.filter(a => a.sentiment < -0.3 && a.sentiment >= -0.6).length,
    stronglyNegative: state.agents.filter(a => a.sentiment < -0.6).length
  }

  const topInfluencers = [...state.agents]
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 5)

  const topPosts = [...state.posts]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5)
    
  const conflictEvents = state.events.filter(e => e.type === 'conflict').length
  const consensusEvents = state.events.filter(e => e.type === 'consensus').length

  const prompt = `Analyze this multi-agent social simulation about: "${config.scenarioTitle}"

SCENARIO DESCRIPTION:
${config.scenarioDescription}

SIMULATION RESULTS:
- Duration: ${state.currentRound} rounds
- Total Posts: ${state.posts.length}
- Total Comments: ${state.posts.reduce((acc, p) => acc + p.comments.length, 0)}
- Total Events: ${state.events.length}

FINAL SENTIMENT DISTRIBUTION:
- Strongly Positive: ${sentimentDistribution.stronglyPositive} agents
- Moderately Positive: ${sentimentDistribution.moderatelyPositive} agents
- Neutral: ${sentimentDistribution.neutral} agents
- Moderately Negative: ${sentimentDistribution.moderatelyNegative} agents
- Strongly Negative: ${sentimentDistribution.stronglyNegative} agents
- Average Sentiment: ${avgSentiment.toFixed(2)}

KEY INFLUENCERS:
${topInfluencers.map(a => `- ${a.name} (${a.role}): ${a.stance}, final sentiment ${a.sentiment.toFixed(2)}, influence ${a.influence.toFixed(2)}`).join('\n')}

MOST ENGAGING POSTS:
${topPosts.map(p => `- ${p.agentName}: "${p.content.substring(0, 100)}..." (${p.likes.length} likes, ${p.comments.length} comments)`).join('\n')}

SOCIAL DYNAMICS:
- Conflict Events: ${conflictEvents}
- Consensus Events: ${consensusEvents}
- Total Connections Formed: ${state.rounds.reduce((acc, r) => acc + r.newConnections.length, 0)}
- Trending Topics: ${state.trendingTopics.slice(0, 3).join(', ')}

Provide a strategic analysis:
1. Executive Summary (2-3 sentences): What happened in this simulation? What does it reveal about how different stakeholders would react to this scenario?
2. Four Specific Predictions: Based on the agent behaviors and sentiment shifts, what would likely happen if this scenario played out in reality?

Return ONLY valid JSON:
{
  "summary": "string - executive summary",
  "predictions": ["string - prediction 1", "string - prediction 2", "string - prediction 3", "string - prediction 4"]
}`

  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: 'You are a strategic analyst interpreting multi-agent social simulation results. Provide actionable insights.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1200,
      }),
    })

    if (!response.ok) {
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
      summary: analysis.summary || generateFallbackSummary(state, avgSentiment, positiveAgents, negativeAgents),
      predictions: analysis.predictions || generateFallbackPredictions(state, avgSentiment, topInfluencers)
    }

  } catch (error) {
    console.error('Error generating analysis:', error)
    
    return {
      summary: generateFallbackSummary(state, avgSentiment, positiveAgents, negativeAgents),
      predictions: generateFallbackPredictions(state, avgSentiment, topInfluencers)
    }
  }
}

/**
 * Generate fallback summary if API fails
 */
function generateFallbackSummary(
  state: SimulationState,
  avgSentiment: number,
  positiveAgents: number,
  negativeAgents: number
): string {
  const totalConnections = state.rounds.reduce((acc, r) => acc + r.newConnections.length, 0)
  const dominantView = positiveAgents > negativeAgents ? 'positive' : 'negative'
  const sentimentStrength = Math.abs(avgSentiment) > 0.4 ? 'strong' : Math.abs(avgSentiment) > 0.2 ? 'moderate' : 'weak'
  
  return `The simulation with ${state.agents.length} agents over ${state.currentRound} rounds revealed ${sentimentStrength} ${dominantView} sentiment (${avgSentiment.toFixed(2)} average). ${positiveAgents > negativeAgents ? 'Supporters' : 'Opponents'} formed a larger coalition, with ${totalConnections} professional connections established during the discourse. The community generated ${state.posts.length} posts and ${state.posts.reduce((acc, p) => acc + p.comments.length, 0)} comments, showing ${state.posts.length > 20 ? 'high' : 'moderate'} engagement levels.`
}

/**
 * Generate fallback predictions if API fails
 */
function generateFallbackPredictions(
  state: SimulationState,
  avgSentiment: number,
  topInfluencers: SimulationAgent[]
): string[] {
  const conflictEvents = state.events.filter(e => e.type === 'conflict').length
  const consensusEvents = state.events.filter(e => e.type === 'consensus').length
  
  return [
    `If current trends continue, ${avgSentiment > 0 ? 'support will consolidate' : 'opposition will strengthen'} over the next quarter.`,
    `${topInfluencers[0]?.name} and other high-influence agents will likely drive the dominant narrative.`,
    `${conflictEvents > consensusEvents ? 'Continued polarization' : 'Gradual consensus building'} expected based on interaction patterns.`,
    `External announcements or market conditions could significantly shift the current ${Math.abs(avgSentiment) > 0.3 ? 'established' : 'fluid'} sentiment.`
  ]
}
