import test from 'node:test'
import assert from 'node:assert/strict'

import { mergeScenarioGrounding, parseUploadedScenarioFile } from '../lib/document-parser.ts'

test('parseUploadedScenarioFile extracts text from txt uploads', async () => {
  const file = new File(['Alpha\nBeta'], 'notes.txt', { type: 'text/plain' })

  const parsed = await parseUploadedScenarioFile(file)

  assert.equal(parsed.extractedText, 'Alpha\nBeta')
  assert.equal(parsed.metadata.name, 'notes.txt')
  assert.equal(parsed.metadata.type, 'text/plain')
  assert.equal(parsed.metadata.extractedCharacters, 'Alpha\nBeta'.length)
})

test('mergeScenarioGrounding combines seed text and upload text', () => {
  const merged = mergeScenarioGrounding('User notes', {
    extractedText: 'Document body',
    metadata: {
      name: 'brief.txt',
      type: 'text/plain',
      size: 12,
      extractedCharacters: 13,
    },
  })

  assert.equal(merged, 'User notes\n\nDocument grounding (brief.txt):\nDocument body')
})
