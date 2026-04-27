import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildScenarioFromPollResponse,
  getStaleScenarioMessage,
  getScenarioLifecycleStatus,
  isScenarioStale,
  mergeScenarioMetadata,
} from '../lib/simulation-contract.ts'

test('getScenarioLifecycleStatus keeps intermediate workflow stages in running state', () => {
  assert.equal(getScenarioLifecycleStatus('queued'), 'running')
  assert.equal(getScenarioLifecycleStatus('initializing'), 'running')
  assert.equal(getScenarioLifecycleStatus('running'), 'running')
  assert.equal(getScenarioLifecycleStatus('analyzing'), 'running')
  assert.equal(getScenarioLifecycleStatus('persisting'), 'running')
  assert.equal(getScenarioLifecycleStatus('completed'), 'completed')
  assert.equal(getScenarioLifecycleStatus('failed'), 'failed')
})

test('mergeScenarioMetadata preserves existing workflow metadata when later updates omit it', () => {
  const merged = mergeScenarioMetadata(
    {
      workflowRunId: 'run_123',
      mockMode: false,
      error: undefined,
      progress: {
        stage: 'queued',
        message: 'Queued',
        updatedAt: '2026-04-26T12:00:00.000Z',
      },
    },
    {
      progress: {
        stage: 'running',
        message: 'Round 3 complete',
        currentRound: 3,
        totalRounds: 12,
        updatedAt: '2026-04-26T12:01:00.000Z',
      },
    }
  )

  assert.equal(merged.workflowRunId, 'run_123')
  assert.equal(merged.mockMode, false)
  assert.equal(merged.progress?.currentRound, 3)
})

test('buildScenarioFromPollResponse keeps incomplete runs in running state', () => {
  const recentTimestamp = new Date().toISOString()
  const scenario = buildScenarioFromPollResponse(
    {
      scenario: {
        id: 'scenario_1',
        title: 'Queued run',
        description: 'Waiting for background worker',
        seed_text: 'seed text',
        status: 'initializing',
        created_at: recentTimestamp,
        updated_at: recentTimestamp,
        parameters: {
          agentCount: 15,
          simulationRounds: 12,
          temperature: 0.8,
        },
        results: {
          workflowRunId: 'run_123',
          mockMode: false,
          progress: {
            stage: 'running',
            message: 'Completed round 3 of 12',
            currentRound: 3,
            totalRounds: 12,
            postsCount: 9,
            eventsCount: 4,
            updatedAt: recentTimestamp,
          },
        },
      },
      results: {
        workflowRunId: 'run_123',
        mockMode: false,
        progress: {
          stage: 'running',
          message: 'Completed round 3 of 12',
          currentRound: 3,
          totalRounds: 12,
          postsCount: 9,
          eventsCount: 4,
          updatedAt: recentTimestamp,
        },
      },
    },
    {
      id: 'scenario_1',
      title: 'Queued run',
      description: 'Waiting for background worker',
      seedText: 'seed text',
      status: 'running',
      createdAt: new Date(recentTimestamp),
      updatedAt: new Date(recentTimestamp),
      parameters: {
        agentCount: 15,
        simulationRounds: 12,
        temperature: 0.8,
      },
    }
  )

  assert.equal(scenario.status, 'running')
  assert.equal(scenario.workflowRunId, 'run_123')
  assert.equal(scenario.progress?.currentRound, 3)
  assert.equal(scenario.results, undefined)
})

