'use client'

import { Compass, GitBranch, Sparkles } from 'lucide-react'

const quickStart = [
  { label: 'Prompt', text: 'Write the scenario and the question to test.' },
  { label: 'Ground', text: 'Attach notes or one file only when needed.' },
  { label: 'Review', text: 'Open a run, then inspect graph, cohorts, channels, report, and interventions.' },
]

const scenarioTips = [
  'Lead with the trigger: launch, rumor, leak, price move, or policy change.',
  'Name the audience under pressure.',
  'Ask for an outcome you can judge.',
]

const readingTips = [
  { label: 'Graph', text: 'Actors, cohorts, platforms, and signals in one influence map.' },
  { label: 'Cohorts', text: 'Which stakeholder groups are supporting, resisting, or waiting.' },
  { label: 'Channels', text: 'Where visible attention, posts, and events are concentrating.' },
  { label: 'Interventions', text: 'Possible levers to test before committing to a decision.' },
]

export function DocsPanel() {
  return (
    <div className="space-y-4">
      <section className="df-panel">
        <div className="mb-5">
          <p className="df-kicker">Guide</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Decision simulation workflow</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {quickStart.map((item) => (
            <div key={item.label} className="df-card p-4">
              <p className="df-kicker">{item.label}</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="df-panel">
          <div className="mb-4 flex items-center gap-3">
            <div className="df-icon-box">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Prompting</h3>
              <p className="text-sm text-slate-500">Keep prompts specific.</p>
            </div>
          </div>

          <div className="space-y-3">
            {scenarioTips.map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="df-panel">
          <div className="mb-4 flex items-center gap-3">
            <div className="df-icon-box">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Views</h3>
              <p className="text-sm text-slate-500">Each view answers a different question.</p>
            </div>
          </div>

          <div className="space-y-3">
            {readingTips.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="df-panel">
        <div className="flex items-start gap-3">
          <div className="df-icon-box">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">How to read a run</h3>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              Treat the output as a dynamics model: look for actor incentives, pressure clusters, brittle assumptions,
              and the next intervention worth testing.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
