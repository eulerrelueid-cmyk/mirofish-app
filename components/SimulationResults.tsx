'use client'

import { AlertTriangle, ArrowUpRight, Lightbulb, Sparkles, TrendingUp } from 'lucide-react'

import { SimulationScenario } from '@/types/simulation'

interface SimulationResultsProps {
  scenario: SimulationScenario
}

export function SimulationResults({ scenario }: SimulationResultsProps) {
  if (!scenario.results) {
    return null
  }

  const runMetrics = [
    { label: 'Agents', value: scenario.results.agents.length },
    { label: 'Posts', value: scenario.results.posts.length },
    { label: 'Events', value: scenario.results.events.length },
    { label: 'Rounds', value: scenario.results.rounds.length },
  ]

  return (
    <section className="glass-panel hero-shell ambient-ring rounded-[34px] p-5 sm:p-6 lg:p-7">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="section-label">Summary</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
              Completed run
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-black/20 p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff1cf] via-miro-glow to-miro-accent text-slate-950">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-semibold tracking-tight text-white">Run summary</h3>
                <p className="mt-1 truncate text-sm text-slate-400">{scenario.title}</p>
              </div>
            </div>

            <p className="text-sm leading-8 text-slate-100 sm:text-[15px]">{scenario.results.summary}</p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="soft-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Run</p>
                <p className="mt-1 text-lg font-semibold text-white">Counts</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-miro-accent" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {runMetrics.map((metric) => (
                <div key={metric.label} className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="soft-panel rounded-[28px] p-5">
            <div className="mb-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">Predictions</p>
              <p className="mt-1 text-lg font-semibold text-white">Likely next moves</p>
            </div>

            <div className="space-y-3">
              {scenario.results.predictions.map((prediction, index) => {
                const tone = prediction.toLowerCase()
                const Icon =
                  tone.includes('risk') || tone.includes('concern')
                    ? AlertTriangle
                    : tone.includes('probability') || tone.includes('%')
                      ? TrendingUp
                      : Lightbulb

                const toneClass =
                  Icon === AlertTriangle
                    ? 'text-miro-amber'
                    : Icon === TrendingUp
                      ? 'text-miro-teal'
                      : 'text-miro-accent'

                return (
                  <div key={`${prediction}-${index}`} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                        <Icon className={`h-4 w-4 ${toneClass}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
                          Signal {index + 1}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-200">{prediction}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
