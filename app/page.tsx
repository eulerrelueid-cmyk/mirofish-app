'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/Header'
import { ScenarioInput } from '@/components/ScenarioInput'
import { AgentNetwork } from '@/components/AgentNetwork'
import { EventTimeline } from '@/components/EventTimeline'
import { StatsPanel } from '@/components/StatsPanel'
import { SimulationResults } from '@/components/SimulationResults'
import SocialFeed from '@/components/SocialFeed'
import { SimulationScenario, SimulationStats } from '@/types/simulation'
import { v4 as uuidv4 } from 'uuid'
import { MessageSquare, Users, Activity, TrendingUp } from 'lucide-react'

const AGENT_COUNT = 15
const SIMULATION_ROUNDS = 12

export default function Home() {
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'feed' | 'network' | 'events'>('feed')

  const handleScenarioSubmit = useCallback(async (
    title: string, 
    description: string, 
    seedText?: string,
    file?: File
  ) => {
    setIsSimulating(true)
    setError(null)
    
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
        simulationRounds: SIMULATION_ROUNDS,
        temperature: 0.8,
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
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, seedText, userId: null }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Simulation failed')

      setCurrentScenario({
        ...scenario,
        status: 'completed',
        mockMode: data.mockMode,
        results: {
          agents: data.agents,
          events: data.events,
          posts: data.posts,
          rounds: data.rounds,
          summary: data.summary,
          predictions: data.predictions,
        },
        updatedAt: new Date(),
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Simulation failed'
      setError(errorMessage)
      setCurrentScenario({ ...scenario, status: 'failed', updatedAt: new Date() })
    } finally {
      setIsSimulating(false)
    }
  }, [])

  const stats: SimulationStats = (() => {
    if (!currentScenario?.results) {
      return {
        totalAgents: 0, activeInteractions: 0, avgSentiment: 0,
        convergenceRate: 0, predictionConfidence: 0, totalPosts: 0,
        totalComments: 0, viralPosts: 0, positiveAgents: 0,
        negativeAgents: 0, neutralAgents: 0, connectionsFormed: 0,
      }
    }
    const { agents, posts, events, rounds } = currentScenario.results
    const totalComments = posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0)
    const connectionsFormed = rounds.reduce((acc, r) => acc + r.newConnections.length, 0)
    const avgSentiment = agents.reduce((acc, a) => acc + a.sentiment, 0) / agents.length
    return {
      totalAgents: agents.length,
      activeInteractions: events.filter(e => e.type === 'interaction').length,
      avgSentiment,
      convergenceRate: Math.max(0, 1 - agents.reduce((acc, a) => acc + Math.pow(a.sentiment - avgSentiment, 2), 0) / agents.length),
      predictionConfidence: 0.75 + (Math.max(0, 1 - agents.reduce((acc, a) => acc + Math.pow(a.sentiment - avgSentiment, 2), 0) / agents.length) * 0.2),
      totalPosts: posts.length, totalComments, viralPosts: posts.filter(p => p.engagement > 5).length,
      positiveAgents: agents.filter(a => a.sentiment > 0.3).length,
      negativeAgents: agents.filter(a => a.sentiment < -0.3).length,
      neutralAgents: agents.filter(a => Math.abs(a.sentiment) <= 0.3).length,
      connectionsFormed,
    }
  })()

  return (
    <main className="min-h-screen bg-miro-dark">
      <Header />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero Section - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-miro-accent to-miro-glow bg-clip-text text-transparent">
            MiroFish
          </h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-2">
            Multi-agent social simulation. Watch AI agents with distinct personas 
            discuss, debate, and form opinions on your scenarios.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm sm:text-base">
            <p className="font-semibold">Error: {error}</p>
            <p className="text-xs sm:text-sm mt-1">
              {error.toLowerCase().includes('kimi')
                ? 'Please check your Kimi API configuration and try again.'
                : error.toLowerCase().includes('database') || error.toLowerCase().includes('save')
                ? 'A database error occurred. Results may not be persisted.'
                : 'An unexpected error occurred. Please try again.'}
            </p>
          </div>
        )}

        {/* Mock Mode Notice */}
        {currentScenario?.mockMode && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 text-sm sm:text-base">
            <p className="font-semibold">⚡ Fast Mode Active</p>
            <p className="text-xs sm:text-sm mt-1">
              Running in template mode to stay within serverless limits. Set <code>USE_MOCK_SIMULATION=false</code> to enable full LLM generation (requires Pro deployment or background worker).
            </p>
          </div>
        )}

        {/* Input Section */}
        <div className="mb-6 sm:mb-12">
          <ScenarioInput onSubmit={handleScenarioSubmit} isLoading={isSimulating} />
        </div>

        {/* Loading State - Mobile Optimized */}
        {isSimulating && (
          <div className="glass-panel rounded-xl sm:rounded-2xl p-6 sm:p-12 glow-border text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full border-4 border-miro-accent/30 border-t-miro-accent animate-spin" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Running Multi-Agent Simulation</h3>
            <p className="text-gray-400 text-sm sm:text-base mb-4 px-2">
              {AGENT_COUNT} AI agents are discussing &quot;{currentScenario?.title}&quot;
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-8 text-xs sm:text-sm text-gray-500">
              <span className="flex items-center justify-center sm:justify-start gap-2">
                <Users className="w-4 h-4" /> Generating personas...
              </span>
              <span className="flex items-center justify-center sm:justify-start gap-2">
                <Activity className="w-4 h-4" /> Running {SIMULATION_ROUNDS} rounds...
              </span>
              <span className="flex items-center justify-center sm:justify-start gap-2">
                <TrendingUp className="w-4 h-4" /> Analyzing outcomes...
              </span>
            </div>
          </div>
        )}

        {/* Simulation Display */}
        {currentScenario?.status === 'completed' && currentScenario.results && (
          <div className="space-y-4 sm:space-y-6">
            <StatsPanel stats={stats} isLoading={isSimulating} />

            {/* Tab Navigation - Mobile Scrollable */}
            <div className="flex items-center gap-1 sm:gap-2 border-b border-white/10 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
              <button onClick={() => setActiveTab('feed')}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
                  activeTab === 'feed' ? 'border-miro-accent text-miro-accent' : 'border-transparent text-gray-400 hover:text-white'
                }`}>
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Feed</span>
                <span className="hidden sm:inline">({currentScenario.results.posts.length})</span>
              </button>
              <button onClick={() => setActiveTab('network')}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
                  activeTab === 'network' ? 'border-miro-accent text-miro-accent' : 'border-transparent text-gray-400 hover:text-white'
                }`}>
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Network</span>
                <span className="hidden sm:inline">({currentScenario.results.agents.length})</span>
              </button>
              <button onClick={() => setActiveTab('events')}
                className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap ${
                  activeTab === 'events' ? 'border-miro-accent text-miro-accent' : 'border-transparent text-gray-400 hover:text-white'
                }`}>
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Events</span>
                <span className="hidden sm:inline">({currentScenario.results.events.length})</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px] sm:min-h-[600px]">
              {activeTab === 'feed' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2">
                    <SocialFeed posts={currentScenario.results.posts} agents={currentScenario.results.agents} />
                  </div>
                  <div className="hidden lg:block">
                    <EventTimeline events={currentScenario.results.events} isLoading={isSimulating} />
                  </div>
                </div>
              )}

              {activeTab === 'network' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2">
                    <AgentNetwork agents={currentScenario.results.agents} events={currentScenario.results.events} isLoading={isSimulating} />
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="glass-panel rounded-xl p-3 sm:p-4">
                      <h3 className="font-semibold mb-3 text-sm sm:text-base">Agent Sentiment</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-400 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400" /> Positive
                          </span>
                          <span className="font-semibold">{stats.positiveAgents}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-400" /> Neutral
                          </span>
                          <span className="font-semibold">{stats.neutralAgents}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amber-400 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400" /> Negative
                          </span>
                          <span className="font-semibold">{stats.negativeAgents}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-400">Connections formed</span>
                          <span className="font-semibold">{stats.connectionsFormed}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="glass-panel rounded-xl p-3 sm:p-4">
                      <h3 className="font-semibold mb-3 text-sm sm:text-base">Top Influencers</h3>
                      <div className="space-y-2">
                        {[...currentScenario.results.agents].sort((a, b) => b.influence - a.influence).slice(0, 5).map((agent) => (
                          <div key={agent.id} className="flex items-center gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm font-semibold shrink-0">
                              {agent.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">{agent.name}</p>
                              <p className="text-xs text-gray-500 truncate">{agent.role}</p>
                            </div>
                            <div className="text-xs text-miro-accent shrink-0">{(agent.influence * 100).toFixed(0)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'events' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2">
                    <EventTimeline events={currentScenario.results.events} isLoading={isSimulating} />
                  </div>
                  <div>
                    <div className="glass-panel rounded-xl p-3 sm:p-4">
                      <h3 className="font-semibold mb-3 text-sm sm:text-base">Event Summary</h3>
                      <div className="space-y-2">
                        {['interaction', 'sentiment_shift', 'emergence', 'consensus', 'conflict', 'post_viral'].map(type => {
                          const count = currentScenario.results?.events.filter(e => e.type === type).length || 0
                          if (count === 0) return null
                          return (
                            <div key={type} className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-gray-400 capitalize">{type.replace('_', ' ')}</span>
                              <span className="font-semibold">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <SimulationResults scenario={currentScenario} />
          </div>
        )}

        {/* Failed State - Mobile Optimized */}
        {currentScenario?.status === 'failed' && !isSimulating && (
          <div className="text-center py-12 sm:py-20">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-2xl sm:text-4xl">⚠️</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-red-400 mb-2">Simulation Failed</h3>
            <p className="text-gray-500 text-sm sm:text-base mb-4 px-4">{error || 'An error occurred during the simulation.'}</p>
            <button onClick={() => { setCurrentScenario(null); setError(null) }}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-miro-accent text-white text-sm sm:text-base font-medium hover:bg-miro-accent/80 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Empty State - Mobile Optimized */}
        {!currentScenario && !isSimulating && (
          <div className="text-center py-12 sm:py-20">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-miro-accent to-miro-glow opacity-50 animate-pulse-slow" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">Ready to Simulate</h3>
            <p className="text-gray-500 text-sm sm:text-base px-4">Enter a scenario above to start your first multi-agent simulation</p>
          </div>
        )}
      </div>
    </main>
  )
}
