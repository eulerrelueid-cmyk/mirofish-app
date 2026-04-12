'use client'

import { SimulationEvent } from '@/types/simulation'
import { format } from 'date-fns'
import { Clock, MessageCircle, TrendingUp, Zap, Flag } from 'lucide-react'

interface EventTimelineProps {
  events: SimulationEvent[]
  isLoading: boolean
}

const eventIcons = {
  interaction: MessageCircle,
  sentiment_shift: TrendingUp,
  emergence: Zap,
  milestone: Flag,
}

const eventColors = {
  interaction: 'text-miro-accent',
  sentiment_shift: 'text-miro-teal',
  emergence: 'text-miro-glow',
  milestone: 'text-miro-amber',
}

export function EventTimeline({ events, isLoading }: EventTimelineProps) {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-4 glow-border h-[500px]">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-miro-accent" />
          <h3 className="font-semibold">Event Timeline</h3>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full border-3 border-miro-accent/30 border-t-miro-accent animate-spin" />
            <p className="text-sm text-gray-400">Generating events...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-2xl p-4 glow-border h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-miro-accent" />
          <h3 className="font-semibold">Event Timeline</h3>
        </div>
        <span className="text-sm text-gray-400">{events.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {events.map((event, index) => {
          const Icon = eventIcons[event.type]
          const colorClass = eventColors[event.type]
          
          return (
            <div
              key={event.id}
              className="p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors`}>
                  <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white mb-1">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{format(event.timestamp, 'HH:mm:ss')}</span>
                    <span className="capitalize">{event.type.replace('_', ' ')}</span>
                    {event.impact > 0.7 && (
                      <span className="px-2 py-0.5 rounded-full bg-miro-amber/20 text-miro-amber">
                        High Impact
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
