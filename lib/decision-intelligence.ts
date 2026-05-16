import type {
  SimulationAgent,
  SimulationEvent,
  SimulationPost,
  SimulationProgressState,
  SimulationScenario,
} from '../types/simulation'

export type DecisionStageId = 'intake' | 'mapping' | 'simulation' | 'synthesis' | 'interaction'
export type DecisionStageStatus = 'waiting' | 'active' | 'complete' | 'failed'

export interface DecisionStage {
  id: DecisionStageId
  label: string
  shortLabel: string
  description: string
  status: DecisionStageStatus
  metric: string
}

export interface DecisionGraphNode {
  id: string
  label: string
  type: 'scenario' | 'platform' | 'focus' | 'agent' | 'event' | 'cohort'
  sentiment: number
  influence: number
  x: number
  y: number
  radius: number
  detail: string
}

export interface DecisionGraphEdge {
  id: string
  source: string
  target: string
  label: string
  strength: number
  tone: 'neutral' | 'supportive' | 'critical' | 'signal'
}

export interface DecisionGraphModel {
  nodes: DecisionGraphNode[]
  edges: DecisionGraphEdge[]
  legend: Array<{ type: DecisionGraphNode['type']; label: string }>
}

export interface StakeholderCohort {
  id: 'supportive' | 'critical' | 'neutral' | 'high-influence'
  label: string
  description: string
  count: number
  averageSentiment: number
  averageInfluence: number
  topAgents: Array<Pick<SimulationAgent, 'id' | 'name' | 'role' | 'sentiment' | 'influence' | 'stance'>>
}

export interface ChannelReadout {
  id: 'twitter' | 'reddit'
  label: string
  description: string
  currentRound: number
  totalRounds: number
  actions: number
  posts: number
  events: number
  sentiment: number
  topPost?: {
    author: string
    content: string
    engagement: number
  }
}

export interface DecisionConsoleLine {
  id: string
  time: string
  stage: DecisionStageId
  message: string
}

export interface DecisionReportSection {
  id: string
  title: string
  body: string
  items: string[]
}

export interface InterventionCard {
  id: string
  title: string
  owner: string
  expectedEffect: string
  watchMetric: string
}

export interface DecisionSignal {
  id: string
  label: string
  value: string
  description: string
  tone: 'good' | 'watch' | 'risk' | 'neutral'
}

export interface DecisionWorkbenchModel {
  stages: DecisionStage[]
  graph: DecisionGraphModel
  cohorts: StakeholderCohort[]
  channelReadouts: ChannelReadout[]
  consoleLines: DecisionConsoleLine[]
  reportSections: DecisionReportSection[]
  interventions: InterventionCard[]
  signals: DecisionSignal[]
}

const STAGE_COPY: Record<DecisionStageId, Omit<DecisionStage, 'status' | 'metric'>> = {
  intake: {
    id: 'intake',
    label: 'Decision brief',
    shortLabel: 'Brief',
    description: 'Question, seed material, and decision boundary.',
  },
  mapping: {
    id: 'mapping',
    label: 'Reality map',
    shortLabel: 'Map',
    description: 'Stakeholders, platforms, pressure points, and initial beliefs.',
  },
  simulation: {
    id: 'simulation',
    label: 'Swarm run',
    shortLabel: 'Run',
    description: 'Agent actions, conversation loops, and sentiment movement.',
  },
  synthesis: {
    id: 'synthesis',
    label: 'Decision report',
    shortLabel: 'Report',
    description: 'Verdict, evidence, risks, and recommended interventions.',
  },
  interaction: {
    id: 'interaction',
    label: 'Interrogate',
    shortLabel: 'Ask',
    description: 'Follow-up questions for agents and the report layer.',
  },
}

const STAGE_ORDER: DecisionStageId[] = ['intake', 'mapping', 'simulation', 'synthesis', 'interaction']

