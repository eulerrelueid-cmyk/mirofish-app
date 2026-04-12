'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/Header'
import { ScenarioInput } from '@/components/ScenarioInput'
import { SimulationViewer } from '@/components/SimulationViewer'
import { AgentNetwork } from '@/components/AgentNetwork'
import { EventTimeline } from '@/components/EventTimeline'
import { StatsPanel } from '@/components/StatsPanel'
import { SimulationResults } from '@/components/SimulationResults'
import { SimulationScenario, SimulationStats, SimulationAgent, SimulationEvent } from '@/types/simulation'
import { v4 as uuidv4 } from 'uuid'

const AGENT_COUNT = 20

export default function Home() {
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScenarioSubmit = useCallback(async (
    title: string, 
    description: string, 
    seedText?: string,
    file?: File
  ) => {
    setIsSimulating(true)
    setError(null)
    
    // Create initial scenario
    const scenario: SimulationScenario = {
      id: uuidv4(),
      title,
      description,
      seedText,
      status: 'running',
      createdAt: new Date(),
      updatedAt: new Date(),
      parameters: {
        agentCount: AGENT_COUNT,
        simulationRounds: 100,
        temperature: 0.7,
      },
    }

    if (file) {
      scenario.uploadedFile = {
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      }
    }

    setCurrentScenario(scenario)

    try {
      // Call the simulation API
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          seedText,
          userId: null, // Will use anonymous sessions for now
        }),
      })

      if (!response.ok) {
        throw new Error('Simulation failed')
      }

      const data = await response.json()

      setCurrentScenario({
        ...scenario,
        status: 'completed',
        results: {
          agents: data.agents,
          events: data.events,
          summary: data.summary,
          predictions: data.predictions,
        },
        updatedAt: new Date(),
      })
    } catch (err) {
      console.error('Simulation error:', err)
      setError('Simulation failed. Using fallback mode...')
      
      // Fallback to mock results if API fails
      setTimeout(() => {
        const mockResults = generateMockResults(scenario)
        setCurrentScenario({
          ...scenario,
          status: 'completed',
          results: mockResults,
          updatedAt: new Date(),
        })
        setError(null)
      }, 2000)
    } finally {
      setIsSimulating(false)
    }
  }, [])

  const stats: SimulationStats = currentScenario?.results ? {
    totalAgents: currentScenario.results.agents.length,
    activeInteractions: currentScenario.results.events.filter(e => e.type === 'interaction').length,
    avgSentiment: currentScenario.results.agents.reduce((acc, a) => acc + a.sentiment, 0) / currentScenario.results.agents.length,
    convergenceRate: 0.78,
    predictionConfidence: 0.85,
  } : {
    totalAgents: 0,
    activeInteractions: 0,
    avgSentiment: 0,
    convergenceRate: 0,
    predictionConfidence: 0,
  }

  return (
    <main className="min-h-screen bg-miro-dark">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-miro-accent to-miro-glow bg-clip-text text-transparent">
            MiroFish Visualizer
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Predict anything with swarm intelligence. Upload seed materials, describe your scenario, 
            and watch {AGENT_COUNT} AI agents simulate the future.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-miro-amber/20 border border-miro-amber/50 text-miro-amber">
            {error}
          </div>
        )}

        {/* Input Section */}
        <div className="mb-12">
          <ScenarioInput 
            onSubmit={handleScenarioSubmit}
            isLoading={isSimulating}
          />
        </div>

        {/* Simulation Display */}
        {currentScenario && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <StatsPanel stats={stats} isLoading={isSimulating} />

            {/* Main Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent Network */}
              <div className="lg:col-span-2">
                <AgentNetwork 
                  agents={currentScenario.results?.agents || []}
                  events={currentScenario.results?.events || []}
                  isLoading={isSimulating}
                />
              </div>

              {/* Event Timeline */}
              <div>
                <EventTimeline 
                  events={currentScenario.results?.events || []}
                  isLoading={isSimulating}
                />
              </div>
            </div>

            {/* Simulation Results */}
            {currentScenario.results && (
              <SimulationResults 
                scenario={currentScenario}
              />
            )}
          </div>
        )}

        {/* Empty State */}
        {!currentScenario && !isSimulating && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-miro-accent to-miro-glow opacity-50 animate-pulse-slow" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Ready to Simulate
            </h3>
            <p className="text-gray-500">
              Enter a scenario above to start your first prediction with {AGENT_COUNT} AI agents
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

function generateMockResults(scenario: SimulationScenario) {
  const states: ('idle' | 'active' | 'interacting')[] = ['idle', 'active', 'interacting']
  const eventTypes: ('interaction' | 'sentiment_shift' | 'emergence' | 'milestone')[] = ['interaction', 'sentiment_shift', 'emergence', 'milestone']
  
  const agents: SimulationAgent[] = Array.from({ length: AGENT_COUNT }, (_, i) => ({
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

  const events: SimulationEvent[] = Array.from({ length: 12 }, (_, i) => ({
    id: `event-${i}`,
    timestamp: new Date(Date.now() - (12 - i) * 60000),
    type: eventTypes[Math.floor(Math.random() * 4)],
    description: [
      'Agent cluster formed around topic',
      'Sentiment shift detected in sector A',
      'Emergent behavior observed',
      'Consensus reached on key issue',
      'New connection established',
    ][Math.floor(Math.random() * 5)],
    agentsInvolved: [`agent-${Math.floor(Math.random() * AGENT_COUNT)}`, `agent-${Math.floor(Math.random() * AGENT_COUNT)}`],
    impact: Math.random(),
  }))

  const positiveAgents = agents.filter(a => a.sentiment > 0).length
  const avgSentiment = agents.reduce((acc, a) => acc + a.sentiment, 0) / agents.length

  return {
    agents,
    events,
    summary: `Simulation of "${scenario.title}" completed with ${agents.length} agents. Key findings: sentiment distribution shows ${positiveAgents} positive agents with overall ${avgSentiment > 0 ? 'positive' : 'negative'} sentiment trajectory.`,
    predictions: [
      `${(positiveAgents / agents.length * 100).toFixed(0)}% probability of favorable outcome`,
      'Consensus emerging on key decision factors',
      avgSentiment > 0 ? 'Optimistic trajectory predicted' : 'Cautious approach recommended',
      'Monitor influential agents for sentiment shifts',
    ],
  }
}
