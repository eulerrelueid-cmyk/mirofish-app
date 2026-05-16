'use client'

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  Check,
  ChevronRight,
  Clock3,
  Gauge,
  MessageSquare,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react'

import { DecisionGraph } from '@/components/DecisionGraph'
import { SimulationInterviewPanel } from '@/components/SimulationInterviewPanel'
import { buildDecisionWorkbench, type DecisionStageStatus } from '@/lib/decision-intelligence'
import type { SimulationScenario } from '@/types/simulation'

interface DecisionWorkbenchProps {
  scenario: SimulationScenario
  isSimulating: boolean
  onNewRun: () => void
  onOpenHistory: () => void
}

const statusCopy: Record<DecisionStageStatus, string> = {
  waiting: 'Waiting',
  active: 'Active',
  complete: 'Complete',
  failed: 'Failed',
}

const signalToneClass = {
  good: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
  watch: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  risk: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
  neutral: 'border-slate-300/15 bg-slate-300/10 text-slate-100',
}

function formatStatus(status: SimulationScenario['status']) {
  return status.replace(/_/g, ' ')
}

function formatSigned(value: number) {
  const rounded = value.toFixed(2)
  return value > 0 ? `+${rounded}` : rounded
}

function stageClass(status: DecisionStageStatus) {
  if (status === 'complete') {
    return 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'
  }

  if (status === 'active') {
    return 'border-amber-300/30 bg-amber-300/10 text-amber-100'
  }

  if (status === 'failed') {
    return 'border-rose-300/30 bg-rose-300/10 text-rose-100'
  }

  return 'border-white/10 bg-white/[0.03] text-slate-400'
}

function stageIcon(status: DecisionStageStatus) {
  if (status === 'complete') {
    return <Check className="h-3.5 w-3.5" />
  }

  if (status === 'failed') {
    return <AlertTriangle className="h-3.5 w-3.5" />
  }

  if (status === 'active') {
    return <Activity className="h-3.5 w-3.5" />
  }

  return <Clock3 className="h-3.5 w-3.5" />
}

