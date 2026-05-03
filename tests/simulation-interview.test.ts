import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSimulationInterviewMessages } from '../lib/simulation-interview.ts'

test('buildSimulationInterviewMessages includes report, brief, posts, and events in the context payload', () => {
  const messages = buildSimulationInterviewMessages({
    question: 'What shifted the outcome?',
    source: {
      title: 'Pricing change',
      description: 'Will a premium pricing move trigger backlash?',
      project: {
        id: 'project_1',
        name: 'Pricing change',
        objective: 'Assess the reaction to a premium move',
        status: 'simulation_completed',
        sourceMode: 'prompt_only',
        focusAreas: ['pricing', 'trust'],
        platforms: ['twitter', 'reddit'],
        createdAt: new Date('2026-05-03T10:00:00.000Z'),
        updatedAt: new Date('2026-05-03T10:05:00.000Z'),
      },
      brief: {
        premise: 'Pricing change',
        objective: 'Assess the reaction to a premium move',
        sourceMode: 'prompt_only',
        platforms: ['twitter', 'reddit'],
        focusAreas: ['pricing', 'trust'],
      },
      summary: 'The run converged on cautious support.',
      predictions: ['Support holds if messaging stays premium and clear.'],
      report: {
        executiveVerdict: 'Premium framing worked, but trust stayed fragile.',
        keyDrivers: ['Enterprise voices normalized the increase.'],
        audienceSignals: ['Neutral observers watched for justification.'],
        platformReadout: {
          twitter: 'Fast narrative consolidation.',
          reddit: 'Longer skepticism cycle.',
        },
        interventionIdeas: ['Publish stronger economic rationale.'],
        watchSignals: ['Support weakens if rollout feels evasive.'],
      },
      posts: [
        {
          agentName: 'Ava',
          agentRole: 'Analyst',
          platform: 'twitter',
          round: 3,
          engagement: 12,
          content: 'The price increase reads as confidence if execution stays disciplined.',
        },
      ],
      events: [
        {
          type: 'consensus',
          round: 4,
          impact: 0.6,
          description: 'Neutral agents aligned behind the premium narrative.',
        },
      ],
    },
  })

  assert.equal(messages[0]?.role, 'system')
  assert.equal(messages[1]?.role, 'user')
  assert.match(messages[1]?.content || '', /Premium framing worked, but trust stayed fragile\./)
  assert.match(messages[1]?.content || '', /pricing, trust/)
  assert.match(messages[1]?.content || '', /Ava \| Analyst \| twitter \| round 3 \| engagement 12/)
  assert.match(messages[1]?.content || '', /consensus \| round 4 \| impact 0\.60/)
  assert.equal(messages[2]?.content, 'What shifted the outcome?')
})

test('buildSimulationInterviewMessages threads prior turns before the latest question', () => {
  const messages = buildSimulationInterviewMessages({
    question: 'What should leadership do next?',
    history: [
      {
        question: 'Who mattered most?',
        answer: 'Enterprise analysts shaped the final frame.',
      },
    ],
    source: {
      title: 'Pricing change',
      description: 'Will a premium pricing move trigger backlash?',
      summary: 'The run converged on cautious support.',
      predictions: [],
      posts: [],
      events: [],
    },
  })

  assert.equal(messages[2]?.role, 'user')
  assert.equal(messages[2]?.content, 'Who mattered most?')
  assert.equal(messages[3]?.role, 'assistant')
  assert.equal(messages[3]?.content, 'Enterprise analysts shaped the final frame.')
  assert.equal(messages[4]?.role, 'user')
  assert.equal(messages[4]?.content, 'What should leadership do next?')
})
