import { describe, expect, it } from 'vitest'
import { extractJsonStringFromModelText } from '@/lib/ai/utils/extract-json-from-model-text'

describe('extractJsonStringFromModelText', () => {
  it('returns inner JSON from fenced json block', () => {
    const raw = 'Here you go:\n```json\n{"a":1}\n```'
    expect(extractJsonStringFromModelText(raw)).toBe('{"a":1}')
  })

  it('returns substring between first { and last }', () => {
    const raw = 'prefix {"x":"y"} trailing'
    expect(extractJsonStringFromModelText(raw)).toBe('{"x":"y"}')
  })
})
