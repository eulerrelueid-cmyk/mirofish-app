import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDecisionWorkbench,
  getDecisionStageStatus,
  summarizeStakeholderCohorts,
} from '../lib/decision-intelligence.ts'
import type { SimulationScenario } from '../types/simulation.ts'

function buildCompletedScenario(): SimulationScenario {
  const createdAt = new Date('2026-05-15T10:00:00.000Z')

  return {
    id: 'scenario_decision_1',
    title: 'AI add-on pricing increase',
    description:
      'A SaaS company raises AI add-on pricing by 40 percent while competitors bundle similar features.',
    seedText: 'Customer interviews show finance teams are already questioning AI ROI.',
    status: 'completed',
    createdAt,
    updatedAt: new Date('2026-05-15T10:12:00.000Z'),
    parameters: {
      agentCount: 4,
      simulationRounds: 3,
      temperature: 0.8,
    },
    results: {
      agents: [
        {
          id: 'agent_customer',
          name: 'Priya Shah',
          role: 'Enterprise customer champion',
          personality: 'Pragmatic',
          bio: 'Runs adoption for a large customer.',
          stance: 'moderately_against',
          communicationStyle: 'Direct',
          expertise: ['Procurement', 'Customer success'],
          motivations: 'Avoid surprise renewal risk',
          x: 0,
          y: 0,
          connections: ['agent_sales'],
          state: 'idle',
          sentiment: -0.55,
          influence: 0.78,
        },
        {
          id: 'agent_sales',
          name: 'Marco Lee',
          role: 'Sales director',
          personality: 'Optimistic',
          bio: 'Owns commercial packaging.',
          stance: 'moderately_for',
          communicationStyle: 'Narrative-driven',
          expertise: ['Revenue', 'Enterprise sales'],
          motivations: 'Protect expansion revenue',
          x: 0,
          y: 0,
          connections: ['agent_customer', 'agent_finance'],
          state: 'idle',
          sentiment: 0.42,
          influence: 0.71,
        },
        {
          id: 'agent_finance',
          name: 'Avery Kim',
          role: 'CFO',
          personality: 'Conservative',
          bio: 'Evaluates pricing risk.',
          stance: 'neutral',
          communicationStyle: 'Numbers-first',
          expertise: ['Finance', 'Pricing'],
          motivations: 'Preserve margin without churn',
          x: 0,
          y: 0,
          connections: [],
          state: 'idle',
          sentiment: 0.05,
          influence: 0.66,
        },
        {
          id: 'agent_competitor',
          name: 'Nina Park',
          role: 'Competitor marketer',
          personality: 'Opportunistic',
          bio: 'Frames competitor narratives.',
          stance: 'strongly_against',
          communicationStyle: 'Sharp and public',
          expertise: ['Competitive positioning'],
          motivations: 'Exploit backlash',
          x: 0,
          y: 0,
          connections: ['agent_customer'],
          state: 'idle',
          sentiment: -0.82,
          influence: 0.59,
        },
      ],
      posts: [
        {
          id: 'post_customer',
          agentId: 'agent_customer',
          agentName: 'Priya Shah',
          agentRole: 'Enterprise customer champion',
          content: 'A 40 percent AI price hike needs proof of measurable workflow savings.',
          timestamp: new Date('2026-05-15T10:03:00.000Z'),
          round: 1,
          platform: 'reddit',
          likes: ['agent_finance'],
          comments: [],
          sentiment: -0.4,
          engagement: 8,
        },
        {
          id: 'post_sales',
          agentId: 'agent_sales',
          agentName: 'Marco Lee',
          agentRole: 'Sales director',
          content: 'The increase can work if it is paired with usage tiers and executive proof.',
          timestamp: new Date('2026-05-15T10:04:00.000Z'),
          round: 2,
          platform: 'twitter',
          likes: ['agent_finance'],
          comments: [],
          sentiment: 0.35,
          engagement: 4,
        },
      ],
      events: [
        {
          id: 'event_backlash',
          timestamp: new Date('2026-05-15T10:05:00.000Z'),
          type: 'conflict',
          description: 'Customer and competitor voices aligned around surprise-price backlash.',
          agentsInvolved: ['agent_customer', 'agent_competitor'],
          impact: 0.82,
          round: 2,
          relatedPostId: 'post_customer',
        },
      ],
      rounds: [
        {
          round: 1,
          timestamp: new Date('2026-05-15T10:03:00.000Z'),
          actions: [],
          sentimentChanges: [],
          newConnections: [{ from: 'agent_customer', to: 'agent_sales' }],
        },
        {
          round: 2,
          timestamp: new Date('2026-05-15T10:04:00.000Z'),
          actions: [],
          sentimentChanges: [],
          newConnections: [{ from: 'agent_sales', to: 'agent_finance' }],
        },
        {
          round: 3,
          timestamp: new Date('2026-05-15T10:05:00.000Z'),
          actions: [],
          sentimentChanges: [],
          newConnections: [],
        },
      ],
      summary: 'The pricing move is viable only if the company reduces surprise and proves ROI.',
      predictions: [
        'Backlash concentrates among procurement-led accounts.',
        'Usage-tier framing improves acceptance with finance stakeholders.',
      ],
      brief: {
        premise: 'AI add-on pricing increase',
        objective: 'Forecast stakeholder reaction before rollout.',
        sourceMode: 'grounded_upload',
        sourceReference: 'Customer interviews',
        platforms: ['twitter', 'reddit'],
        focusAreas: ['pricing risk', 'stakeholder trust'],
      },
      report: {
        executiveVerdict: 'Proceed only with phased pricing and ROI proof.',
        keyDrivers: ['Procurement teams treat surprise as a trust breach.'],
        audienceSignals: ['Finance remains persuadable if usage tiers are clear.'],
        platformReadout: {
          twitter: 'Short-form reactions amplify competitive framing.',
          reddit: 'Long-form discussion focuses on ROI evidence.',
        },
        interventionIdeas: ['Pre-brief top accounts with usage benchmarks.'],
        watchSignals: ['Competitor posts pairing price hike with lock-in claims.'],
      },
    },
  }
}

