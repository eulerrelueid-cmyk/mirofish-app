import test from 'node:test'
import assert from 'node:assert/strict'

import { createScenarioOwnerToken, hashScenarioOwnerToken } from '../lib/scenario-owner.ts'

test('createScenarioOwnerToken returns unique opaque tokens', () => {
  const first = createScenarioOwnerToken()
  const second = createScenarioOwnerToken()

  assert.notEqual(first, second)
  assert.ok(first.length > 30)
  assert.ok(second.length > 30)
})

test('hashScenarioOwnerToken is deterministic', () => {
  const token = 'mirofish-owner-token'

  assert.equal(
    hashScenarioOwnerToken(token),
    hashScenarioOwnerToken(token)
  )
})
