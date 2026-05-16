'use client'

import { useState } from 'react'
import { ArrowUpRight, Loader2, MessageSquare } from 'lucide-react'

import type { SimulationInterviewTurn, SimulationScenario } from '@/types/simulation'

interface SimulationInterviewPanelProps {
  scenario: SimulationScenario
}

const starterQuestions = [
  'Who mattered most in the outcome?',
  'What shifted sentiment the most?',
  'What should leadership do next?',
] as const

export function SimulationInterviewPanel({ scenario }: SimulationInterviewPanelProps) {
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState<SimulationInterviewTurn[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (scenario.status !== 'completed') {
    return null
  }

  async function submit(nextQuestion: string) {
    const trimmed = nextQuestion.trim()
    if (!trimmed || isLoading) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/simulate/${scenario.id}/interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: trimmed,
          history: turns.slice(-4),
        }),
      })

      const data = (await response.json()) as {
        answer?: string
        error?: string
      }

      if (!response.ok || !data.answer) {
        throw new Error(data.error || 'Failed to query the simulation.')
      }

      setTurns((previous) => [...previous, { question: trimmed, answer: data.answer! }])
      setQuestion('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query the simulation.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="df-panel">
      <div className="mb-4 flex items-center gap-3">
        <div className="df-icon-box">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <p className="df-kicker">Deep interaction</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Ask the run</h2>
          <p className="mt-1 text-sm text-slate-500">Query the completed simulation directly.</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {starterQuestions.map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => {
              setQuestion(starter)
              void submit(starter)
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            {starter}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about the outcome, key actors, risks, or next moves."
          rows={3}
          className="w-full resize-none bg-transparent text-sm leading-7 text-white placeholder:text-slate-500 focus:outline-none"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            disabled={isLoading || !question.trim()}
            onClick={() => void submit(question)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
            Ask
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {turns.length > 0 && (
        <div className="mt-4 space-y-3">
          {turns.map((turn, index) => (
            <div key={`${turn.question}-${index}`} className="df-card p-4">
              <p className="df-kicker">Question</p>
              <p className="mt-2 text-sm leading-7 text-white">{turn.question}</p>
              <p className="df-kicker mt-4">Answer</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{turn.answer}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
