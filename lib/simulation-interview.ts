import type {
  SimulationEvent,
  SimulationInterviewTurn,
  SimulationPost,
  SimulationProject,
  SimulationReport,
  SimulationWorldBrief,
} from '../types/simulation'

export interface SimulationInterviewMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface SimulationInterviewSource {
  title: string
  description: string
  project?: SimulationProject
  brief?: SimulationWorldBrief
  summary: string
  predictions: string[]
  report?: SimulationReport
  posts: Array<Pick<SimulationPost, 'agentName' | 'agentRole' | 'platform' | 'round' | 'engagement' | 'content'>>
  events: Array<Pick<SimulationEvent, 'type' | 'round' | 'impact' | 'description'>>
}

interface BuildSimulationInterviewMessagesInput {
  question: string
  history?: SimulationInterviewTurn[]
  source: SimulationInterviewSource
}

function joinLines(label: string, lines: string[]) {
  if (lines.length === 0) {
    return `${label}: none`
  }

  return `${label}:\n${lines.map((line) => `- ${line}`).join('\n')}`
}

function formatPosts(posts: SimulationInterviewSource['posts']) {
  return posts.slice(0, 6).map((post) =>
    `${post.agentName} | ${post.agentRole} | ${post.platform} | round ${post.round} | engagement ${post.engagement}\n${post.content}`
  )
}

function formatEvents(events: SimulationInterviewSource['events']) {
  return events.slice(0, 6).map((event) =>
    `${event.type} | round ${event.round} | impact ${event.impact.toFixed(2)}\n${event.description}`
  )
}

function buildContext(source: SimulationInterviewSource) {
  const sections = [
    `Scenario title: ${source.title}`,
    `Scenario description: ${source.description}`,
    source.project
      ? `Project: ${source.project.name}\nObjective: ${source.project.objective}\nFocus areas: ${source.project.focusAreas.join(', ') || 'none'}`
      : undefined,
    source.brief
      ? `World brief:\nPremise: ${source.brief.premise}\nObjective: ${source.brief.objective}\nPlatforms: ${source.brief.platforms.join(', ')}\nFocus areas: ${source.brief.focusAreas.join(', ')}`
      : undefined,
    `Summary:\n${source.summary}`,
    joinLines('Predictions', source.predictions),
    source.report
      ? [
          'Structured report:',
          `Executive verdict: ${source.report.executiveVerdict}`,
          joinLines('Key drivers', source.report.keyDrivers),
          joinLines('Audience signals', source.report.audienceSignals),
          `Platform readout:\n- Twitter: ${source.report.platformReadout.twitter}\n- Reddit: ${source.report.platformReadout.reddit}`,
          joinLines('Intervention ideas', source.report.interventionIdeas),
          joinLines('Watch signals', source.report.watchSignals),
        ].join('\n')
      : undefined,
    joinLines('Representative posts', formatPosts(source.posts)),
    joinLines('Representative events', formatEvents(source.events)),
  ]

  return sections.filter(Boolean).join('\n\n')
}

export function buildSimulationInterviewMessages(
  input: BuildSimulationInterviewMessagesInput
): SimulationInterviewMessage[] {
  const messages: SimulationInterviewMessage[] = [
    {
      role: 'system',
      content:
        'You are a simulation analyst. Answer only from the supplied simulation context. Be concrete, concise, and explicit about uncertainty. Do not invent facts not supported by the run.',
    },
    {
      role: 'user',
      content: buildContext(input.source),
    },
  ]

  for (const turn of input.history || []) {
    messages.push({
      role: 'user',
      content: turn.question,
    })
    messages.push({
      role: 'assistant',
      content: turn.answer,
    })
  }

  messages.push({
    role: 'user',
    content: input.question,
  })

  return messages
}
