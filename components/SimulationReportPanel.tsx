'use client'

import { Compass, FileText, Layers3, Radar, Sparkles } from 'lucide-react'

import { buildProjectWorkflow } from '@/lib/project-workflow'
import { SimulationInterviewPanel } from '@/components/SimulationInterviewPanel'
import type { SimulationScenario } from '@/types/simulation'

interface SimulationReportPanelProps {
  scenario: SimulationScenario
}

export function SimulationReportPanel({ scenario }: SimulationReportPanelProps) {
  if (!scenario.results && !scenario.project?.reportSnapshot) {
    return null
  }

  const { brief } = scenario.results || {}
  const project = scenario.project
  const report = scenario.results?.report ?? project?.reportSnapshot
  const workflow = buildProjectWorkflow(project, scenario)
  const reportSource = scenario.results?.report ? 'Run report' : 'Stored project snapshot'

  if (!brief && !report && !project) {
    return (
      <section className="glass-panel rounded-[28px] p-5 sm:p-6">
        <div className="section-label">Report</div>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          This run does not include a structured report artifact yet.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-[28px] p-5 sm:p-6">
        <div className="mb-4">
          <div className="section-label">Workflow</div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {workflow.map((step) => {
            const tone =
              step.status === 'complete'
                ? 'border-miro-accent/20 bg-miro-accent/10 text-miro-accent'
                : step.status === 'current'
                  ? 'border-miro-glow/20 bg-miro-glow/10 text-miro-glow'
                  : 'border-white/10 bg-black/20 text-slate-400'

            return (
              <div key={step.id} className={`rounded-[22px] border px-4 py-4 ${tone}`}>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em]">{step.id}</p>
                <p className="mt-2 text-base font-semibold">{step.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {project && (
        <section className="glass-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-miro-accent">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <div className="section-label">Project</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_320px]">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Project name</p>
                <p className="mt-2 text-lg font-semibold text-white">{project.name}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Objective</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{project.objective}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="soft-panel rounded-[22px] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Status</p>
                <p className="mt-2 text-sm font-semibold capitalize text-white">{project.status.replace(/_/g, ' ')}</p>
              </div>
              <div className="soft-panel rounded-[22px] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Source mode</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {project.sourceMode === 'grounded_upload' ? 'Grounded upload' : 'Prompt only'}
                </p>
                {project.sourceReference && <p className="mt-2 text-sm text-slate-400">{project.sourceReference}</p>}
              </div>
              {project.focusAreas.length > 0 && (
                <div className="soft-panel rounded-[22px] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Focus</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.focusAreas.map((area) => (
                      <span key={area} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {brief && (
        <section className="glass-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-miro-accent">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="section-label">World brief</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_320px]">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Premise</p>
                <p className="mt-2 text-lg font-semibold text-white">{brief.premise}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Objective</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{brief.objective}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="soft-panel rounded-[22px] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Source mode</p>
                <p className="mt-2 text-sm font-semibold text-white">{brief.sourceMode === 'grounded_upload' ? 'Grounded upload' : 'Prompt only'}</p>
                {brief.sourceReference && <p className="mt-2 text-sm text-slate-400">{brief.sourceReference}</p>}
              </div>
              <div className="soft-panel rounded-[22px] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Platforms</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {brief.platforms.map((platform) => (
                    <span key={platform} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
              <div className="soft-panel rounded-[22px] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Focus areas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {brief.focusAreas.map((area) => (
                    <span key={area} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {report && (
        <section className="glass-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-miro-glow">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="section-label">Report</div>
              <p className="mt-3 text-sm text-slate-500">{reportSource}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4 text-miro-accent" />
                Executive verdict
              </div>
              <p className="text-sm leading-7 text-slate-200">{report.executiveVerdict}</p>
            </div>

            <div className="soft-panel rounded-[22px] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                <Layers3 className="h-4 w-4 text-miro-accent" />
                Key drivers
              </div>
              <div className="space-y-2">
                {report.keyDrivers.map((item) => (
                  <div key={item} className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-panel rounded-[22px] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                <Radar className="h-4 w-4 text-miro-glow" />
                Audience signals
              </div>
              <div className="space-y-2">
                {report.audienceSignals.map((item) => (
                  <div key={item} className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-panel rounded-[22px] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Twitter readout</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{report.platformReadout.twitter}</p>
            </div>

            <div className="soft-panel rounded-[22px] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Reddit readout</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">{report.platformReadout.reddit}</p>
            </div>

            <div className="soft-panel rounded-[22px] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Intervention ideas</p>
              <div className="mt-3 space-y-2">
                {report.interventionIdeas.map((item) => (
                  <div key={item} className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-panel rounded-[22px] p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Watch signals</p>
              <div className="mt-3 space-y-2">
                {report.watchSignals.map((item) => (
                  <div key={item} className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <SimulationInterviewPanel scenario={scenario} />
    </div>
  )
}
