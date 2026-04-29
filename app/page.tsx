'use client'

import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BookOpen,
  FileText,
  History,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'

import { AgentNetwork } from '@/components/AgentNetwork'
import { DocsPanel } from '@/components/DocsPanel'
import { EventTimeline } from '@/components/EventTimeline'
import { Header } from '@/components/Header'
import { ScenarioHistory } from '@/components/ScenarioHistory'
import { ScenarioInput } from '@/components/ScenarioInput'
import { SimulationReportPanel } from '@/components/SimulationReportPanel'
import SocialFeed from '@/components/SocialFeed'
import { SimulationResults } from '@/components/SimulationResults'
import { StatsPanel } from '@/components/StatsPanel'
import {
  loadCachedHistoryItems,
  loadCachedScenario,
  mergeHistoryCollections,
  saveCachedHistoryItems,
  saveCachedScenario,
} from '@/lib/browser-history'
import { buildScenarioFromPollResponse, type SimulationPollResponse } from '@/lib/simulation-contract'
import { buildHistoryItemFromScenario, upsertHistoryItem } from '@/lib/simulation-history'
import { SimulationHistoryItem, SimulationScenario, SimulationStats } from '@/types/simulation'

const AGENT_COUNT = 15
const SIMULATION_ROUNDS = 12

type AppView = 'workspace' | 'history' | 'docs'
type WorkspaceView = 'overview' | 'report' | 'feed' | 'network' | 'events'

const workspaceTabs: Array<{
  id: WorkspaceView
  label: string
  icon: typeof Sparkles
}> = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'report', label: 'Report', icon: BookOpen },
  { id: 'feed', label: 'Feed', icon: MessageSquare },
  { id: 'network', label: 'Network', icon: Users },
  { id: 'events', label: 'Timeline', icon: Activity },
]