test('summarizeStakeholderCohorts groups agents into actionable stance cohorts', () => {
  const cohorts = summarizeStakeholderCohorts(buildCompletedScenario().results!.agents)

  assert.equal(cohorts.length, 4)
  assert.deepEqual(
    cohorts.map((cohort) => [cohort.id, cohort.count]),
    [
      ['supportive', 1],
      ['critical', 2],
      ['neutral', 1],
      ['high-influence', 4],
    ]
  )
  assert.equal(cohorts[1].topAgents[0].name, 'Nina Park')
  assert.equal(cohorts[3].averageInfluence > 0.6, true)
})

test('buildDecisionWorkbench turns completed runs into a staged decision workbench', () => {
  const model = buildDecisionWorkbench(buildCompletedScenario())

  assert.deepEqual(
    model.stages.map((stage) => [stage.id, stage.status]),
    [
      ['intake', 'complete'],
      ['mapping', 'complete'],
      ['simulation', 'complete'],
      ['synthesis', 'complete'],
      ['interaction', 'active'],
    ]
  )
  assert.equal(model.graph.nodes.some((node) => node.id === 'focus-pricing-risk'), true)
  assert.equal(model.graph.edges.some((edge) => edge.source === 'agent_customer' && edge.target === 'agent_sales'), true)
  assert.equal(model.channelReadouts.find((readout) => readout.id === 'reddit')?.events, 1)
  assert.equal(model.reportSections[0].title, 'Executive verdict')
  assert.equal(model.interventions[0].title, 'Pre-brief top accounts with usage benchmarks.')
  assert.equal(model.consoleLines.at(-1)?.message, 'Interaction layer ready for follow-up questions')
})

test('buildDecisionWorkbench exposes progress and partial stages for running simulations', () => {
  const scenario = buildCompletedScenario()
  scenario.status = 'running'
  scenario.results = undefined
  scenario.progress = {
    stage: 'running',
    message: 'Completed round 2 of 12',
    currentRound: 2,
    totalRounds: 12,
    postsCount: 5,
    eventsCount: 2,
    updatedAt: '2026-05-15T10:05:00.000Z',
  }

  const model = buildDecisionWorkbench(scenario)

  assert.equal(getDecisionStageStatus('simulation', scenario), 'active')
  assert.deepEqual(
    model.stages.map((stage) => [stage.id, stage.status]),
    [
      ['intake', 'complete'],
      ['mapping', 'complete'],
      ['simulation', 'active'],
      ['synthesis', 'waiting'],
      ['interaction', 'waiting'],
    ]
  )
  assert.equal(model.graph.nodes.some((node) => node.id === 'scenario'), true)
  assert.equal(model.channelReadouts[0].currentRound, 2)
  assert.equal(model.consoleLines.at(-1)?.message, 'Completed round 2 of 12')
})
