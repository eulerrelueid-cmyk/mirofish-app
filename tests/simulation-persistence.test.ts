import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildEventInsertRows,
  isMissingColumnError,
  isMissingRelatedPostIdColumnError,
} from '../lib/simulation-persistence.ts'
import type { SimulationEvent } from '../types/simulation.ts'

const event: SimulationEvent = {
  id: 'event_1',
  timestamp: new Date('2026-05-15T12:00:00.000Z'),
  type: 'post_viral',
  description: 'A post became the dominant narrative.',
  agentsInvolved: ['agent_1'],
  impact: 0.8,
  round: 3,
  relatedPostId: 'post_1',
}

test('buildEventInsertRows can omit related_post_id for older database schemas', () => {
  const rows = buildEventInsertRows('scenario_1', [event], false)

  assert.equal(rows.length, 1)
  assert.equal(Object.hasOwn(rows[0], 'related_post_id'), false)
  assert.equal(rows[0].event_id, 'event_1')
})

test('buildEventInsertRows includes related_post_id when the schema supports it', () => {
  const rows = buildEventInsertRows('scenario_1', [event], true)

  assert.equal(rows[0].related_post_id, 'post_1')
})

test('isMissingRelatedPostIdColumnError detects Supabase schema cache misses', () => {
  assert.equal(
    isMissingRelatedPostIdColumnError({
      message: "Could not find the 'related_post_id' column of 'mirofish_events' in the schema cache",
    }),
    true
  )
  assert.equal(isMissingRelatedPostIdColumnError({ message: 'permission denied' }), false)
  assert.equal(isMissingRelatedPostIdColumnError(null), false)
})

test('isMissingColumnError detects Postgres missing-column messages for a specific table', () => {
  assert.equal(
    isMissingColumnError(
      {
        code: '42703',
        message: 'column mirofish_events.round does not exist',
      },
      'mirofish_events',
      'round'
    ),
    true
  )
  assert.equal(
    isMissingColumnError(
      {
        code: '42703',
        message: 'column mirofish_posts.round does not exist',
      },
      'mirofish_events',
      'round'
    ),
    false
  )
})
