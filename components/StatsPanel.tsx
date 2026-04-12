'use client'

import { SimulationStats } from '@/types/simulation'
import { Users, MessageSquare, TrendingUp, Target, Brain } from 'lucide-react'

interface StatsPanelProps {
  stats: SimulationStats
  isLoading: boolean
}

export function StatsPanel({ stats, isLoading }: StatsPanelProps) {
  const statItems = [
    {
      icon: Users,
      label: 'Total Agents',
      value: stats.totalAgents,
      color: 'text-miro-accent',
      bgColor: 'bg-miro-accent/20',
    },
    {
      icon: MessageSquare,
      label: 'Active Interactions',
      value: stats.activeInteractions,
      color: 'text-miro-teal',
      bgColor: 'bg-miro-teal/20',
    },
    {
      icon: TrendingUp,
      label: 'Avg Sentiment',
      value: stats.avgSentiment > 0 ? `+${(stats.avgSentiment * 100).toFixed(0)}%` : `${(stats.avgSentiment * 100).toFixed(0)}%`,
      color: stats.avgSentiment >= 0 ? 'text-miro-teal' : 'text-miro-amber',
      bgColor: stats.avgSentiment >= 0 ? 'bg-miro-teal/20' : 'bg-miro-amber/20',
    },
    {
      icon: Target,
      label: 'Convergence Rate',
      value: `${(stats.convergenceRate * 100).toFixed(0)}%`,
      color: 'text-miro-glow',
      bgColor: 'bg-miro-glow/20',
    },
    {
      icon: Brain,
      label: 'Prediction Confidence',
      value: `${(stats.predictionConfidence * 100).toFixed(0)}%`,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className="glass-panel rounded-xl p-4 glow-border"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {isLoading ? (
                  <span className="inline-block w-8 h-6 bg-white/10 rounded animate-pulse" />
                ) : (
                  item.value
                )}
              </p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
