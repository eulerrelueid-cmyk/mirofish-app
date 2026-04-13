export interface SimulationAgent {
  id: string
  name: string
  role: string
  personality: string
  bio: string
  stance: 'strongly_for' | 'moderately_for' | 'neutral' | 'moderately_against' | 'strongly_against'
  communicationStyle: string
  expertise: string[]
  motivations: string
  x: number
  y: number
  connections: string[]
  state: 'idle' | 'active' | 'interacting'
  sentiment: number // -1 to 1
  influence: number // 0 to 1
  avatar?: string
  memory?: AgentMemory
}

export interface AgentMemory {
  postsSeen: string[] // post IDs
  interactions: AgentInteraction[]
  sentimentHistory: { round: number; sentiment: number }[]
}

export interface AgentInteraction {
  withAgentId: string
  type: 'like' | 'comment' | 'follow' | 'oppose'
  round: number
  sentimentImpact: number
}

export interface AgentProfile {
  name: string
  role: string
  personality: string
  bio: string
  stance: string
  communicationStyle: string
  expertise: string[]
  motivations: string
  sentiment: number
  influence: number
}

export interface SimulationPost {
  id: string
  agentId: string
  agentName: string
  agentRole: string
  content: string
  timestamp: Date
  round: number
  platform: 'twitter' | 'reddit'
  likes: string[] // agent IDs who liked
  comments: SimulationComment[]
  sentiment: number // sentiment of the post itself
  engagement: number // calculated engagement score
}

export interface SimulationComment {
  id: string
  agentId: string
  agentName: string
  content: string
  timestamp: Date
  likes: string[]
}

export interface SimulationEvent {
  id: string
  timestamp: Date
  type: 'interaction' | 'sentiment_shift' | 'emergence' | 'milestone' | 'post_viral' | 'consensus' | 'conflict'
  description: string
  agentsInvolved: string[]
  impact: number
  round: number
  relatedPostId?: string
}

export interface SimulationRound {
  round: number
  timestamp: Date
  actions: AgentAction[]
  sentimentChanges: { agentId: string; oldSentiment: number; newSentiment: number; reason: string }[]
  newConnections: { from: string; to: string }[]
}

export interface AgentAction {
  agentId: string
  action: 'CREATE_POST' | 'LIKE_POST' | 'COMMENT' | 'FOLLOW' | 'DO_NOTHING'
  targetPostId?: string
  targetAgentId?: string
  content?: string
  round: number
  reason: string
}

export interface SimulationScenario {
  id: string
  title: string
  description: string
  seedText?: string
  uploadedFile?: {
    name: string
    type: string
    url: string
  }
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
  parameters: {
    agentCount: number
    simulationRounds: number
    temperature: number
  }
  results?: {
    agents: SimulationAgent[]
    events: SimulationEvent[]
    posts: SimulationPost[]
    rounds: SimulationRound[]
    summary: string
    predictions: string[]
  }
}

export interface SimulationStats {
  totalAgents: number
  activeInteractions: number
  avgSentiment: number
  convergenceRate: number
  predictionConfidence: number
  totalPosts: number
  totalComments: number
  viralPosts: number
  positiveAgents: number
  negativeAgents: number
  neutralAgents: number
  connectionsFormed: number
}

export interface SocialFeedItem {
  id: string
  type: 'post' | 'event'
  timestamp: Date
  data: SimulationPost | SimulationEvent
}
