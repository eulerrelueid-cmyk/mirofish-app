'use client'

import { SimulationScenario } from '@/types/simulation'
import { FileText, Download, Share2, Sparkles, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface SimulationResultsProps {
  scenario: SimulationScenario
}

export function SimulationResults({ scenario }: SimulationResultsProps) {
  if (!scenario.results) return null

  return (
    <div className="glass-panel rounded-2xl p-6 glow-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-miro-teal to-miro-accent flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Simulation Results</h3>
            <p className="text-sm text-gray-400">{scenario.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 rounded-xl bg-miro-accent/10 border border-miro-accent/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-miro-accent mt-0.5" />
          <div>
            <h4 className="font-semibold text-miro-accent mb-1">Executive Summary</h4>
            <p className="text-gray-300 leading-relaxed">{scenario.results.summary}</p>
          </div>
        </div>
      </div>

      {/* Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenario.results.predictions.map((prediction, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-black/30 border border-white/5 hover:border-miro-teal/30 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-miro-teal/20 flex items-center justify-center flex-shrink-0">
                {prediction.includes('probability') || prediction.includes('%') ? (
                  <TrendingUp className="w-4 h-4 text-miro-teal" />
                ) : prediction.includes('Risk') || prediction.includes('risk') ? (
                  <AlertTriangle className="w-4 h-4 text-miro-amber" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-miro-accent" />
                )}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{prediction}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <span>Created: {scenario.createdAt.toLocaleString()}</span>
        <span className="w-1 h-1 rounded-full bg-gray-600" />
        <span>Agents: {scenario.parameters.agentCount}</span>
        <span className="w-1 h-1 rounded-full bg-gray-600" />
        <span>Rounds: {scenario.parameters.simulationRounds}</span>
        {scenario.uploadedFile && (
          <>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {scenario.uploadedFile.name}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
