export interface SimulationAgent {
  id: string
  name: string
  role: string
  personality: string
  x: number
  y: number
  connections: string[]
  state: 'idle' | 'active' | 'interacting'
  sentiment: number // -1 to 1
  influence: number // 0 to 1
  avatar?: string
}

export interface SimulationEvent {
  id: string
  timestamp: Date
  type: 'interaction' | 'sentiment_shift' | 'emergence' | 'milestone'
  description: string
  agentsInvolved: string[]
  impact: number
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
}