export function getDecisionStageStatus(
  stage: DecisionStageId,
  scenario: SimulationScenario | null | undefined
): DecisionStageStatus {
  if (!scenario) {
    return stage === 'intake' ? 'active' : 'waiting'
  }

  if (scenario.status === 'failed') {
    if (stage === 'intake' || stage === 'mapping') {
      return 'complete'
    }
    return stage === 'simulation' ? 'failed' : 'waiting'
  }

  if (scenario.status === 'completed') {
    return stage === 'interaction' ? 'active' : 'complete'
  }

  const progressStage = scenario.progress?.stage ?? (scenario.status === 'pending' ? 'queued' : 'running')

  if (stage === 'intake') {
    return 'complete'
  }

  if (stage === 'mapping') {
    return progressStage === 'queued' || progressStage === 'initializing' ? 'active' : 'complete'
  }

  if (stage === 'simulation') {
    if (progressStage === 'queued' || progressStage === 'initializing') {
      return 'waiting'
    }
    return progressStage === 'analyzing' || progressStage === 'persisting' ? 'complete' : 'active'
  }

  if (stage === 'synthesis') {
    if (progressStage === 'analyzing' || progressStage === 'persisting') {
      return 'active'
    }
    return 'waiting'
  }

  return 'waiting'
}

export function summarizeStakeholderCohorts(agents: SimulationAgent[]): StakeholderCohort[] {
  const supportive = agents.filter((agent) => isSupportive(agent))
  const critical = agents.filter((agent) => isCritical(agent))
  const neutral = agents.filter((agent) => !isSupportive(agent) && !isCritical(agent))
  const highInfluence = [...agents]
    .sort((a, b) => b.influence - a.influence)
    .slice(0, Math.min(6, agents.length))

  return [
    buildCohort(
      'supportive',
      'Supportive coalition',
      'Agents likely to defend or amplify the decision.',
      supportive,
      (agent) => agent.sentiment * 0.7 + agent.influence * 0.3
    ),
    buildCohort(
      'critical',
      'Resistance front',
      'Agents most likely to challenge the decision or organize backlash.',
      critical,
      (agent) => Math.abs(agent.sentiment) * 0.6 + agent.influence * 0.4
    ),
    buildCohort(
      'neutral',
      'Persuadable middle',
      'Agents whose position can still move with evidence or framing.',
      neutral,
      (agent) => agent.influence
    ),
    buildCohort(
      'high-influence',
      'High-leverage voices',
      'Agents with outsized ability to move the conversation.',
      highInfluence,
      (agent) => agent.influence
    ),
  ]
}

export function buildDecisionWorkbench(
  scenario: SimulationScenario | null | undefined
): DecisionWorkbenchModel {
  const stages = STAGE_ORDER.map((id) => ({
    ...STAGE_COPY[id],
    status: getDecisionStageStatus(id, scenario),
    metric: getStageMetric(id, scenario),
  }))

  const results = scenario?.results
  const cohorts = summarizeStakeholderCohorts(results?.agents ?? [])

  return {
    stages,
    graph: buildGraph(scenario, cohorts),
    cohorts,
    channelReadouts: buildChannelReadouts(scenario),
    consoleLines: buildConsoleLines(scenario, stages),
    reportSections: buildReportSections(scenario),
    interventions: buildInterventions(scenario, cohorts),
    signals: buildDecisionSignals(scenario, cohorts),
  }
}

function isSupportive(agent: SimulationAgent) {
  return agent.stance.includes('for') || agent.sentiment > 0.25
}

