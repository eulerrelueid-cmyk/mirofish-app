'use client'

import { BookOpen, Compass, History, Sparkles } from 'lucide-react'

const quickStart = [
  'Open Workspace, describe the scenario, and keep the title specific enough that you can recognize it later in history.',
  'Add seed text or upload a source document when you want the run grounded in actual material instead of freeform debate.',
  'Use Overview first, then move into Feed, Network, and Timeline once you know which signal deserves deeper inspection.',
]

const scenarioTips = [
  'Lead with a trigger: launch, leak, rumor, pricing move, policy change, or public incident.',
  'State who is under pressure: customers, media, investors, employees, or a mixed audience.',
  'Ask for a decision-oriented outcome: adoption, backlash, trust erosion, narrative control, or strategic advantage.',
]

const readingTips = [
  'Overview is your executive brief: summary, top metrics, and likely outcomes.',
  'Feed reveals the texture of the conversation and who is shaping it in real time.',
  'Network exposes central actors, bridges, clusters, and sentiment splits.',
  'Timeline highlights the turning points that made the simulation converge or spiral.',
]

export function DocsPanel() {
  return (
    <div className="space-y-5">
      <section className="glass-panel hero-shell ambient-ring rounded-[34px] p-5 sm:p-6 lg:p-7">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff1cf] via-miro-glow to-miro-accent text-slate-950">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="section-label">User guide</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Use the studio like an operator, not a prompt dump.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
              Good results come from sharp triggers, grounded inputs, and reading the outputs in the right order. This page focuses on workflow, not setup.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {quickStart.map((item, index) => (
            <div key={item} className="soft-panel rounded-[24px] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">Step {index + 1}</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-[30px] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-miro-glow/10 text-miro-glow">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Writing stronger scenarios</h3>
              <p className="text-sm text-slate-400">Keep the brief specific, pressured, and testable.</p>
            </div>
          </div>

          <div className="space-y-3">
            {scenarioTips.map((item) => (
              <div key={item} className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[30px] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-miro-accent/10 text-miro-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Reading the outputs</h3>
              <p className="text-sm text-slate-400">Each view answers a different analytical question.</p>
            </div>
          </div>

          <div className="space-y-3">
            {readingTips.map((item) => (
              <div key={item} className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-panel rounded-[30px] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-300">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Historic runs</h3>
            <p className="text-sm text-slate-400">Use the library as a searchable record of your experiments.</p>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">
          Open <strong>Historic runs</strong>, select any saved simulation, review the summary card, then send it back to the workspace when you want the full feed, network, and timeline.
        </div>
      </section>
    </div>
  )
}
