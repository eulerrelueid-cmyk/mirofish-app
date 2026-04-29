'use client'

import { AlertTriangle, Clock, Flag, Heart, MessageCircle, TrendingUp, Users, Zap } from 'lucide-react'

import { SimulationEvent } from '@/types/simulation'

interface EventTimelineProps {
  events: SimulationEvent[]
  isLoading: boolean
}

const eventIcons = {
  interaction: MessageCircle,
  sentiment_shift: TrendingUp,
  emergence: Zap,
  milestone: Flag,
  post_viral: Heart,
  consensus: Users,
  conflict: AlertTriangle,
}

const eventColors = {
  interaction: 'text-miro-accent',
  sentiment_shift: 'text-miro-teal',
  emergence: 'text-miro-glow',
  milestone: 'text-miro-amber',
  post_viral: 'text-pink-400',
  consensus: 'text-green-400',
  conflict: 'text-red-400',
}

export function EventTimeline({ events, isLoading }: EventTimelineProps) {
  if (isLoading) {
    return (
      <section className="glass-panel rounded-[32px] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <Clock className="h-5 w-5 text-miro-accent" />
          <div>
            <h3 className="text-lg font-semibold text-white">Event timeline</h3>
            <p className="text-sm text-slate-400">Generating the signal trail</p>
          </div>
        </div>

        <div className="flex h-[280px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-miro-accent/25 border-t-miro-accent" />
            <p className="text-sm text-slate-400">Reading how the swarm is shifting...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="glass-panel rounded-[32px] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-miro-accent">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Event timeline</h3>
            <p className="text-sm text-slate-400">The major turns, escalations, and convergence moments</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
          {events.length} events
        </span>
      </div>

      <div className="max-h-[720px] overflow-y-auto pr-1 sm:pr-2">
        {events.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No events yet.</div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => {
              const Icon = eventIcons[event.type] || Zap
              const colorClass = eventColors[event.type] || 'text-gray-400'

              return (
                <div key={event.id} className="relative pl-10">
                  {index !== events.length - 1 && (
                    <div className="absolute left-[15px] top-10 bottom-[-12px] w-px bg-gradient-to-b from-white/15 via-white/10 to-transparent" />
                  )}

                  <div className="absolute left-0 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0d202a]">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        event.type === 'conflict'
                          ? 'bg-red-400'
                          : event.type === 'consensus'
                            ? 'bg-green-400'
                            : event.type === 'post_viral'
                              ? 'bg-pink-400'
                              : 'bg-miro-accent'
                      }`}
                    />
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 transition-colors hover:border-white/20">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5">
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
                            Round {event.round}
                          </span>
                          {event.impact > 0.7 && (
                            <span className="rounded-full border border-miro-glow/30 bg-miro-glow/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-miro-glow">
                              High impact
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium leading-7 text-white">{event.description}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {event.agentsInvolved.length} agent{event.agentsInvolved.length === 1 ? '' : 's'} participated
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
