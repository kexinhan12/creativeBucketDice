/// <reference types="vitest" />
import { describe, expect, it } from 'vitest'
import { generatePrompt } from './constraintEngine'
import type { ConstraintState } from './constraintEngine'
import type { Settings } from '../types'

const baseSettings: Settings = {
  dailyMaxPaths: 2,
  requireWeeklyCoverage: true,
  weekStartsOn: 1,
  defaultLimitsPerPrompt: [1, 2],
}

const makeState = (): ConstraintState => ({
  paths: [
    { id: 'p-a', name: 'A', isActive: true, containers: ['c-a'], entryPoints: [], limits: [], weeklyTarget: 1 },
    { id: 'p-b', name: 'B', isActive: true, containers: ['c-b'], entryPoints: [], limits: [], weeklyTarget: 1 },
  ],
  containers: [
    { id: 'c-a', name: 'Container A', pathId: 'p-a' },
    { id: 'c-b', name: 'Container B', pathId: 'p-b' },
  ],
  entryPoints: [],
  limits: [],
  logs: [],
  settings: baseSettings,
})

describe('constraint engine', () => {
  it('blocks when daily cap reached', () => {
    const state = makeState()
    const today = new Date('2025-01-01T12:00:00Z')
    state.logs = [
      { id: 'l1', promptId: 'p1', dateStartISO: today.toISOString(), outcome: 'completed', pathId: 'p-a' },
      { id: 'l2', promptId: 'p2', dateStartISO: today.toISOString(), outcome: 'completed', pathId: 'p-b' },
    ]
    const result = generatePrompt(state, today)
    expect(result).toHaveProperty('type', 'DAILY_CAP')
  })

  it('biases toward missing weekly coverage', () => {
    const state = makeState()
    const now = new Date('2025-01-03T12:00:00Z')
    state.logs = [
      { id: 'l1', promptId: 'p1', dateStartISO: now.toISOString(), outcome: 'completed', pathId: 'p-a' },
    ]
    const result = generatePrompt(state, now)
    if ('type' in result) throw new Error('expected prompt')
    expect(result.pathId).toBe('p-b')
  })

  it('fails gracefully when a chosen path has no containers', () => {
    const state = makeState()
    state.paths.push({ id: 'p-empty', name: 'Empty', isActive: true, containers: [], entryPoints: [], limits: [], weeklyTarget: 1 })
    state.settings.requireWeeklyCoverage = false
    const now = new Date('2025-01-05T10:00:00Z')
    const result = generatePrompt(state, now)
    if ('type' in result) {
      expect(result.type).toBe('NO_CONTAINERS')
    } else {
      expect(result.containerId).not.toBeUndefined()
    }
  })
})