function isCritical(agent: SimulationAgent) {
  return agent.stance.includes('against') || agent.sentiment < -0.25
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildCohort(
  id: StakeholderCohort['id'],
  label: string,
  description: string,
  agents: SimulationAgent[],
  score: (agent: SimulationAgent) => number
): StakeholderCohort {
  const sortedAgents = [...agents]
    .sort((a, b) => score(b) - score(a))
    .slice(0, 5)
    .map(({ id: agentId, name, role, sentiment, influence, stance }) => ({
      id: agentId,
      name,
      role,
      sentiment,
      influence,
      stance,
    }))

  return {
    id,
    label,
    description,
    count: agents.length,
    averageSentiment: average(agents.map((agent) => agent.sentiment)),
    averageInfluence: average(agents.map((agent) => agent.influence)),
    topAgents: sortedAgents,
  }
}

function getStageMetric(id: DecisionStageId, scenario: SimulationScenario | null | undefined) {
  if (!scenario) {
    return id === 'intake' ? 'Ready' : 'Waiting'
  }

  const results = scenario.results
  switch (id) {
    case 'intake':
      return scenario.seedText || scenario.uploadedFile ? 'Grounded' : 'Prompt only'
    case 'mapping':
      return results ? `${results.agents.length} agents` : scenario.progress?.message ?? 'Mapping'
    case 'simulation':
      return results
        ? `${results.rounds.length} rounds`
        : formatRoundProgress(scenario.progress, scenario.parameters.simulationRounds)
    case 'synthesis':
      return results?.report ? 'Report ready' : scenario.progress?.stage === 'analyzing' ? 'Analyzing' : 'Waiting'
    case 'interaction':
      return results ? 'Open' : 'Locked'
  }
}

function formatRoundProgress(progress: SimulationProgressState | undefined, fallbackRounds: number) {
  const current = progress?.currentRound ?? 0
  const total = progress?.totalRounds ?? fallbackRounds
  return `${current}/${total} rounds`
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1).trim()}...`
}

function buildGraph(
  scenario: SimulationScenario | null | undefined,
  cohorts: StakeholderCohort[]
): DecisionGraphModel {
  const nodes: DecisionGraphNode[] = []
  const edges: DecisionGraphEdge[] = []
  const results = scenario?.results
  const focusAreas = results?.brief?.focusAreas ?? scenario?.project?.focusAreas ?? extractFocusAreas(scenario)

  nodes.push({
    id: 'scenario',
    label: scenario?.title ?? 'New decision',
    type: 'scenario',
    sentiment: 0,
    influence: 1,
    x: 50,
    y: 50,
    radius: 34,
    detail: scenario?.description ?? 'Define the decision to simulate.',
  })

  const platforms = results?.brief?.platforms ?? scenario?.project?.platforms ?? ['twitter', 'reddit']
  platforms.forEach((platform, index) => {
    const id = `platform-${platform}`
    nodes.push({
      id,
      label: platform === 'twitter' ? 'Info stream' : 'Deep forum',
      type: 'platform',
      sentiment: getPlatformSentiment(results?.posts ?? [], platform),
      influence: 0.7,
      x: 22 + index * 56,
      y: 22,
      radius: 24,
      detail:
        platform === 'twitter'
          ? 'Fast, public, amplification-heavy reactions.'
          : 'Threaded debate where objections become detailed.',
    })
    edges.push({
      id: `scenario-${id}`,
      source: 'scenario',
      target: id,
      label: 'observes',
      strength: 0.65,
      tone: 'neutral',
    })
  })

  focusAreas.slice(0, 5).forEach((focus, index) => {
    const id = `focus-${slug(focus)}`
    nodes.push({
      id,
      label: focus,
      type: 'focus',
      sentiment: 0,
      influence: 0.58,
      x: 16 + index * 17,
      y: 80,
      radius: 18,
      detail: `A tracked pressure point in this decision: ${focus}.`,
    })
    edges.push({
      id: `scenario-${id}`,
      source: 'scenario',
      target: id,
      label: 'pressure',
      strength: 0.45,
      tone: 'signal',
    })
  })

  if (!results) {
    cohortsFromScenarioText(scenario).forEach((cohort, index) => {
      nodes.push({
        id: `cohort-${slug(cohort)}`,
        label: cohort,
        type: 'cohort',
        sentiment: 0,
        influence: 0.5,
        x: 28 + index * 24,
        y: 58,
        radius: 20,
        detail: 'A stakeholder group inferred from the decision brief.',
      })
      edges.push({
        id: `scenario-cohort-${index}`,
        source: 'scenario',
        target: `cohort-${slug(cohort)}`,
        label: 'tests',
        strength: 0.35,
        tone: 'neutral',
      })
    })
  } else {
    const topAgents = [...results.agents]
      .sort((a, b) => b.influence - a.influence)
      .slice(0, 14)

    topAgents.forEach((agent, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(topAgents.length, 1)
      const distance = 31 + (index % 3) * 8
      nodes.push({
        id: agent.id,
        label: agent.name,
        type: 'agent',
        sentiment: agent.sentiment,
        influence: agent.influence,
        x: 50 + Math.cos(angle) * distance,
        y: 50 + Math.sin(angle) * distance,
        radius: 14 + agent.influence * 12,
        detail: `${agent.role}. ${agent.motivations}`,
      })
      edges.push({
        id: `scenario-${agent.id}`,
        source: 'scenario',
        target: agent.id,
        label: agent.stance.replace(/_/g, ' '),
        strength: 0.3 + agent.influence * 0.4,
        tone: agent.sentiment < -0.25 ? 'critical' : agent.sentiment > 0.25 ? 'supportive' : 'neutral',
      })
    })

    topAgents.forEach((agent) => {
      agent.connections
        .filter((connectionId) => topAgents.some((candidate) => candidate.id === connectionId))
        .forEach((connectionId) => {
          edges.push({
            id: `${agent.id}-${connectionId}`,
            source: agent.id,
            target: connectionId,
            label: 'influences',
            strength: 0.42,
            tone: 'signal',
          })
        })
    })

    results.events
      .filter((event) => event.impact >= 0.65)
      .slice(0, 4)
      .forEach((event, index) => {
        const id = `event-${slug(event.id)}`
        nodes.push({
          id,
          label: event.type.replace(/_/g, ' '),
          type: 'event',
          sentiment: event.type === 'conflict' ? -0.6 : event.type === 'consensus' ? 0.45 : 0,
          influence: event.impact,
          x: 80,
          y: 32 + index * 14,
          radius: 15 + event.impact * 8,
          detail: event.description,
        })
        edges.push({
          id: `event-edge-${event.id}`,
          source: event.agentsInvolved[0] ?? 'scenario',
          target: id,
          label: 'triggered',
          strength: event.impact,
          tone: event.type === 'conflict' ? 'critical' : 'signal',
        })
      })
  }

  return {
    nodes,
    edges: dedupeEdges(edges),
    legend: [
      { type: 'scenario', label: 'Decision' },
      { type: 'platform', label: 'Channels' },
      { type: 'focus', label: 'Pressure points' },
      { type: 'agent', label: 'Stakeholders' },
      { type: 'event', label: 'Emergent events' },
      { type: 'cohort', label: 'Inferred cohorts' },
    ],
  }
}

function dedupeEdges(edges: DecisionGraphEdge[]) {
  const seen = new Set<string>()
  return edges.filter((edge) => {
    const key = `${edge.source}:${edge.target}:${edge.label}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function extractFocusAreas(scenario: SimulationScenario | null | undefined) {
  const text = `${scenario?.title ?? ''} ${scenario?.description ?? ''}`
  const candidates = [
    ['pricing', 'pricing risk'],
    ['policy', 'policy response'],
    ['customer', 'customer trust'],
    ['investor', 'investor sentiment'],
    ['competitor', 'competitive reaction'],
    ['launch', 'launch narrative'],
    ['brand', 'brand trust'],
    ['regulation', 'regulatory scrutiny'],
  ] as const

  const matches = candidates
    .filter(([needle]) => text.toLowerCase().includes(needle))
    .map(([, label]) => label)

  return matches.length > 0 ? matches : ['stakeholder trust', 'narrative control']
}

