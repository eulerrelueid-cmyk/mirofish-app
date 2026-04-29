'use client'

import { BookOpen, Compass, History, Sparkles } from 'lucide-react'

const quickStart = [
  'Open Workspace, add a title, write the prompt, and run the scenario.',
  'Use optional grounding only when you want the simulation tied to specific notes or documents.',
  'Open History to reload a prior run. Open Overview first when you want the shortest path to results.',
]

const scenarioTips = [
  'Lead with the trigger: launch, rumor, leak, price move, or policy change.',
  'State who is under pressure: customers, media, investors, employees, or a mixed audience.',
  'Ask for an outcome you can judge: backlash, adoption, trust, narrative control, or likely winner.',
]

const readingTips = [
  'Overview is the shortest read: summary, metrics, and likely outcomes.',
  'Feed shows the visible conversation and who gets engagement.',
  'Network shows central actors, bridges, and sentiment splits.',
  'Timeline shows when the run turned, escalated, or converged.',
]

export function DocsPanel() {
  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-[30px] p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fff1cf] via-miro-glow to-miro-accent text-slate-950">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="section-label">How to use it</div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              This tab holds the app guidance so the workspace can stay focused on writing prompts and running simulations.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {quickStart.map((item, index) => (
            <div key={item} className="soft-panel rounded-[22px] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">Step {index + 1}</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-miro-glow/10 text-miro-glow">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Writing stronger scenarios</h3>
              <p className="text-sm text-slate-500">Keep prompts specific and decision-oriented.</p>
            </div>
          </div>

          <div className="space-y-3">
            {scenarioTips.map((item) => (
              <div key={item} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-miro-accent/10 text-miro-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Reading results</h3>
              <p className="text-sm text-slate-500">Each view answers a different question.</p>
            </div>
          </div>

          <div className="space-y-3">
            {readingTips.map((item) => (
              <div key={item} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-panel rounded-[28px] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-slate-300">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">History</h3>
            <p className="text-sm text-slate-500">Use the history tab as the record of previous runs.</p>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">
          Clicking a saved run opens it in the workspace. Use the search field to narrow the list by title, description, or summary.
        </div>
      </section>
    </div>
  )
}
