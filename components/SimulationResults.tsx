'use client'

import { AlertTriangle, Lightbulb, Sparkles, TrendingUp } from 'lucide-react'

import { SimulationScenario } from '@/types/simulation'

interface SimulationResultsProps {
  scenario: SimulationScenario
}

export function SimulationResults({ scenario }: SimulationResultsProps) {
  if (!scenario.results) {
    return null
  }

  return (
    <div className="glass-panel rounded-[30px] p-5 sm:p-6 glow-border">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-miro-accent via-miro-teal to-miro-glow text-slate-950">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="section-label mb-2">Scenario readout</div>
          <h3 className="truncate text-2xl font-semibold tracking-tight text-white">Outcome summary</h3>
          <p className="truncate text-sm text-slate-400">{scenario.title}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[26px] border border-miro-accent/20 bg-gradient-to-br from-miro-accent/12 to-miro-teal/10 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-miro-accent">
            <Sparkles className="h-4 w-4" />
            Executive summary
          </div>
          <p className="text-sm leading-8 text-slate-100">{scenario.results.summary}</p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{scenario.results.agents.length} agents</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{scenario.results.posts.length} posts</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{scenario.results.rounds.length} rounds</span>
          </div>
        </div>

        <div className="grid gap-3">
          {scenario.results.predictions.map((prediction, index) => {
            const tone = prediction.toLowerCase()
            const Icon =
              tone.includes('risk') || tone.includes('concern')
                ? AlertTriangle
                : tone.includes('probability') || tone.includes('%')
                ? TrendingUp
                : Lightbulb

            const iconColor =
              Icon === AlertTriangle
                ? 'text-miro-amber'
                : Icon === TrendingUp
                ? 'text-miro-teal'
                : 'text-miro-accent'

            return (
              <div key={`${prediction}-${index}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Prediction {index + 1}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{prediction}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
