import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildHistoryItemFromScenario,
  buildHistoryItemFromScenarioRow,
  buildHistoryItemsFromApi,
  upsertHistoryItem,
} from '../lib/simulation-history.ts'
import type { SimulationScenario } from '../types/simulation.ts'

test('buildHistoryItemFromScenarioRow returns compact counts and summary for completed runs', () => {
  const item = buildHistoryItemFromScenarioRow({
    id: 'scenario_completed',
    title: 'Completed run',
    description: 'A completed simulation',
    status: 'completed',
    created_at: '2026-04-26T12:00:00.000Z',
    updated_at: '2026-04-26T12:05:00.000Z',
    results: {
      workflowRunId: 'run_complete',
      mockMode: false,
      summary: 'A long summary about pricing and reaction dynamics in the market.',
      predictions: ['Prediction 1'],
      agents: [{ id: 'a1' }],
      posts: [{ id: 'p1' }, { id: 'p2' }],
      events: [{ id: 'e1' }],
      rounds: [{ round: 1 }, { round: 2 }],
      progress: {
        stage: 'completed',
        message: 'Simulation complete',
        currentRound: 2,
        totalRounds: 2,
        updatedAt: '2026-04-26T12:05:00.000Z',
      },
    },
  } as never)

  assert.equal(item.id, 'scenario_completed')
  assert.equal(item.status, 'completed')
  assert.equal(item.resultCounts?.agents, 1)
  assert.equal(item.resultCounts?.posts, 2)
  assert.equal(item.resultCounts?.events, 1)
  assert.equal(item.resultCounts?.rounds, 2)
  assert.match(item.summaryExcerpt || '', /pricing/i)
})

test('buildHistoryItemFromScenarioRow keeps in-progress runs selectable without result counts', () => {
  const item = buildHistoryItemFromScenarioRow({
    id: 'scenario_running',
    title: 'Running run',
    description: 'Still working',
    status: 'running',
    created_at: '2026-04-26T12:00:00.000Z',
    updated_at: new Date().toISOString(),
    results: {
      workflowRunId: 'run_running',
      progress: {
        stage: 'running',
        message: 'Completed round 4 of 12',
        currentRound: 4,
        totalRounds: 12,
        updatedAt: new Date().toISOString(),
      },
    },
  } as never)

  assert.equal(item.status, 'running')
  assert.equal(item.workflowRunId, 'run_running')
  assert.equal(item.resultCounts, null)
  assert.equal(item.progress?.currentRound, 4)
})

test('buildHistoryItemFromScenarioRow marks stale running runs as failed', () => {
  const item = buildHistoryItemFromScenarioRow(
    {
      id: 'scenario_stale',
      title: 'Stale run',
      description: 'Stopped moving',
      status: 'running',
      created_at: '2026-04-26T12:00:00.000Z',
      updated_at: '2026-04-26T12:01:00.000Z',
      results: {
        workflowRunId: 'run_stale',
        progress: {
          stage: 'initializing',
          message: 'Generating agent personas',
          totalRounds: 12,
          updatedAt: '2026-04-26T12:01:00.000Z',
        },
      },
    } as never,
    Date.parse('2026-04-26T12:10:00.000Z')
  )

  assert.equal(item.status, 'failed')
  assert.match(item.errorMessage || '', /stalled/i)
})

test('buildHistoryItemFromScenario converts active page state into a history row', () => {
  const scenario: SimulationScenario = {
    id: 'scenario_page',
    title: 'Page scenario',
    description: 'Current page state',
    status: 'running',
    createdAt: new Date('2026-04-26T12:00:00.000Z'),
    updatedAt: new Date('2026-04-26T12:02:00.000Z'),
    workflowRunId: 'run_page',
    parameters: {
      agentCount: 15,
      simulationRounds: 12,
      temperature: 0.8,
    },
    progress: {
      stage: 'running',
      message: 'Completed round 2 of 12',
      currentRound: 2,
      totalRounds: 12,
      updatedAt: '2026-04-26T12:02:00.000Z',
    },
  }

  const item = buildHistoryItemFromScenario(scenario)
  assert.equal(item.id, 'scenario_page')
  assert.equal(item.status, 'running')
  assert.equal(item.workflowRunId, 'run_page')
  assert.equal(item.progress?.currentRound, 2)
})

test('upsertHistoryItem replaces existing rows and keeps newest row first', () => {
  const first = buildHistoryItemFromScenario({
    id: 'older',
    title: 'Older',
    description: 'Older run',
    status: 'completed',
    createdAt: new Date('2026-04-26T12:00:00.000Z'),
    updatedAt: new Date('2026-04-26T12:01:00.000Z'),
    parameters: { agentCount: 15, simulationRounds: 12, temperature: 0.8 },
  })

  const second = buildHistoryItemFromScenario({
    id: 'newer',
    title: 'Newer',
    description: 'Newer run',
    status: 'running',
    createdAt: new Date('2026-04-26T12:02:00.000Z'),
    updatedAt: new Date('2026-04-26T12:03:00.000Z'),
    parameters: { agentCount: 15, simulationRounds: 12, temperature: 0.8 },
  })

  const updatedOlder = {
    ...first,
    status: 'failed' as const,
    updatedAt: new Date('2026-04-26T12:04:00.000Z'),
  }

  const list = upsertHistoryItem([first, second], updatedOlder)
  assert.deepEqual(list.map((item) => item.id), ['older', 'newer'])
  assert.equal(list[0].status, 'failed')
})

test('buildHistoryItemsFromApi returns newest-first history items', () => {
  const items = buildHistoryItemsFromApi([
    {
      id: 'a',
      title: 'A',
      description: 'A',
      status: 'completed',
      created_at: '2026-04-26T12:00:00.000Z',
      updated_at: '2026-04-26T12:01:00.000Z',
      results: {},
    },
    {
      id: 'b',
      title: 'B',
      description: 'B',
      status: 'completed',
      created_at: '2026-04-26T12:00:00.000Z',
      updated_at: '2026-04-26T12:02:00.000Z',
      results: {},
    },
  ] as never)

  assert.deepEqual(items.map((item) => item.id), ['b', 'a'])
})