function cohortsFromScenarioText(scenario: SimulationScenario | null | undefined) {
  const text = `${scenario?.title ?? ''} ${scenario?.description ?? ''}`.toLowerCase()
  const defaults = ['Decision makers', 'Affected customers', 'Public critics']
  const inferred = [
    text.includes('investor') ? 'Investors' : undefined,
    text.includes('competitor') ? 'Competitors' : undefined,
    text.includes('employee') ? 'Employees' : undefined,
    text.includes('policy') ? 'Regulators' : undefined,
    text.includes('customer') ? 'Customers' : undefined,
  ].filter((value): value is string => Boolean(value))

  return inferred.length > 0 ? inferred.slice(0, 4) : defaults
}

function getPlatformSentiment(posts: SimulationPost[], platform: 'twitter' | 'reddit') {
  const platformPosts = posts.filter((post) => post.platform === platform)
  return average(platformPosts.map((post) => post.sentiment))
}

function buildChannelReadouts(scenario: SimulationScenario | null | undefined): ChannelReadout[] {
  const results = scenario?.results
  const currentRound = scenario?.progress?.currentRound ?? results?.rounds.length ?? 0
  const totalRounds = scenario?.progress?.totalRounds ?? scenario?.parameters.simulationRounds ?? results?.rounds.length ?? 0

  return (['twitter', 'reddit'] as const).map((platform) => {
    const posts = results?.posts.filter((post) => post.platform === platform) ?? []
    const postIds = new Set(posts.map((post) => post.id))
    const events = results?.events.filter((event) => event.relatedPostId && postIds.has(event.relatedPostId)) ?? []
    const actions = results?.rounds.reduce((sum, round) => {
      return sum + round.actions.filter((action) => {
        if (!action.targetPostId) {
          return false
        }
        return postIds.has(action.targetPostId)
      }).length
    }, 0) ?? scenario?.progress?.postsCount ?? 0
    const topPost = posts.sort((a, b) => b.engagement - a.engagement)[0]

    return {
      id: platform,
      label: platform === 'twitter' ? 'Info stream' : 'Deep forum',
      description:
        platform === 'twitter'
          ? 'Fast public reactions, quote cascades, and narrative spread.'
          : 'Longer objections, evidence requests, and coalition formation.',
      currentRound,
      totalRounds,
      actions,
      posts: posts.length,
      events: events.length,
      sentiment: getPlatformSentiment(posts, platform),
      topPost: topPost
        ? {
            author: topPost.agentName,
            content: truncate(topPost.content, 150),
            engagement: topPost.engagement,
          }
        : undefined,
    }
  })
}

