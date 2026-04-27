'use client'

import { BookOpen, Compass, History, Sparkles } from 'lucide-react'

const quickStart = [
  'Open Workspace from the menu and describe the scenario you want tested.',
  'Add seed text or upload a document only when you want the run grounded in specific source material.',
  'Start the simulation and wait for the feed, network, timeline, and summary to populate.',
]

const scenarioTips = [
  'Name the trigger clearly: launch, leak, rumor, policy change, pricing move, or crisis.',
  'Name the audience pressure: customers, investors, media, internal teams, or the public.',
  'Ask a concrete question: adoption, backlash, trust, narrative control, or likely winner.',
]

const readingTips = [
  'Overview gives you the fastest summary of the run.',
  'Feed shows how messages spread and who shaped the conversation.',
  'Network helps spot central actors, bridges, and polarized clusters.',
  'Timeline shows when the simulation turned, converged, or escalated.',
]

export function DocsPanel() {
  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-[28px] p-5 sm:p-6 glow-border">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-miro-accent via-miro-teal to-miro-glow text-slate-950">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="section-label mb-2">How to use MiroFish</div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">This page is for users, not setup details.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-300">
              Use it to understand the workflow, how to write stronger scenarios, and how to read the outputs once a run completes.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {quickStart.map((item, index) => (
            <div key={item} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">Step {index + 1}</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-[28px] p-5 glow-border">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-miro-glow/10 text-miro-glow">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Writing better scenarios</h3>
              <p className="text-sm text-slate-400">Keep prompts specific and decision-oriented.</p>
            </div>
          </div>

          <div className="space-y-3">
            {scenarioTips.map((item) => (
              <div key={item} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[28px] p-5 glow-border">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-miro-accent/10 text-miro-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Reading the results</h3>
              <p className="text-sm text-slate-400">Each workspace tab answers a different question.</p>
            </div>
          </div>

          <div className="space-y-3">
            {readingTips.map((item) => (
              <div key={item} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[28px] p-5 glow-border">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-slate-300">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Historic runs</h3>
            <p className="text-sm text-slate-400">Use the menu to reopen older simulations without mixing them into new-run flow.</p>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">
          Open the hamburger menu, choose <strong>Historic runs</strong>, select a saved run, then open it in the workspace when you want to inspect its results in detail.
        </div>
      </div>
    </div>
  )
}