export function DecisionWorkbench({ scenario, isSimulating, onNewRun, onOpenHistory }: DecisionWorkbenchProps) {
  const model = buildDecisionWorkbench(scenario)
  const activeStage = model.stages.find((stage) => stage.status === 'active') ?? model.stages[0]
  const topCohorts = model.cohorts.filter((cohort) => cohort.count > 0)
  const reportReady = Boolean(scenario.results?.report || scenario.project?.reportSnapshot)

  return (
    <div className="space-y-4">
      <section className="df-panel df-hero">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="df-status-pill">
                <span className={isSimulating ? 'df-live-dot' : 'df-dot'} />
                {formatStatus(scenario.status)}
              </span>
              {scenario.mockMode && <span className="df-status-pill">mock mode</span>}
              {scenario.status === 'running' && scenario.progress?.stage && (
                <span className="df-status-pill">{scenario.progress.stage}</span>
              )}
            </div>

            <h2 className="text-2xl font-semibold tracking-normal text-white sm:text-3xl">{scenario.title}</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">{scenario.description}</p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {model.signals.map((signal) => (
                <div key={signal.id} className={`rounded-lg border p-4 ${signalToneClass[signal.tone]}`}>
                  <p className="df-kicker">{signal.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{signal.value}</p>
                  <p className="mt-2 text-xs leading-5 opacity-80">{signal.description}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="df-kicker">Current phase</p>
                <p className="mt-1 text-lg font-semibold text-white">{activeStage.label}</p>
              </div>
              <div className="df-icon-box">
                <Gauge className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2">
              <button type="button" onClick={onNewRun} className="df-command-button">
                <span>New run</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={onOpenHistory} className="df-command-button">
                <span>History</span>
                <BookOpenText className="h-4 w-4" />
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section className="df-stage-rail">
        {model.stages.map((stage, index) => (
          <div key={stage.id} className={`df-stage-card ${stageClass(stage.status)}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="df-kicker">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-2 text-sm font-semibold text-white">{stage.label}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/15 p-1.5">{stageIcon(stage.status)}</div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">{stage.description}</p>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
              <span>{statusCopy[stage.status]}</span>
              <span className="font-mono text-slate-300">{stage.metric}</span>
            </div>
          </div>
        ))}
      </section>

      <DecisionGraph graph={model.graph} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="df-panel">
          <div className="df-panel-header">
            <div>
              <p className="df-kicker">Stakeholders</p>
              <h2 className="df-panel-title">Cohort pressure</h2>
            </div>
            <div className="df-icon-box">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-3">
            {topCohorts.length > 0 ? (
              topCohorts.map((cohort) => (
                <article key={cohort.id} className="df-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{cohort.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{cohort.description}</p>
                    </div>
                    <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-sm text-white">
                      {cohort.count}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-white/10 bg-black/20 p-3">
                      <p className="df-kicker">Sentiment</p>
                      <p className="mt-2 text-sm font-semibold text-white">{formatSigned(cohort.averageSentiment)}</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/20 p-3">
                      <p className="df-kicker">Influence</p>
                      <p className="mt-2 text-sm font-semibold text-white">{Math.round(cohort.averageInfluence * 100)}%</p>
                    </div>
                  </div>

                  {cohort.topAgents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {cohort.topAgents.slice(0, 3).map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-100">{agent.name}</p>
                            <p className="truncate text-xs text-slate-500">{agent.role}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="df-empty-state">
                <BrainCircuit className="h-5 w-5" />
                <p>Agent cohorts appear after the simulation starts.</p>
              </div>
            )}
          </div>
        </section>

        <section className="df-panel">
          <div className="df-panel-header">
            <div>
              <p className="df-kicker">Channels</p>
              <h2 className="df-panel-title">Platform readouts</h2>
            </div>
            <div className="df-icon-box">
              <Radio className="h-4 w-4" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {model.channelReadouts.map((readout) => (
              <article key={readout.id} className="df-card p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{readout.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{readout.description}</p>
                  </div>
                  <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-white/10 bg-black/20 p-3">
                    <p className="df-kicker">Round</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {readout.currentRound}/{readout.totalRounds}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/20 p-3">
                    <p className="df-kicker">Posts</p>
                    <p className="mt-2 text-sm font-semibold text-white">{readout.posts}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/20 p-3">
                    <p className="df-kicker">Events</p>
                    <p className="mt-2 text-sm font-semibold text-white">{readout.events}</p>
                  </div>
                </div>

                {readout.topPost && (
                  <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-500">
                      {readout.topPost.author} / {readout.topPost.engagement.toFixed(1)} engagement
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{readout.topPost.content}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className="df-panel">
          <div className="df-panel-header">
            <div>
              <p className="df-kicker">Synthesis</p>
              <h2 className="df-panel-title">Decision report</h2>
            </div>
            <div className="df-icon-box">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-3">
            {model.reportSections.map((section) => (
              <article key={section.id} className="df-card p-4">
                <p className="text-sm font-semibold text-white">{section.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{section.body}</p>
                {section.items.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {section.items.map((item) => (
                      <div key={item} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="df-panel">
          <div className="df-panel-header">
            <div>
              <p className="df-kicker">Decision levers</p>
              <h2 className="df-panel-title">Intervention lab</h2>
            </div>
            <div className="df-icon-box">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-3">
            {model.interventions.map((intervention) => (
              <article key={intervention.id} className="df-card p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-6 text-white">{intervention.title}</p>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300">
                    {intervention.owner}
                  </span>
                </div>
                <div className="space-y-2 text-sm leading-6 text-slate-400">
                  <p>{intervention.expectedEffect}</p>
                  <p className="text-slate-300">Watch: {intervention.watchMetric}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="df-panel">
        <div className="df-panel-header">
          <div>
            <p className="df-kicker">Console</p>
            <h2 className="df-panel-title">Run trace</h2>
          </div>
          <div className="df-icon-box">
            <Search className="h-4 w-4" />
          </div>
        </div>

        <div className="max-h-[260px] overflow-auto rounded-lg border border-white/10 bg-black/35 p-3 font-mono text-xs">
          {model.consoleLines.map((line) => (
            <div key={line.id} className="grid gap-2 border-b border-white/5 py-2 last:border-b-0 sm:grid-cols-[96px_110px_minmax(0,1fr)]">
              <span className="text-slate-500">{line.time}</span>
              <span className="uppercase text-slate-400">{line.stage}</span>
              <span className="text-slate-200">{line.message}</span>
            </div>
          ))}
        </div>
      </section>

      {reportReady && scenario.results && <SimulationInterviewPanel scenario={scenario} />}
    </div>
  )
}