function buildConsoleLines(
  scenario: SimulationScenario | null | undefined,
  stages: DecisionStage[]
): DecisionConsoleLine[] {
  const baseTime = scenario?.updatedAt ?? new Date()
  const lines: DecisionConsoleLine[] = []

  if (!scenario) {
    return [
      {
        id: 'console-ready',
        time: formatTime(new Date()),
        stage: 'intake',
        message: 'Decision workbench ready for a new brief',
      },
    ]
  }

  lines.push({
    id: 'console-intake',
    time: formatTime(scenario.createdAt),
    stage: 'intake',
    message: scenario.seedText || scenario.uploadedFile ? 'Grounded decision brief accepted' : 'Prompt-only decision brief accepted',
  })

  stages
    .filter((stage) => stage.status === 'complete' || stage.status === 'active' || stage.status === 'failed')
    .forEach((stage) => {
      if (stage.id === 'intake') {
        return
      }
      lines.push({
        id: `console-${stage.id}`,
        time: formatTime(baseTime),
        stage: stage.id,
        message: `${stage.label}: ${stage.status}`,
      })
    })

  if (scenario.progress?.message) {
    lines.push({
      id: 'console-progress',
      time: formatTime(new Date(scenario.progress.updatedAt)),
      stage: progressToStage(scenario.progress.stage),
      message: scenario.progress.message,
    })
  }

  if (scenario.results) {
    lines.push({
      id: 'console-results',
      time: formatTime(scenario.updatedAt),
      stage: 'synthesis',
      message: `Report synthesized from ${scenario.results.posts.length} posts and ${scenario.results.events.length} events`,
    })
    lines.push({
      id: 'console-interaction',
      time: formatTime(scenario.updatedAt),
      stage: 'interaction',
      message: 'Interaction layer ready for follow-up questions',
    })
  }

  return lines
}

