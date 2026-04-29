'use client'

import { AlertTriangle, CheckCircle2, Clock3, History, Loader2, Orbit } from 'lucide-react'

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
    <section className="glass-panel hero-shell ambient-ring rounded-[32px] p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff1cf] via-miro-glow to-miro-accent text-slate-950">
            <History className="h-5 w-5" />
          </div>
          <div>
            <div className="section-label">Run library</div>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
              Every saved simulation is available here. Reopen any run, inspect its summary, then jump back into the workspace.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
            {items.length} runs
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-[22px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!isLoading && items.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-12 text-center text-sm text-slate-400">
          No previous simulations yet.
        </div>
      ) : (
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1 sm:pr-2">
          {items.map((item) => {
            const isActive = item.id === currentScenarioId
            const statusTone =
              item.status === 'completed'
                ? 'text-miro-accent'
                : item.status === 'failed'
                  ? 'text-red-300'
                  : 'text-miro-glow'

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                  isActive
                    ? 'border-miro-accent/35 bg-gradient-to-r from-miro-accent/10 to-white/[0.03] shadow-[0_18px_36px_rgba(114,224,197,0.12)]'
                    : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-white">{item.title}</p>
                      <span className={`rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium ${statusTone}`}>
                        {formatStatus(item.status)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-400">{item.description}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatUpdatedAt(item.updatedAt)}
                  </span>
                  {item.resultCounts && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <span>{item.resultCounts.posts} posts</span>
                      <span className="h-1 w-1 rounded-full bg-slate-700" />
                      <span>{item.resultCounts.events} events</span>
                    </>
                  )}
                </div>

                {item.summaryExcerpt && (
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-200">{item.summaryExcerpt}</p>
                )}

                {!item.summaryExcerpt && item.progress?.message && item.status === 'running' && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-miro-glow/20 bg-miro-glow/10 px-3 py-1.5 text-xs text-miro-glow">
                    <Orbit className="h-3.5 w-3.5" />
                    {item.progress.message}
                  </div>
                )}

                {item.errorMessage && item.status === 'failed' && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {item.errorMessage}
                  </div>
                )}

                {item.status === 'completed' && item.resultCounts && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-miro-accent/20 bg-miro-accent/10 px-3 py-1.5 text-xs text-miro-accent">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {item.resultCounts.agents} agents simulated
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
