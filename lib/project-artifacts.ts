import type { SimulationWorldBrief } from '@/types/simulation'

interface BuildWorldBriefInput {
  title: string
  description: string
  seedText?: string
  sourceReference?: string
}

export function extractFocusAreas(value: string) {
  const stopWords = new Set([
    'about', 'across', 'after', 'against', 'among', 'around', 'because', 'before', 'between', 'could',
    'describe', 'during', 'focus', 'from', 'have', 'into', 'likely', 'public', 'should', 'their', 'there',
    'these', 'they', 'this', 'those', 'under', 'what', 'when', 'where', 'which', 'with', 'would', 'your',
    'over', 'will', 'want',
  ])

  const counts = new Map<string, number>()
  for (const token of value.toLowerCase().match(/[a-z][a-z-]{3,}/g) || []) {
    if (stopWords.has(token)) {
      continue
    }

    counts.set(token, (counts.get(token) || 0) + 1)
  }

  const focusAreas = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([token]) => token)

  return focusAreas.length > 0 ? focusAreas : ['sentiment', 'narrative', 'reaction']
}

export function buildSimulationWorldBrief(input: BuildWorldBriefInput): SimulationWorldBrief {
  const combinedText = `${input.title} ${input.description} ${input.seedText || ''}`

  return {
    premise: input.title,
    objective: input.description,
    sourceMode: input.sourceReference ? 'grounded_upload' : 'prompt_only',
    sourceReference: input.sourceReference,
    platforms: ['twitter', 'reddit'],
    focusAreas: extractFocusAreas(combinedText),
  }
}
