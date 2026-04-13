'use client'

import { SimulationScenario } from '@/types/simulation'
import { FileText, Download, Share2, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react'

interface SimulationResultsProps {
  scenario: SimulationScenario
}

export function SimulationResults({ scenario }: SimulationResultsProps) {
  if (!scenario.results) return null

  return (
    <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 glow-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-miro-teal to-miro-accent flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold truncate">Results</h3>
            <p className="text-xs sm:text-sm text-gray-400 truncate">{scenario.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-miro-accent/10 border border-miro-accent/20">
        <div className="flex items-start gap-2 sm:gap-3">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-miro-accent mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-miro-accent mb-1 text-sm sm:text-base">Executive Summary</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{scenario.results.summary}</p>
          </div>
        </div>
      </div>

      {/* Predictions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {scenario.results.predictions.map((prediction, index) => (
          <div key={index} className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-black/30 border border-white/5 hover:border-miro-teal/30 transition-all">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-miro-teal/20 flex items-center justify-center shrink-0">
                {prediction.toLowerCase().includes('risk') || prediction.toLowerCase().includes('concern') ? (
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-miro-amber" />
                ) : prediction.toLowerCase().includes('probability') || prediction.toLowerCase().includes('%') ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-miro-teal" />
                ) : (
                  <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 text-miro-accent" />
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{prediction}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
        <span>{scenario.results.agents.length} agents</span>
        <span className="w-1 h-1 rounded-full bg-gray-600" />
        <span>{scenario.results.posts.length} posts</span>
        <span className="w-1 h-1 rounded-full bg-gray-600" />
        <span>{scenario.results.rounds.length} rounds</span>
      </div>
    </div>
  )
}
