import test from 'node:test'
import assert from 'node:assert/strict'

import { buildProjectWorkflow } from '../lib/project-workflow.ts'
import type { SimulationScenario } from '../types/simulation.ts'

function buildScenario(overrides: Partial<SimulationScenario> = {}): SimulationScenario {
  return {
    id: 'scenario_1',
    title: 'Scenario',
    description: 'Description',
    status: 'pending',
    createdAt: new Date('2026-04-29T20:00:00.000Z'),
    updatedAt: new Date('2026-04-29T20:00:00.000Z'),
    parameters: {
      agentCount: 15,
      simulationRounds: 12,
      temperature: 0.8,
    },
    ...overrides,
  }
}

test('buildProjectWorkflow marks simulation as current while a run is active', () => {
  const workflow = buildProjectWorkflow(
    {
      id: 'project_1',
      name: 'Project',
      objective: 'Objective',
      status: 'simulation_running',
      sourceMode: 'prompt_only',
      focusAreas: ['trust'],
      platforms: ['twitter', 'reddit'],
      createdAt: new Date('2026-04-29T20:00:00.000Z'),
      updatedAt: new Date('2026-04-29T20:00:00.000Z'),
    },
    buildScenario({
      status: 'running',
    })
  )

  assert.deepEqual(
    workflow.map((step) => [step.id, step.status]),
    [
      ['input', 'complete'],
      ['world', 'complete'],
      ['simulation', 'current'],
      ['report', 'upcoming'],
    ]
  )
})

test('buildProjectWorkflow marks report as complete when a structured report exists', () => {
  const workflow = buildProjectWorkflow(
    {
      id: 'project_1',
      name: 'Project',
      objective: 'Objective',
      status: 'simulation_completed',
      sourceMode: 'prompt_only',
      focusAreas: ['trust'],
      platforms: ['twitter', 'reddit'],
      reportSnapshot: {
        executiveVerdict: 'Verdict',
        keyDrivers: ['Driver'],
        audienceSignals: ['Signal'],
        platformReadout: {
          twitter: 'Twitter',
          reddit: 'Reddit',
        },
        interventionIdeas: ['Intervention'],
        watchSignals: ['Watch'],
      },
      createdAt: new Date('2026-04-29T20:00:00.000Z'),
      updatedAt: new Date('2026-04-29T20:00:00.000Z'),
    },
    buildScenario({
      status: 'completed',
      results: {
        agents: [],
        events: [],
        posts: [],
        rounds: [],
        summary: 'Summary',
        predictions: [],
        report: {
          executiveVerdict: 'Verdict',
          keyDrivers: ['Driver'],
          audienceSignals: ['Signal'],
          platformReadout: {
            twitter: 'Twitter',
            reddit: 'Reddit',
          },
          interventionIdeas: ['Intervention'],
          watchSignals: ['Watch'],
        },
      },
    })
  )

  assert.deepEqual(
    workflow.map((step) => [step.id, step.status]),
    [
      ['input', 'complete'],
      ['world', 'complete'],
      ['simulation', 'complete'],
      ['report', 'complete'],
    ]
  )
})
