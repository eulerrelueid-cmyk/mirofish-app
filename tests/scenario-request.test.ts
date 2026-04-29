import test from 'node:test'
import assert from 'node:assert/strict'

import { parseMultipartScenarioFormData } from '../lib/scenario-request.ts'

test('parseMultipartScenarioFormData does not invoke the file parser when no file is attached', async () => {
  const formData = new FormData()
  formData.set('title', 'No file run')
  formData.set('description', 'Verify multipart parsing without uploads.')
  formData.set('seedText', 'Seed')

  let parserCalls = 0
  const result = await parseMultipartScenarioFormData(formData, async () => {
    parserCalls += 1
    throw new Error('File parser should not be called')
  })

  assert.equal(parserCalls, 0)
  assert.equal(result.title, 'No file run')
  assert.equal(result.description, 'Verify multipart parsing without uploads.')
  assert.equal(result.seedText, 'Seed')
  assert.equal(result.uploadedFile, null)
  assert.equal(result.combinedSeedText, 'Seed')
})
