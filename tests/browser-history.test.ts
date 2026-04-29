import test from 'node:test'
import assert from 'node:assert/strict'

import {
  deserializeScenario,
  mergeHistoryCollections,
  serializeScenario,
} from '../lib/browser-history.ts'
import type { SimulationHistoryItem, SimulationScenario } from '../types/simulation.ts'

test('mergeHistoryCollections keeps the newest version of duplicate history items', () => {
  const older: SimulationHistoryItem = {
    id: 'scenario-1',
    title: 'Older',
    description: 'Old summary',
    status: 'completed',
    createdAt: new Date('2026-04-26T10:00:00.000Z'),
    updatedAt: new Date('2026-04-26T10:00:00.000Z'),
    resultCounts: null,
  }

  const newer: SimulationHistoryItem = {
    ...older,
    title: 'Newer',
    updatedAt: new Date('2026-04-27T10:00:00.000Z'),
  }

  const merged = mergeHistoryCollections([older, newer])

  assert.equal(merged.length, 1)
  assert.equal(merged[0]?.title, 'Newer')
})

test('serializeScenario round-trips timestamps in cached scenarios', () => {
  const scenario: SimulationScenario = {
    id: 'scenario-2',
    title: 'Round trip',
    description: 'Testing browser history cache',
    status: 'completed',
    createdAt: new Date('2026-04-27T10:00:00.000Z'),
    updatedAt: new Date('2026-04-27T10:10:00.000Z'),
    parameters: {
      agentCount: 15,
      simulationRounds: 12,
      temperature: 0.8,
    },
    results: {
      agents: [],
      summary: 'Summary',
      predictions: ['Prediction'],
      posts: [],
      events: [],
      rounds: [],
    },
  }

  const restored = deserializeScenario(serializeScenario(scenario))

  assert.equal(restored.createdAt.toISOString(), scenario.createdAt.toISOString())
  assert.equal(restored.updatedAt.toISOString(), scenario.updatedAt.toISOString())
  assert.equal(restored.results?.summary, 'Summary')
})
