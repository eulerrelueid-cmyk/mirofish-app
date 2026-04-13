'use client'

import { SimulationStats } from '@/types/simulation'
import { MessageSquare, TrendingUp, Target, Link2, Heart } from 'lucide-react'

interface StatsPanelProps {
  stats: SimulationStats
  isLoading: boolean
}

export function StatsPanel({ stats, isLoading }: StatsPanelProps) {
  const statItems = [
    { icon: MessageSquare, label: 'Posts', value: stats.totalPosts + stats.totalComments, color: 'text-miro-teal', bgColor: 'bg-miro-teal/20' },
    { icon: TrendingUp, label: 'Sentiment', value: stats.avgSentiment > 0 ? `+${(stats.avgSentiment * 100).toFixed(0)}%` : `${(stats.avgSentiment * 100).toFixed(0)}%`, color: stats.avgSentiment >= 0 ? 'text-green-400' : 'text-amber-400', bgColor: stats.avgSentiment >= 0 ? 'bg-green-400/20' : 'bg-amber-400/20' },
    { icon: Target, label: 'Consensus', value: `${(stats.convergenceRate * 100).toFixed(0)}%`, color: 'text-miro-glow', bgColor: 'bg-miro-glow/20' },
    { icon: Link2, label: 'Connections', value: stats.connectionsFormed, color: 'text-purple-400', bgColor: 'bg-purple-400/20' },
    { icon: Heart, label: 'Viral', value: stats.viralPosts, color: 'text-pink-400', bgColor: 'bg-pink-400/20' },
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
      {statItems.map((item, index) => (
        <div key={item.label} className="glass-panel rounded-lg sm:rounded-xl p-2.5 sm:p-4 glow-border" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg ${item.bgColor} flex items-center justify-center shrink-0`}>
              <item.icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${item.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-white truncate">
                {isLoading ? <span className="inline-block w-6 sm:w-8 h-4 sm:h-6 bg-white/10 rounded animate-pulse" /> : item.value}
              </p>
              <p className="text-xs text-gray-400 truncate">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
