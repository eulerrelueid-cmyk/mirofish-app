'use client'

import { Activity, Heart, Link2, MessageSquare, Target, TrendingUp, Users } from 'lucide-react'

import { SimulationStats } from '@/types/simulation'

interface StatsPanelProps {
  stats: SimulationStats
  isLoading: boolean
}

export function StatsPanel({ stats, isLoading }: StatsPanelProps) {
  const statItems = [
    {
      icon: Users,
      label: 'Agents',
      value: stats.totalAgents,
      detail: 'Simulated voices in the run',
      color: 'text-miro-accent',
      bgColor: 'bg-miro-accent/15',
    },
    {
      icon: MessageSquare,
      label: 'Posts + comments',
      value: stats.totalPosts + stats.totalComments,
      detail: 'Total visible conversation volume',
      color: 'text-miro-teal',
      bgColor: 'bg-miro-teal/15',
    },
    {
      icon: Activity,
      label: 'Interactions',
      value: stats.activeInteractions,
      detail: 'Meaningful agent-to-agent events',
      color: 'text-miro-glow',
      bgColor: 'bg-miro-glow/15',
    },
    {
      icon: TrendingUp,
      label: 'Average sentiment',
      value:
        stats.avgSentiment > 0
          ? `+${(stats.avgSentiment * 100).toFixed(0)}%`
          : `${(stats.avgSentiment * 100).toFixed(0)}%`,
      detail: 'Net emotional direction',
      color: stats.avgSentiment >= 0 ? 'text-miro-accent' : 'text-miro-amber',
      bgColor: stats.avgSentiment >= 0 ? 'bg-miro-accent/15' : 'bg-miro-amber/15',
    },
    {
      icon: Target,
      label: 'Consensus signal',
      value: `${(stats.convergenceRate * 100).toFixed(0)}%`,
      detail: 'How aligned the swarm became',
      color: 'text-sky-300',
      bgColor: 'bg-sky-400/15',
    },
    {
      icon: Link2,
      label: 'New ties',
      value: stats.connectionsFormed,
      detail: 'Fresh links formed during the run',
      color: 'text-miro-accent',
      bgColor: 'bg-miro-accent/15',
    },
    {
      icon: Heart,
      label: 'Viral moments',
      value: stats.viralPosts,
      detail: 'High-engagement spikes',
      color: 'text-miro-amber',
      bgColor: 'bg-miro-amber/15',
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className="soft-panel mesh-card rounded-[26px] p-4 sm:p-5"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="metric-sheen animate-shimmer absolute inset-0 opacity-20" />
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {isLoading ? <span className="inline-block h-8 w-20 animate-pulse rounded-full bg-white/10" /> : item.value}
                </p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-400">{item.detail}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
