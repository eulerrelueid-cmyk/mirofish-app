'use client'

import { BookOpen, Compass, History, Sparkles } from 'lucide-react'

const quickStart = [
  { label: 'Prompt', text: 'Write the scenario and the question to test.' },
  { label: 'Ground', text: 'Attach notes or one file only when needed.' },
  { label: 'Review', text: 'Open a run in Workspace, then read report, feed, network, and timeline.' },
]

const scenarioTips = [
  'Lead with the trigger: launch, rumor, leak, price move, or policy change.',
  'Name the audience under pressure.',
  'Ask for an outcome you can judge.',
]

const readingTips = [
  { label: 'Overview', text: 'Fastest summary of likely outcomes.' },
  { label: 'Feed', text: 'Visible conversation and engagement.' },
  { label: 'Network', text: 'Central actors, bridges, and splits.' },
  { label: 'Timeline', text: 'Where the run turned or converged.' },
]

export function DocsPanel() {
  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-[30px] p-5 sm:p-6">
        <div className="mb-5">
          <div className="section-label">Guide</div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {quickStart.map((item) => (
            <div key={item.label} className="soft-panel rounded-[22px] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{item.text}</p>
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
              <h3 className="text-lg font-semibold text-white">Prompting</h3>
              <p className="text-sm text-slate-500">Keep prompts specific.</p>
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
              <h3 className="text-lg font-semibold text-white">Views</h3>
              <p className="text-sm text-slate-500">Each view answers a different question.</p>
            </div>
          </div>

          <div className="space-y-3">
            {readingTips.map((item) => (
              <div key={item.label} className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  )
}
