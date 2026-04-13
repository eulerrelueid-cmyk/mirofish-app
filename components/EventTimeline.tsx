'use client'

import { SimulationEvent } from '@/types/simulation'
import { format } from 'date-fns'
import { Clock, MessageCircle, TrendingUp, Zap, Flag, Users, AlertTriangle, Heart } from 'lucide-react'

interface EventTimelineProps {
  events: SimulationEvent[]
  isLoading: boolean
}

const eventIcons = {
  interaction: MessageCircle, sentiment_shift: TrendingUp, emergence: Zap,
  milestone: Flag, post_viral: Heart, consensus: Users, conflict: AlertTriangle,
}

const eventColors = {
  interaction: 'text-miro-accent', sentiment_shift: 'text-miro-teal', emergence: 'text-miro-glow',
  milestone: 'text-miro-amber', post_viral: 'text-pink-400', consensus: 'text-green-400', conflict: 'text-red-400',
}

export function EventTimeline({ events, isLoading }: EventTimelineProps) {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl sm:rounded-2xl p-3 sm:p-4 glow-border h-[300px] sm:h-[500px]">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-miro-accent" />
          <h3 className="font-semibold text-sm sm:text-base">Events</h3>
        </div>
        <div className="flex items-center justify-center h-[200px] sm:h-[400px]">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-full border-3 border-miro-accent/30 border-t-miro-accent animate-spin" />
            <p className="text-xs sm:text-sm text-gray-400">Generating...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-xl sm:rounded-2xl p-3 sm:p-4 glow-border h-[300px] sm:h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-miro-accent" />
          <h3 className="font-semibold text-sm sm:text-base">Events</h3>
        </div>
        <span className="text-xs sm:text-sm text-gray-400">{events.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-1 sm:pr-2">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">No events yet</div>
        ) : (
          events.map((event) => {
            const Icon = eventIcons[event.type] || Zap
            const colorClass = eventColors[event.type] || 'text-gray-400'
            return (
              <div key={event.id} className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white mb-0.5 sm:mb-1 leading-tight">{event.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                      <span>Round {event.round}</span>
                      {event.impact > 0.7 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-miro-amber/20 text-miro-amber text-xs">High Impact</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
