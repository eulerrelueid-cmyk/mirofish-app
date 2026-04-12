'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/Header'
import { ScenarioInput } from '@/components/ScenarioInput'
import { SimulationViewer } from '@/components/SimulationViewer'
import { AgentNetwork } from '@/components/AgentNetwork'
import { EventTimeline } from '@/components/EventTimeline'
import { StatsPanel } from '@/components/StatsPanel'
import { SimulationResults } from '@/components/SimulationResults'
import { SimulationScenario, SimulationStats } from '@/types/simulation'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleScenarioSubmit = useCallback(async (
    title: string, 
    description: string, 
    seedText?: string,
    file?: File
  ) => {
    setIsSimulating(true)
    
    // Create new scenario
    const scenario: SimulationScenario = {
      id: uuidv4(),
      title,
      description,
      seedText,
      status: 'running',
      createdAt: new Date(),
      updatedAt: new Date(),
      parameters: {
        agentCount: 50,
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

    // Simulate API call to MiroFish backend
    setTimeout(() => {
      const mockResults = generateMockResults(scenario)
      setCurrentScenario({
        ...scenario,
        status: 'completed',
        results: mockResults,
        updatedAt: new Date(),
      })
      setIsSimulating(false)
    }, 3000)
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
            and watch thousands of AI agents simulate the future.
          </p>
        </div>

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
              Enter a scenario above to start your first prediction
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
  
  const agents = Array.from({ length: 50 }, (_, i) => ({
    id: `agent-${i}`,
    name: `Agent ${i + 1}`,
    role: ['Influencer', 'Observer', 'Critic', 'Supporter', 'Analyst'][Math.floor(Math.random() * 5)],
    personality: ['Optimistic', 'Pessimistic', 'Neutral', 'Aggressive', 'Cautious'][Math.floor(Math.random() * 5)],
    x: Math.random() * 800,
    y: Math.random() * 600,
    connections: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => 
      `agent-${Math.floor(Math.random() * 50)}`
    ),
    state: states[Math.floor(Math.random() * 3)],
    sentiment: (Math.random() * 2 - 1),
    influence: Math.random(),
  }))

  const events = Array.from({ length: 20 }, (_, i) => ({
    id: `event-${i}`,
    timestamp: new Date(Date.now() - (20 - i) * 60000),
    type: eventTypes[Math.floor(Math.random() * 4)],
    description: [
      'Agent cluster formed around topic',
      'Sentiment shift detected in sector A',
      'Emergent behavior observed',
      'Consensus reached on key issue',
      'New connection established',
    ][Math.floor(Math.random() * 5)],
    agentsInvolved: [`agent-${Math.floor(Math.random() * 50)}`, `agent-${Math.floor(Math.random() * 50)}`],
    impact: Math.random(),
  }))

  return {
    agents,
    events,
    summary: `Simulation of "${scenario.title}" completed with ${agents.length} agents over 100 rounds. Key findings: sentiment converged toward positive territory with 78% agreement on core predictions.`,
    predictions: [
      '65% probability of positive outcome within 30 days',
      'Strong consensus forming around alternative approach B',
      'Early adopters likely to drive mainstream adoption by Q3',
      'Risk factors remain concentrated in regulatory uncertainty',
    ],
  }
}
