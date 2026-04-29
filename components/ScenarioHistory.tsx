'use client'

import { AlertTriangle, CheckCircle2, Clock3, Loader2, Orbit } from 'lucide-react'

import type { SimulationHistoryItem } from '@/types/simulation'

interface ScenarioHistoryProps {
  items: SimulationHistoryItem[]
  currentScenarioId?: string
  isLoading: boolean
  error?: string | null
  onSelect: (scenarioId: string) => void
}

function formatStatus(status: SimulationHistoryItem['status']) {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'pending':
      return 'Pending'
    default:
      return 'Running'
  }
}

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function ScenarioHistory({
  items,
  currentScenarioId,
  isLoading,
  error,
  onSelect,
}: ScenarioHistoryProps) {
  return (
    <section className="glass-panel rounded-[30px] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="section-label">History</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
            {items.length} runs
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[20px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!isLoading && items.length === 0 ? (
        <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-12 text-center text-sm text-slate-400">
          No runs yet.
        </div>
      ) : (
        <div className="max-h-[72vh] space-y-2 overflow-y-auto pr-1 sm:pr-2">
          {items.map((item) => {
            const isActive = item.id === currentScenarioId
            const statusTone =
              item.status === 'completed'
                ? 'border-miro-accent/20 bg-miro-accent/10 text-miro-accent'
                : item.status === 'failed'
                  ? 'border-red-400/20 bg-red-500/10 text-red-200'
                  : 'border-white/10 bg-white/5 text-slate-300'

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
                  isActive
                    ? 'border-white/[0.15] bg-white/[0.08]'
                    : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 line-clamp-1 text-sm leading-6 text-slate-500">{item.description}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone}`}>
                    {formatStatus(item.status)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatUpdatedAt(item.updatedAt)}
                  </span>
                  {item.resultCounts && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <span>{item.resultCounts.posts} posts</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <span>{item.resultCounts.rounds} rounds</span>
                    </>
                  )}
                </div>

                {item.summaryExcerpt && (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{item.summaryExcerpt}</p>
                )}

                {!item.summaryExcerpt && item.progress?.message && item.status === 'running' && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-miro-glow/20 bg-miro-glow/10 px-3 py-1.5 text-xs text-miro-glow">
                    <Orbit className="h-3.5 w-3.5" />
                    {item.progress.message}
                  </div>
                )}

                {item.errorMessage && item.status === 'failed' && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {item.errorMessage}
                  </div>
                )}

                {item.status === 'completed' && item.resultCounts && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-miro-accent/20 bg-miro-accent/10 px-3 py-1.5 text-xs text-miro-accent">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {item.resultCounts.agents} agents
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
