import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { DEMO_MATTERS } from '@/lib/demo/demoMatters'
import {
  DEMO_MATTERS_STORAGE_KEY,
  DEMO_PERSISTENCE_SCHEMA_VERSION,
  clearAllDemoPersistedState,
  readDemoPersistedData,
  serializeDemoPersistedData,
  validateDemoMattersStoredArray,
  validateIdArray,
  wrapDemoPersistedData,
  writeDemoPersistedData,
  DEMO_LOCAL_STORAGE_KEYS,
  DEMO_SESSION_STORAGE_KEYS,
} from '@/lib/demo/demoPersistence'

describe('demoPersistence', () => {
  const memory = new Map<string, string>()

  beforeEach(() => {
    memory.clear()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => memory.get(`local:${k}`) ?? null,
        setItem: (k: string, v: string) => {
          memory.set(`local:${k}`, v)
        },
        removeItem: (k: string) => {
          memory.delete(`local:${k}`)
        },
      },
      sessionStorage: {
        getItem: (k: string) => memory.get(`session:${k}`) ?? null,
        setItem: (k: string, v: string) => {
          memory.set(`session:${k}`, v)
        },
        removeItem: (k: string) => {
          memory.delete(`session:${k}`)
        },
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('first visit with no stored state returns null / empty', () => {
    expect(readDemoPersistedData(null, validateDemoMattersStoredArray)).toBeNull()
    expect(readDemoPersistedData('', validateDemoMattersStoredArray)).toBeNull()
    expect(memory.size).toBe(0)
  })

  it('accepts valid saved demo state (versioned envelope)', () => {
    const payload = DEMO_MATTERS.map((m) => ({ id: m.id, file_id: m.file_id, status: m.status }))
    const raw = serializeDemoPersistedData(payload)
    const parsed = readDemoPersistedData(raw, validateDemoMattersStoredArray)
    expect(parsed).not.toBeNull()
    expect(parsed!.length).toBe(payload.length)
    expect(parsed![0]!.id).toBe(payload[0]!.id)
    expect(wrapDemoPersistedData(payload).v).toBe(DEMO_PERSISTENCE_SCHEMA_VERSION)
  })

  it('accepts legacy unversioned JSON when schema validates', () => {
    const legacy = JSON.stringify([{ id: 'm1', file_id: 'FL-1' }])
    const parsed = readDemoPersistedData(legacy, validateDemoMattersStoredArray)
    expect(parsed).toEqual([{ id: 'm1', file_id: 'FL-1' }])
  })

  it('rejects invalid JSON and falls back to null', () => {
    expect(readDemoPersistedData('{not-json', validateDemoMattersStoredArray)).toBeNull()
    expect(readDemoPersistedData('undefined', validateIdArray)).toBeNull()
  })

  it('rejects valid JSON with invalid schema', () => {
    expect(readDemoPersistedData(JSON.stringify({ hello: 'world' }), validateDemoMattersStoredArray)).toBeNull()
    // Rows without required fields are dropped; empty array means hydrate keeps seed.
    expect(readDemoPersistedData(JSON.stringify([{ name: 'no-id' }]), validateDemoMattersStoredArray)).toEqual([])
    expect(
      readDemoPersistedData(
        JSON.stringify({ v: DEMO_PERSISTENCE_SCHEMA_VERSION, data: [{ id: 'x' }] }),
        validateDemoMattersStoredArray,
      ),
    ).toEqual([])
    expect(
      readDemoPersistedData(
        JSON.stringify({ v: 999, data: [{ id: 'm1', file_id: 'FL-1' }] }),
        validateDemoMattersStoredArray,
      ),
    ).toBeNull()
  })

  it('reset clears all demo storage keys and can restore fixture writes', () => {
    writeDemoPersistedData(DEMO_MATTERS_STORAGE_KEY, [{ id: 'x', file_id: 'y' }])
    for (const key of DEMO_LOCAL_STORAGE_KEYS) {
      writeDemoPersistedData(key, [{ id: 'tmp', file_id: 'tmp' }])
    }
    for (const key of DEMO_SESSION_STORAGE_KEYS) {
      memory.set(`session:${key}`, serializeDemoPersistedData([{ id: 'tmp', token: 't' }]))
    }

    clearAllDemoPersistedState()

    for (const key of DEMO_LOCAL_STORAGE_KEYS) {
      expect(memory.get(`local:${key}`)).toBeUndefined()
    }
    for (const key of DEMO_SESSION_STORAGE_KEYS) {
      expect(memory.get(`session:${key}`)).toBeUndefined()
    }

    // Restore original fixtures into storage (what resetDemoData does after clear).
    writeDemoPersistedData(DEMO_MATTERS_STORAGE_KEY, DEMO_MATTERS)
    const restored = readDemoPersistedData(
      memory.get(`local:${DEMO_MATTERS_STORAGE_KEY}`) ?? null,
      validateDemoMattersStoredArray,
    )
    expect(restored!.map((m) => m.id).sort()).toEqual(DEMO_MATTERS.map((m) => m.id).sort())
  })
})