function formatStatusLabel(status?: SimulationScenario['status']) {
  if (!status) {
    return 'Idle'
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatUpdatedAt(date?: Date) {
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatEventType(type: string) {
  return type.replace(/_/g, ' ')
}

export default function Home() {
  const [activeView, setActiveView] = useState<AppView>('workspace')
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<WorkspaceView>('overview')
  const [showScenarioForm, setShowScenarioForm] = useState(true)
  const [historyQuery, setHistoryQuery] = useState('')
  const deferredHistoryQuery = useDeferredValue(historyQuery)

  const [currentScenario, setCurrentScenario] = useState<SimulationScenario | null>(null)
  const [historyItems, setHistoryItems] = useState<SimulationHistoryItem[]>([])
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [isSimulating, setIsSimulating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true)
      setHistoryError(null)

      const response = await fetch('/api/simulate/history', {
        cache: 'no-store',
      })
      const data = (await response.json()) as {
        error?: string
        items?: Array<Omit<SimulationHistoryItem, 'createdAt' | 'updatedAt'> & {
          createdAt: string
          updatedAt: string
        }>
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load scenario history')
      }

      const remoteItems = (data.items || []).map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))

      setHistoryItems((previous) => mergeHistoryCollections([...previous, ...remoteItems]))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load scenario history'
      setHistoryError(errorMessage)
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  const loadScenarioById = useCallback(
    async (scenarioId: string) => {
      const cachedScenario = loadCachedScenario(scenarioId)

      try {
        setError(null)
        setShowScenarioForm(false)
        setActiveWorkspaceView('overview')

        const response = await fetch(`/api/simulate?id=${scenarioId}`, {
          cache: 'no-store',
        })
        const data = (await response.json()) as {
          error?: string
          scenario?: Record<string, unknown>
          results?: Record<string, unknown>
        }

        if (!response.ok) {
          if (cachedScenario) {
            setCurrentScenario(cachedScenario)
            setIsSimulating(cachedScenario.status === 'running')
            setError(cachedScenario.status === 'failed' ? cachedScenario.errorMessage || 'Simulation failed' : null)
            setHistoryItems((previous) =>
              mergeHistoryCollections([...previous, buildHistoryItemFromScenario(cachedScenario)])
            )
            return
          }

          throw new Error(data.error || 'Failed to load simulation')
        }

        if (!data.scenario) {
          throw new Error('Simulation detail payload was missing scenario data')
        }

        const loadedScenario = buildScenarioFromPollResponse(
          data as unknown as SimulationPollResponse,
          currentScenario?.id === scenarioId ? currentScenario : null
        )

        setCurrentScenario(loadedScenario)
        setIsSimulating(loadedScenario.status === 'running')
        setError(loadedScenario.status === 'failed' ? loadedScenario.errorMessage || 'Simulation failed' : null)
        setHistoryItems((previous) => upsertHistoryItem(previous, buildHistoryItemFromScenario(loadedScenario)))
      } catch (err) {
        if (cachedScenario) {
          setCurrentScenario(cachedScenario)
          setIsSimulating(cachedScenario.status === 'running')
          setError(cachedScenario.status === 'failed' ? cachedScenario.errorMessage || 'Simulation failed' : null)
          setHistoryItems((previous) =>
            mergeHistoryCollections([...previous, buildHistoryItemFromScenario(cachedScenario)])
          )
          return
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to load simulation'
        setError(errorMessage)
      }
    },
    [currentScenario]
  )

  const openHistoricRun = useCallback(
    (scenarioId: string) => {
      setActiveView('workspace')
      setShowScenarioForm(false)
      setActiveWorkspaceView('overview')
      void loadScenarioById(scenarioId)
    },
    [loadScenarioById]
  )

  const handleScenarioSubmit = useCallback(
    async (title: string, description: string, seedText?: string, file?: File) => {
      setActiveView('workspace')
      setActiveWorkspaceView('overview')
      setShowScenarioForm(false)
      setError(null)
      setIsSimulating(true)

      const scenario: SimulationScenario = {
        id: `pending-${Date.now()}`,
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
      setHistoryItems((previous) => upsertHistoryItem(previous, buildHistoryItemFromScenario(scenario)))

      try {
        const formData = new FormData()
        formData.append('title', title)
        formData.append('description', description)

        if (seedText) {
          formData.append('seedText', seedText)
        }

        if (file) {
          formData.append('file', file)
        }

        const response = await fetch('/api/simulate', {
          method: 'POST',
          body: formData,
        })

        const data = (await response.json()) as {
          error?: string
          scenarioId?: string
          workflowRunId?: string
          mockMode?: boolean
        }

        if (!response.ok) {
          throw new Error(data.error || 'Simulation failed')
        }

        const queuedScenario: SimulationScenario = {
          ...scenario,
          id: data.scenarioId ?? scenario.id,
          status: 'running',
          workflowRunId: data.workflowRunId,
          mockMode: data.mockMode,
          progress: {
            stage: 'queued',
            message: 'Simulation queued for background execution',
            totalRounds: SIMULATION_ROUNDS,
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        }

        setCurrentScenario(queuedScenario)
        setHistoryItems((previous) =>
          upsertHistoryItem(
            previous.filter((item) => item.id !== scenario.id),
            buildHistoryItemFromScenario(queuedScenario)
          )
        )
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Simulation failed'
        setError(errorMessage)
        setIsSimulating(false)
        const failedScenario = { ...scenario, status: 'failed' as const, errorMessage, updatedAt: new Date() }
        setCurrentScenario(failedScenario)
        setHistoryItems((previous) => upsertHistoryItem(previous, buildHistoryItemFromScenario(failedScenario)))
      }
    },
    []
  )

  useEffect(() => {
    const cachedHistory = loadCachedHistoryItems()
    if (cachedHistory.length > 0) {
      setHistoryItems((previous) => mergeHistoryCollections([...previous, ...cachedHistory]))
    }
  }, [])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (!currentScenario || currentScenario.id.startsWith('pending-')) {
      return
    }

    setHistoryItems((previous) => upsertHistoryItem(previous, buildHistoryItemFromScenario(currentScenario)))
  }, [currentScenario])

  useEffect(() => {
    saveCachedHistoryItems(historyItems)
  }, [historyItems])

  useEffect(() => {
    saveCachedScenario(currentScenario)
  }, [currentScenario])

  useEffect(() => {
    if (
      !currentScenario ||
      currentScenario.status !== 'running' ||
      !currentScenario.workflowRunId ||
      currentScenario.id.startsWith('pending-')
    ) {
      return
    }

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const pollScenario = async () => {
      try {
        const response = await fetch(`/api/simulate?id=${currentScenario.id}`, {
          cache: 'no-store',
        })
        const data = (await response.json()) as {
          error?: string
          scenario?: Record<string, unknown>
          results?: Record<string, unknown>
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch simulation status')
        }

        if (!data.scenario) {
          throw new Error('Simulation status payload was missing scenario data')
        }

        if (cancelled) {
          return
        }

        const pollResponse = data as unknown as SimulationPollResponse
        const nextScenario = buildScenarioFromPollResponse(pollResponse, currentScenario)
        setCurrentScenario((previous) => buildScenarioFromPollResponse(pollResponse, previous))

        if (nextScenario.status === 'completed') {
          setIsSimulating(false)
          setError(null)
          return
        }

        if (nextScenario.status === 'failed') {
          setIsSimulating(false)
          setError(nextScenario.errorMessage || 'Simulation failed')
          return
        }

        timeoutId = setTimeout(pollScenario, 3000)
      } catch (err) {
        if (cancelled) {
          return
        }

        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch simulation status'
        setError(errorMessage)
        setIsSimulating(false)
        setCurrentScenario((previous) =>
          previous
            ? {
                ...previous,
                status: 'failed',
                errorMessage,
                updatedAt: new Date(),
              }
            : previous
        )
      }
    }

    void pollScenario()

    return () => {
      cancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [currentScenario?.id, currentScenario?.status, currentScenario?.workflowRunId])

  const stats: SimulationStats = (() => {
    if (!currentScenario?.results) {
      return {
        totalAgents: 0,
        activeInteractions: 0,
        avgSentiment: 0,
        convergenceRate: 0,
        predictionConfidence: 0,
        totalPosts: 0,
        totalComments: 0,
        viralPosts: 0,
        positiveAgents: 0,
        negativeAgents: 0,
        neutralAgents: 0,
        connectionsFormed: 0,
      }
    }

    const { agents, posts, events, rounds } = currentScenario.results
    const totalComments = posts.reduce((acc, post) => acc + (post.comments?.length || 0), 0)
    const connectionsFormed = rounds.reduce((acc, round) => acc + round.newConnections.length, 0)
    const avgSentiment = agents.reduce((acc, agent) => acc + agent.sentiment, 0) / agents.length
    const sentimentVariance =
      agents.reduce((acc, agent) => acc + Math.pow(agent.sentiment - avgSentiment, 2), 0) / agents.length

    return {
      totalAgents: agents.length,
      activeInteractions: events.filter((event) => event.type === 'interaction').length,
      avgSentiment,
      convergenceRate: Math.max(0, 1 - sentimentVariance),
      predictionConfidence: 0.75 + Math.max(0, 1 - sentimentVariance) * 0.2,
      totalPosts: posts.length,
      totalComments,
      viralPosts: posts.filter((post) => post.engagement > 5).length,
      positiveAgents: agents.filter((agent) => agent.sentiment > 0.3).length,
      negativeAgents: agents.filter((agent) => agent.sentiment < -0.3).length,
      neutralAgents: agents.filter((agent) => Math.abs(agent.sentiment) <= 0.3).length,
      connectionsFormed,
    }
  })()

  const results = currentScenario?.results
  const topInfluencers = results
    ? [...results.agents].sort((a, b) => b.influence - a.influence).slice(0, 5)
    : []
  const eventSummary = results
    ? ['interaction', 'sentiment_shift', 'emergence', 'consensus', 'conflict', 'post_viral']
        .map((type) => ({
          type,
          count: results.events.filter((event) => event.type === type).length,
        }))
        .filter((item) => item.count > 0)
    : []

  const historyFilter = deferredHistoryQuery.trim().toLowerCase()
  const filteredHistoryItems = historyFilter
    ? historyItems.filter((item) => {
        const haystack = `${item.title} ${item.description} ${item.summaryExcerpt || ''}`.toLowerCase()
        return haystack.includes(historyFilter)
      })
    : historyItems

  const renderWorkspace = () => (
    <div className="space-y-4">
      {error && (
        <section className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          <p className="font-semibold">Simulation error</p>
          <p className="mt-1 text-red-100/80">{error}</p>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        {(showScenarioForm || !currentScenario) ? (
          <ScenarioInput onSubmit={handleScenarioSubmit} isLoading={isSimulating} />
        ) : (
          <section className="glass-panel rounded-[30px] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="section-label">Current run</div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{currentScenario.title}</h2>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] ${
                  currentScenario.status === 'completed'
                    ? 'border border-miro-accent/30 bg-miro-accent/10 text-miro-accent'
                    : currentScenario.status === 'failed'
                      ? 'border border-red-400/20 bg-red-500/10 text-red-200'
                      : 'border border-miro-glow/30 bg-miro-glow/10 text-miro-glow'
                }`}
              >
                {currentScenario.status === 'running'
                  ? currentScenario.progress?.stage ?? 'running'
                  : formatStatusLabel(currentScenario.status)}
              </span>
            </div>

            <p className="text-sm leading-7 text-slate-300">{currentScenario.description}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {currentScenario.parameters.agentCount} agents
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {currentScenario.parameters.simulationRounds} rounds
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Updated {formatUpdatedAt(currentScenario.updatedAt)}
              </span>
              {currentScenario.uploadedFile && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {currentScenario.uploadedFile.name}
                </span>
              )}
            </div>
          </section>
        )}

        <aside className="soft-panel rounded-[30px] p-5">
          <div className="mb-4">
            <div className="section-label">Workspace</div>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Keep this tab for writing prompts, launching runs, and reviewing the selected simulation.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowScenarioForm(true)
                setActiveWorkspaceView('overview')
              }}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <span>{currentScenario ? 'New run' : 'Open prompt form'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveView('history')}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <span>Open history</span>
              <History className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveView('docs')}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <span>Guide</span>
              <BookOpen className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>

      {isSimulating && (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="soft-panel rounded-[24px] p-4 text-center">
            <Users className="mx-auto h-5 w-5 text-miro-accent" />
            <p className="mt-3 text-sm font-medium text-white">
              {currentScenario?.progress?.stage === 'initializing' ? 'Generating personas' : `${AGENT_COUNT} agents staged`}
            </p>
          </div>
          <div className="soft-panel rounded-[24px] p-4 text-center">
            <Activity className="mx-auto h-5 w-5 text-miro-teal" />
            <p className="mt-3 text-sm font-medium text-white">
              Round {currentScenario?.progress?.currentRound ?? 0} / {currentScenario?.progress?.totalRounds ?? SIMULATION_ROUNDS}
            </p>
          </div>
          <div className="soft-panel rounded-[24px] p-4 text-center">
            <TrendingUp className="mx-auto h-5 w-5 text-miro-glow" />
            <p className="mt-3 text-sm font-medium text-white">
              {currentScenario?.progress?.message || 'Running simulation'}
            </p>
          </div>
        </section>
      )}

      {currentScenario?.status === 'completed' && results && (
        <section className="space-y-4">
          <div className="glass-panel rounded-[26px] p-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {workspaceTabs.map(({ id, label, icon: Icon }) => {
                const isActive = activeWorkspaceView === id

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveWorkspaceView(id)}
                    className={`inline-flex min-w-fit items-center gap-2 rounded-[20px] px-4 py-3 text-sm transition-all ${
                      isActive
                        ? 'bg-white text-slate-950 shadow-[0_10px_20px_rgba(255,255,255,0.1)]'
                        : 'border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.08]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {activeWorkspaceView === 'overview' && (
            <div className="space-y-4">
              <StatsPanel stats={stats} isLoading={isSimulating} />
              <SimulationResults scenario={currentScenario} />

              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="glass-panel rounded-[28px] p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="section-label">Influence</div>
                      <p className="mt-3 text-sm text-slate-500">Highest-influence agents at the end of the run.</p>
                    </div>
                    <Users className="h-4 w-4 text-miro-accent" />
                  </div>

                  <div className="space-y-3">
                    {topInfluencers.map((agent, index) => (
                      <div key={agent.id} className="soft-panel rounded-[22px] p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-miro-teal via-miro-accent to-miro-glow text-sm font-semibold text-slate-950">
                            {agent.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-white">{agent.name}</p>
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-400">
                                #{index + 1}
                              </span>
                            </div>
                            <p className="truncate text-xs text-slate-500">{agent.role}</p>
                          </div>
                          <div className="rounded-full border border-miro-accent/25 bg-miro-accent/10 px-2.5 py-1 text-xs font-medium text-miro-accent">
                            {(agent.influence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="glass-panel rounded-[28px] p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="section-label">Event profile</div>
                      <p className="mt-3 text-sm text-slate-500">Which event types dominated the run.</p>
                    </div>
                    <Activity className="h-4 w-4 text-miro-glow" />
                  </div>

                  <div className="space-y-3">
                    {eventSummary.map((item) => (
                      <div key={item.type} className="soft-panel rounded-[22px] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="capitalize text-slate-300">{formatEventType(item.type)}</span>
                          <span className="text-lg font-semibold text-white">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeWorkspaceView === 'feed' && (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <SocialFeed posts={results.posts} agents={results.agents} />
              <EventTimeline events={results.events} isLoading={isSimulating} />
            </div>
          )}

          {activeWorkspaceView === 'report' && <SimulationReportPanel scenario={currentScenario} />}

          {activeWorkspaceView === 'network' && (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <AgentNetwork agents={results.agents} events={results.events} isLoading={isSimulating} />
              <section className="glass-panel rounded-[28px] p-5 sm:p-6">
                <div className="mb-4">
                  <div className="section-label">Sentiment split</div>
                  <p className="mt-3 text-sm text-slate-500">Where the agents settled by the final round.</p>
                </div>

                <div className="space-y-3">
                  <div className="soft-panel rounded-[22px] px-4 py-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-miro-accent">
                        <span className="h-2.5 w-2.5 rounded-full bg-miro-accent" />
                        Positive
                      </span>
                      <span className="font-semibold text-white">{stats.positiveAgents}</span>
                    </div>
                  </div>
                  <div className="soft-panel rounded-[22px] px-4 py-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                        Neutral
                      </span>
                      <span className="font-semibold text-white">{stats.neutralAgents}</span>
                    </div>
                  </div>
                  <div className="soft-panel rounded-[22px] px-4 py-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-miro-amber">
                        <span className="h-2.5 w-2.5 rounded-full bg-miro-amber" />
                        Negative
                      </span>
                      <span className="font-semibold text-white">{stats.negativeAgents}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeWorkspaceView === 'events' && (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <EventTimeline events={results.events} isLoading={isSimulating} />
              <section className="glass-panel rounded-[28px] p-5 sm:p-6">
                <div className="mb-4">
                  <div className="section-label">Prediction confidence</div>
                  <p className="mt-3 text-sm text-slate-500">How coherently the swarm settled.</p>
                </div>

                <div className="rounded-[24px] border border-miro-glow/20 bg-gradient-to-br from-miro-glow/12 to-white/[0.03] p-5">
                  <p className="text-5xl font-semibold tracking-tight text-white">
                    {(stats.predictionConfidence * 100).toFixed(0)}%
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Higher confidence means the run ended in a tighter pattern of beliefs rather than scattering across incompatible narratives.
                  </p>
                </div>
              </section>
            </div>
          )}
        </section>
      )}

      {currentScenario?.status === 'failed' && !isSimulating && (
        <section className="glass-panel rounded-[30px] px-6 py-10 text-center sm:px-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-2xl">
            ⚠️
          </div>
          <h3 className="text-2xl font-semibold text-red-300">Simulation failed</h3>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-400">
            {error || currentScenario.errorMessage || 'An error occurred during the simulation.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setCurrentScenario(null)
              setError(null)
              setShowScenarioForm(true)
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fff1cf] via-miro-glow to-miro-accent px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
          >
            Try again
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}
    </div>
  )

  const renderHistory = () => (
    <div className="space-y-4">
      <section className="glass-panel rounded-[30px] p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="section-label">History</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Saved runs</h2>
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Search
            </label>
            <input
              type="search"
              value={historyQuery}
              onChange={(event) => setHistoryQuery(event.target.value)}
              placeholder="Title, description, or summary"
              className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-miro-accent focus:outline-none focus:ring-2 focus:ring-miro-accent/20"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ScenarioHistory
          items={filteredHistoryItems}
          currentScenarioId={currentScenario?.id}
          isLoading={isHistoryLoading}
          error={historyError}
          onSelect={openHistoricRun}
        />

        <aside className="soft-panel rounded-[30px] p-5">
          <div className="mb-4">
            <div className="section-label">History</div>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              This tab is only for reopening prior runs. Guidance and workflow notes live under How to use it.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setActiveView('docs')}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <span>Guide</span>
              <BookOpen className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('workspace')
                setShowScenarioForm(true)
              }}
              className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <span>Start a new run</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  )

  const renderDocs = () => (
    <div className="space-y-4">
      <section className="glass-panel rounded-[30px] p-5 sm:p-6">
        <div className="section-label">Guide</div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Workspace stays prompt-first. History stays focused on reopening runs. This tab holds the guidance.
        </p>
      </section>
      <DocsPanel />
    </div>
  )

  return (
    <main className="min-h-screen bg-miro-dark text-white">
      <Header
        activeView={activeView}
        currentScenarioTitle={currentScenario?.title}
        currentScenarioStatus={currentScenario?.status}
        onNavigate={setActiveView}
      />

      <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {activeView === 'workspace' && renderWorkspace()}
        {activeView === 'history' && renderHistory()}
        {activeView === 'docs' && renderDocs()}
      </div>
    </main>
  )
}
