'use client'

import { SimulationStats } from '@/types/simulation'
import { MessageSquare, TrendingUp, Target, Link2, Heart } from 'lucide-react'

interface StatsPanelProps {
  stats: SimulationStats
  isLoading: boolean
}

export function StatsPanel({ stats, isLoading }: StatsPanelProps) {
  const statItems = [
    {
      icon: MessageSquare,
      label: 'Posts + comments',
      value: stats.totalPosts + stats.totalComments,
      color: 'text-miro-teal',
      bgColor: 'bg-miro-teal/15',
    },
    {
      icon: TrendingUp,
      label: 'Average sentiment',
      value: stats.avgSentiment > 0 ? `+${(stats.avgSentiment * 100).toFixed(0)}%` : `${(stats.avgSentiment * 100).toFixed(0)}%`,
      color: stats.avgSentiment >= 0 ? 'text-miro-accent' : 'text-miro-amber',
      bgColor: stats.avgSentiment >= 0 ? 'bg-miro-accent/15' : 'bg-miro-amber/15',
    },
    {
      icon: Target,
      label: 'Consensus signal',
      value: `${(stats.convergenceRate * 100).toFixed(0)}%`,
      color: 'text-miro-glow',
      bgColor: 'bg-miro-glow/15',
    },
    {
      icon: Link2,
      label: 'New ties',
      value: stats.connectionsFormed,
      color: 'text-miro-accent',
      bgColor: 'bg-miro-accent/15',
    },
    {
      icon: Heart,
      label: 'Viral moments',
      value: stats.viralPosts,
      color: 'text-miro-amber',
      bgColor: 'bg-miro-amber/15',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className="glass-panel mesh-card rounded-[24px] p-4 sm:p-5 glow-border"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <div className="metric-sheen animate-shimmer absolute inset-0 opacity-20" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
              <p className="text-3xl font-semibold tracking-tight text-white">
                {isLoading ? <span className="inline-block h-7 w-20 animate-pulse rounded-full bg-white/10" /> : item.value}
              </p>
              <p className="text-sm text-slate-400">
                {item.label === 'Consensus signal'
                  ? 'Measures how aligned the swarm became'
                  : item.label === 'Average sentiment'
                  ? 'Net direction across all agents'
                  : 'Captured from this simulation run'}
              </p>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.bgColor}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