test('buildScenarioFromPollResponse normalizes completed payloads into final results', () => {
  const scenario = buildScenarioFromPollResponse({
    scenario: {
      id: 'scenario_2',
      title: 'Completed run',
      description: 'Finished background worker',
      status: 'completed',
      created_at: '2026-04-26T12:00:00.000Z',
      updated_at: '2026-04-26T12:02:00.000Z',
      parameters: {
        agentCount: 15,
        simulationRounds: 12,
        temperature: 0.8,
      },
      results: {
        workflowRunId: 'run_456',
        mockMode: true,
        summary: 'The swarm converged around a single narrative.',
        predictions: ['Backlash risk remains low.'],
        agents: [
          {
            id: 'agent_1',
            name: 'Ava',
            role: 'Analyst',
            personality: 'Calm',
            bio: 'Bio',
            stance: 'neutral',
            communicationStyle: 'Measured',
            expertise: ['Policy'],
            motivations: 'Learn',
            x: 0,
            y: 0,
            connections: [],
            state: 'idle',
            sentiment: 0.2,
            influence: 0.7,
          },
        ],
        posts: [
          {
            id: 'post_1',
            agentId: 'agent_1',
            agentName: 'Ava',
            agentRole: 'Analyst',
            content: 'A post',
            timestamp: '2026-04-26T12:00:30.000Z',
            round: 1,
            platform: 'twitter',
            likes: [],
            comments: [
              {
                id: 'comment_1',
                agentId: 'agent_1',
                agentName: 'Ava',
                content: 'A comment',
                timestamp: '2026-04-26T12:00:45.000Z',
                likes: [],
              },
            ],
            sentiment: 0.3,
            engagement: 3,
          },
        ],
        events: [
          {
            id: 'event_1',
            timestamp: '2026-04-26T12:01:00.000Z',
            type: 'interaction',
            description: 'An interaction happened',
            agentsInvolved: ['agent_1'],
            impact: 0.5,
            round: 1,
          },
        ],
        rounds: [
          {
            round: 1,
            timestamp: '2026-04-26T12:01:30.000Z',
            actions: [],
            sentimentChanges: [],
            newConnections: [],
          },
        ],
      },
    },
    results: {
      workflowRunId: 'run_456',
      mockMode: true,
      summary: 'The swarm converged around a single narrative.',
      predictions: ['Backlash risk remains low.'],
      agents: [
        {
          id: 'agent_1',
          name: 'Ava',
          role: 'Analyst',
          personality: 'Calm',
          bio: 'Bio',
          stance: 'neutral',
          communicationStyle: 'Measured',
          expertise: ['Policy'],
          motivations: 'Learn',
          x: 0,
          y: 0,
          connections: [],
          state: 'idle',
          sentiment: 0.2,
          influence: 0.7,
        },
      ],
      posts: [
        {
          id: 'post_1',
          agentId: 'agent_1',
          agentName: 'Ava',
          agentRole: 'Analyst',
          content: 'A post',
          timestamp: '2026-04-26T12:00:30.000Z',
          round: 1,
          platform: 'twitter',
          likes: [],
          comments: [
            {
              id: 'comment_1',
              agentId: 'agent_1',
              agentName: 'Ava',
              content: 'A comment',
              timestamp: '2026-04-26T12:00:45.000Z',
              likes: [],
            },
          ],
          sentiment: 0.3,
          engagement: 3,
        },
      ],
      events: [
        {
          id: 'event_1',
          timestamp: '2026-04-26T12:01:00.000Z',
          type: 'interaction',
          description: 'An interaction happened',
          agentsInvolved: ['agent_1'],
          impact: 0.5,
          round: 1,
        },
      ],
      rounds: [
        {
          round: 1,
          timestamp: '2026-04-26T12:01:30.000Z',
          actions: [],
          sentimentChanges: [],
          newConnections: [],
        },
      ],
    },
  })

  assert.equal(scenario.status, 'completed')
  assert.equal(scenario.mockMode, true)
  assert.ok(scenario.results)
  assert.equal(scenario.results?.summary, 'The swarm converged around a single narrative.')
  assert.ok(scenario.results?.posts[0].timestamp instanceof Date)
  assert.ok(scenario.results?.posts[0].comments[0].timestamp instanceof Date)
  assert.ok(scenario.results?.events[0].timestamp instanceof Date)
  assert.ok(scenario.results?.rounds[0].timestamp instanceof Date)
})

test('buildScenarioFromPollResponse does not claim completion when final result payload is missing', () => {
  const scenario = buildScenarioFromPollResponse({
    scenario: {
      id: 'scenario_3',
      title: 'Broken completed run',
      description: 'Scenario status flipped without final payload',
      status: 'completed',
      created_at: '2026-04-26T12:00:00.000Z',
      updated_at: '2026-04-26T12:03:00.000Z',
      parameters: {
        agentCount: 15,
        simulationRounds: 12,
        temperature: 0.8,
      },
      results: {
        workflowRunId: 'run_789',
        mockMode: false,
        progress: {
          stage: 'completed',
          message: 'Simulation complete',
          currentRound: 12,
          totalRounds: 12,
          updatedAt: '2026-04-26T12:03:00.000Z',
        },
      },
    },
    results: {
      workflowRunId: 'run_789',
      mockMode: false,
      progress: {
        stage: 'completed',
        message: 'Simulation complete',
        currentRound: 12,
        totalRounds: 12,
        updatedAt: '2026-04-26T12:03:00.000Z',
      },
    },
  })

  assert.equal(scenario.status, 'failed')
  assert.equal(scenario.results, undefined)
  assert.match(scenario.errorMessage || '', /missing final results/i)
})

test('isScenarioStale identifies running scenarios with no progress for more than six minutes', () => {
  const now = Date.parse('2026-04-26T12:10:00.000Z')
  assert.equal(isScenarioStale('running', '2026-04-26T12:03:59.000Z', now), true)
  assert.equal(isScenarioStale('running', '2026-04-26T12:05:00.000Z', now), false)
  assert.equal(isScenarioStale('completed', '2026-04-26T12:00:00.000Z', now), false)
})

test('buildScenarioFromPollResponse marks stale running scenarios as failed', () => {
  const scenario = buildScenarioFromPollResponse({
    scenario: {
      id: 'scenario_4',
      title: 'Stalled run',
      description: 'Workflow stopped making progress',
      status: 'running',
      created_at: '2026-04-26T12:00:00.000Z',
      updated_at: '2026-04-26T12:01:00.000Z',
      parameters: {
        agentCount: 15,
        simulationRounds: 12,
        temperature: 0.8,
      },
      results: {
        workflowRunId: 'run_stalled',
        progress: {
          stage: 'initializing',
          message: 'Generating agent personas',
          totalRounds: 12,
          updatedAt: '2026-04-26T12:01:00.000Z',
        },
      },
    },
    results: {
      workflowRunId: 'run_stalled',
      progress: {
        stage: 'initializing',
        message: 'Generating agent personas',
        totalRounds: 12,
        updatedAt: '2026-04-26T12:01:00.000Z',
      },
    },
  })

  assert.equal(scenario.status, 'failed')
  assert.equal(
    scenario.errorMessage,
    getStaleScenarioMessage('2026-04-26T12:01:00.000Z')
  )
})