function progressToStage(stage: SimulationProgressState['stage']): DecisionStageId {
  if (stage === 'queued' || stage === 'initializing') {
    return 'mapping'
  }
  if (stage === 'analyzing' || stage === 'persisting' || stage === 'completed') {
    return 'synthesis'
  }
  return 'simulation'
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function buildReportSections(scenario: SimulationScenario | null | undefined): DecisionReportSection[] {
  const report = scenario?.results?.report ?? scenario?.project?.reportSnapshot

  if (!report) {
    return [
      {
        id: 'pending-report',
        title: 'Report pending',
        body: scenario?.progress?.message ?? 'Run the simulation to produce a decision report.',
        items: [],
      },
    ]
  }

  return [
    {
      id: 'executive-verdict',
      title: 'Executive verdict',
      body: report.executiveVerdict,
      items: [],
    },
    {
      id: 'key-drivers',
      title: 'Key drivers',
      body: 'The forces that explain why the swarm moved the way it did.',
      items: report.keyDrivers,
    },
    {
      id: 'audience-signals',
      title: 'Audience signals',
      body: 'Specific stakeholder reactions to monitor before committing.',
      items: report.audienceSignals,
    },
    {
      id: 'platform-readout',
      title: 'Platform readout',
      body: 'Where narratives spread quickly versus where objections become durable.',
      items: [report.platformReadout.twitter, report.platformReadout.reddit],
    },
    {
      id: 'watch-signals',
      title: 'Watch signals',
      body: 'Early indicators that should change timing, framing, or rollout scope.',
      items: report.watchSignals,
    },
  ]
}

function buildInterventions(
  scenario: SimulationScenario | null | undefined,
  cohorts: StakeholderCohort[]
): InterventionCard[] {
  const reportIdeas = scenario?.results?.report?.interventionIdeas ?? scenario?.project?.reportSnapshot?.interventionIdeas

  if (reportIdeas?.length) {
    return reportIdeas.slice(0, 4).map((idea, index) => ({
      id: `intervention-${index + 1}`,
      title: idea,
      owner: index === 0 ? 'Decision team' : index === 1 ? 'Comms lead' : 'Operator',
      expectedEffect: 'Reduce uncertainty before the next narrative cascade.',
      watchMetric: scenario?.results?.report?.watchSignals[index] ?? 'Shift in critical cohort sentiment',
    }))
  }

  const critical = cohorts.find((cohort) => cohort.id === 'critical')
  return [
    {
      id: 'intervention-proof',
      title: 'Pre-brief the highest-risk stakeholder group',
      owner: 'Decision team',
      expectedEffect: 'Lower surprise and force objections into concrete evidence requests.',
      watchMetric: critical?.topAgents[0]?.name
        ? `${critical.topAgents[0].name} sentiment shift`
        : 'Critical cohort sentiment shift',
    },
    {
      id: 'intervention-counterfactual',
      title: 'Run a counterfactual with a narrower rollout',
      owner: 'Strategy',
      expectedEffect: 'Separate objections to the decision from objections to timing.',
      watchMetric: 'Difference in negative-post share',
    },
  ]
}

function buildDecisionSignals(
  scenario: SimulationScenario | null | undefined,
  cohorts: StakeholderCohort[]
): DecisionSignal[] {
  const results = scenario?.results
  const critical = cohorts.find((cohort) => cohort.id === 'critical')
  const supportive = cohorts.find((cohort) => cohort.id === 'supportive')
  const neutral = cohorts.find((cohort) => cohort.id === 'neutral')
  const avgSentiment = results ? average(results.agents.map((agent) => agent.sentiment)) : 0
  const confidence = results
    ? Math.max(0, Math.min(1, 1 - average(results.agents.map((agent) => Math.abs(agent.sentiment - avgSentiment)))))
    : 0

  return [
    {
      id: 'risk-pressure',
      label: 'Resistance pressure',
      value: critical ? String(critical.count) : '0',
      description: 'Critical agents with enough motive to create friction.',
      tone: critical && critical.count > (supportive?.count ?? 0) ? 'risk' : 'watch',
    },
    {
      id: 'persuadable-middle',
      label: 'Persuadable middle',
      value: neutral ? String(neutral.count) : '0',
      description: 'Agents likely to move with evidence, sequencing, or framing.',
      tone: neutral && neutral.count > 0 ? 'good' : 'neutral',
    },
    {
      id: 'confidence',
      label: 'Pattern confidence',
      value: results ? `${Math.round(confidence * 100)}%` : 'Pending',
      description: 'How coherent the final agent belief pattern became.',
      tone: confidence > 0.72 ? 'good' : confidence > 0.45 ? 'watch' : 'neutral',
    },
  ]
}
