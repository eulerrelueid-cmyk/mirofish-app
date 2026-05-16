'use client'

import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight } from 'lucide-react'

import { DecisionWorkbench } from '@/components/DecisionWorkbench'
import { DocsPanel } from '@/components/DocsPanel'
import { Header } from '@/components/Header'
import { ScenarioHistory } from '@/components/ScenarioHistory'
import { ScenarioInput } from '@/components/ScenarioInput'
import {
  loadCachedHistoryItems,
  loadCachedScenario,
  mergeHistoryCollections,
  saveCachedHistoryItems,
  saveCachedScenario,
} from '@/lib/browser-history'
import { buildScenarioFromPollResponse, type SimulationPollResponse } from '@/lib/simulation-contract'
import { buildHistoryItemFromScenario, upsertHistoryItem } from '@/lib/simulation-history'
import { SimulationHistoryItem, SimulationScenario } from '@/types/simulation'

const AGENT_COUNT = 15
const SIMULATION_ROUNDS = 12

type AppView = 'workspace' | 'history' | 'docs'

export default function Home() {
  const [activeView, setActiveView] = useState<AppView>('workspace')
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
      void loadScenarioById(scenarioId)
    },
    [loadScenarioById]
  )

  const openNewRun = useCallback(() => {
    setActiveView('workspace')
    setShowScenarioForm(true)
    setCurrentScenario(null)
    setIsSimulating(false)
    setError(null)
  }, [])

  const handleScenarioSubmit = useCallback(
    async (title: string, description: string, seedText?: string, file?: File) => {
      setActiveView('workspace')
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
        <section className="rounded-lg border border-rose-300/25 bg-rose-500/10 p-4 text-sm text-rose-100">
          <p className="font-semibold">Simulation error</p>
          <p className="mt-1 text-rose-100/80">{error}</p>
        </section>
      )}

      {showScenarioForm || !currentScenario ? (
        <ScenarioInput onSubmit={handleScenarioSubmit} isLoading={isSimulating} />
      ) : (
        <>
          <DecisionWorkbench
            scenario={currentScenario}
            isSimulating={isSimulating}
            onNewRun={openNewRun}
            onOpenHistory={() => setActiveView('history')}
          />

          {currentScenario.status === 'failed' && !isSimulating && (
            <section className="df-panel border-rose-300/25">
              <div className="flex flex-col gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-rose-300/20 bg-rose-500/10 text-rose-100">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-rose-100">Simulation failed</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {error || currentScenario.errorMessage || 'An error occurred during the simulation.'}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={openNewRun} className="df-primary-button">
                  Try again
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )

  const renderHistory = () => (
    <div className="space-y-4">
      <section className="df-panel">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="df-kicker">History</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">Saved runs</h2>
          </div>

          <div>
            <label className="mb-2 block font-mono text-[11px] uppercase text-slate-500">
              Search
            </label>
            <input
              type="search"
              value={historyQuery}
              onChange={(event) => setHistoryQuery(event.target.value)}
              placeholder="Title, description, or summary"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-miro-accent focus:outline-none focus:ring-2 focus:ring-miro-accent/20"
            />
          </div>
        </div>
      </section>

      <ScenarioHistory
        items={filteredHistoryItems}
        currentScenarioId={currentScenario?.id}
        isLoading={isHistoryLoading}
        error={historyError}
        onSelect={openHistoricRun}
      />
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

      <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {activeView === 'workspace' && renderWorkspace()}
        {activeView === 'history' && renderHistory()}
        {activeView === 'docs' && <DocsPanel />}
      </div>
    </main>
  )
}
