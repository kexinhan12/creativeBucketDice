import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { generatePrompt, type ConstraintState } from '../lib/constraintEngine'
import { nowISO } from '../utils/date'
import type {
  BlockedReason,
  Container,
  EntryPoint,
  ID,
  Limit,
  Log,
  Path,
  PersistedData,
  Prompt,
  Settings,
} from '../types'

const STORAGE_KEY = 'mps.v1'

const defaultSettings: Settings = {
  dailyMaxPaths: 2,
  requireWeeklyCoverage: true,
  weekStartsOn: 1,
  defaultLimitsPerPrompt: [2, 3],
  darkMode: 'light',
}

const examplePaths: Path[] = [
  {
    id: 'p-writing',
    name: 'Writing',
    isActive: true,
    color: '#6b7280',
    containers: ['c-writing-tile'],
    entryPoints: ['e-writing-frag'],
    limits: ['l-writing-no-adv'],
    weeklyTarget: 1,
  },
  {
    id: 'p-visual',
    name: 'Visual',
    isActive: true,
    color: '#0ea5e9',
    containers: ['c-visual-a5'],
    entryPoints: ['e-visual-transfer'],
    limits: ['l-visual-3colors'],
    weeklyTarget: 1,
  },
  {
    id: 'p-music',
    name: 'Music',
    isActive: true,
    color: '#22c55e',
    containers: ['c-music-songlet'],
    entryPoints: ['e-music-mimic'],
    limits: ['l-music-92bpm'],
    weeklyTarget: 1,
  },
  {
    id: 'p-tech',
    name: 'Tech',
    isActive: true,
    color: '#eab308',
    containers: ['c-tech-demo'],
    entryPoints: ['e-tech-openproj'],
    limits: ['l-tech-120min'],
    weeklyTarget: 1,
  },
  {
    id: 'p-brand',
    name: 'Brand',
    isActive: true,
    color: '#ef4444',
    containers: ['c-brand-waistband'],
    entryPoints: ['e-brand-flatlay'],
    limits: ['l-brand-5plus5'],
    weeklyTarget: 1,
  },
]

const exampleContainers: Container[] = [
  { id: 'c-writing-tile', pathId: 'p-writing', name: 'Tile 300–500 words', description: 'Write 300–500 words around a vivid beat.' },
  { id: 'c-visual-a5', pathId: 'p-visual', name: 'A5 sketch', description: 'One A5 frame with a clear focal point.' },
  { id: 'c-music-songlet', pathId: 'p-music', name: 'Songlet — 60–90 sec', description: '3-section sketch: drums(8) + bass(8) + hook(8).' },
  { id: 'c-tech-demo', pathId: 'p-tech', name: 'Demo spike', description: 'Prototype one interaction in 120 minutes.' },
  { id: 'c-brand-waistband', pathId: 'p-brand', name: 'Waistband concept', description: 'Name + single visual for a micro-brand.' },
]

const exampleEntryPoints: EntryPoint[] = [
  { id: 'e-writing-frag', pathId: 'p-writing', name: 'Fragment sweep 10 min', description: 'Free-write fragments for 10 minutes.' },
  { id: 'e-visual-transfer', pathId: 'p-visual', name: 'Transfer rip', description: 'Trace a photo for 5 minutes, then remix.' },
  { id: 'e-music-mimic', pathId: 'p-music', name: 'Mimic 45s', description: 'Sing along a similar mood track, then record first take.' },
  { id: 'e-tech-openproj', pathId: 'p-tech', name: 'Open project', description: 'Open a dusty repo, make one visible win.' },
  { id: 'e-brand-flatlay', pathId: 'p-brand', name: 'Flatlay scan', description: 'Collect 5 artifacts, sketch the brand feel.' },
]

const exampleLimits: Limit[] = [
  { id: 'l-global-delete10', pathId: 'GLOBAL', name: 'Delete last 10%' },
  { id: 'l-writing-no-adv', pathId: 'p-writing', name: 'No adverbs' },
  { id: 'l-visual-3colors', pathId: 'p-visual', name: 'Use max 3 colors' },
  { id: 'l-music-92bpm', pathId: 'p-music', name: '92 BPM' },
  { id: 'l-tech-120min', pathId: 'p-tech', name: '120-min cap' },
  { id: 'l-brand-5plus5', pathId: 'p-brand', name: '5+5 brainstorm' },
]

const baseData: PersistedData = {
  paths: examplePaths,
  containers: exampleContainers,
  entryPoints: exampleEntryPoints,
  limits: exampleLimits,
  prompts: [],
  logs: [],
  settings: defaultSettings,
}

export type StoreState = PersistedData & {
  lastPrompt?: Prompt
  lastBlocked?: BlockedReason | null
  setSettings: (settings: Partial<Settings>) => void
  addPath: (input: Omit<Path, 'id' | 'containers' | 'entryPoints' | 'limits' | 'isActive'> & { color?: string }) => { ok: boolean; message?: string }
  updatePath: (id: ID, updates: Partial<Path>) => { ok: boolean; message?: string }
  archivePath: (id: ID) => void
  removePath: (id: ID) => { ok: boolean; message?: string }
  addContainer: (pathId: ID, input: Omit<Container, 'id' | 'pathId'>) => { ok: boolean; message?: string }
  addEntryPoint: (pathId: ID, input: Omit<EntryPoint, 'id' | 'pathId'>) => { ok: boolean; message?: string }
  addLimit: (pathId: ID, input: Omit<Limit, 'id' | 'pathId'>) => { ok: boolean; message?: string }
  removeContainer: (id: ID) => void
  removeEntryPoint: (id: ID) => void
  removeLimit: (id: ID) => void
  generate: (now?: Date) => Prompt | BlockedReason
  saveLog: (input: Omit<Log, 'id'>) => Log
  deleteLog: (id: ID) => void
  importData: (data: PersistedData) => void
  resetAll: () => void
  clearPrompt: () => void
}

const nameExists = (paths: Path[], name: string, excludeId?: ID) =>
  paths.some((p) => p.id !== excludeId && p.name.toLowerCase().trim() === name.toLowerCase().trim())

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...baseData,
      lastPrompt: undefined,
      lastBlocked: null,

      setSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),

      addPath: (input) => {
        const state = get()
        if (nameExists(state.paths, input.name)) {
          return { ok: false, message: 'Path name must be unique.' }
        }
        const id = nanoid()
        const newPath: Path = {
          id,
          name: input.name.trim(),
          color: input.color,
          isActive: true,
          containers: [],
          entryPoints: [],
          limits: [],
          weeklyTarget: input.weeklyTarget ?? 1,
        }
        set((state) => ({ paths: [...state.paths, newPath] }))
        return { ok: true }
      },

      updatePath: (id, updates) => {
        const state = get()
        const target = state.paths.find((p) => p.id === id)
        if (!target) return { ok: false, message: 'Path not found.' }
        if (updates.name && nameExists(state.paths, updates.name, id)) {
          return { ok: false, message: 'Path name must be unique.' }
        }
        set((state) => ({
          paths: state.paths.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }))
        return { ok: true }
      },

      archivePath: (id) =>
        set((state) => ({
          paths: state.paths.map((p) => (p.id === id ? { ...p, isActive: false } : p)),
        })),

      removePath: (id) => {
        const state = get()
        const hasLogs = state.logs.some((l) => l.pathId === id)
        if (hasLogs) {
          set((state) => ({
            paths: state.paths.map((p) => (p.id === id ? { ...p, isActive: false } : p)),
          }))
          return { ok: false, message: 'Path has logs; archived instead.' }
        }
        set((state) => ({
          paths: state.paths.filter((p) => p.id !== id),
          containers: state.containers.filter((c) => c.pathId !== id),
          entryPoints: state.entryPoints.filter((e) => e.pathId !== id),
          limits: state.limits.filter((l) => l.pathId !== id),
        }))
        return { ok: true }
      },

      addContainer: (pathId, input) => {
        const path = get().paths.find((p) => p.id === pathId && p.isActive)
        if (!path) return { ok: false, message: 'Path inactive or missing.' }
        const id = nanoid()
        const record: Container = { id, pathId, ...input }
        set((state) => ({
          containers: [...state.containers, record],
          paths: state.paths.map((p) =>
            p.id === pathId ? { ...p, containers: [...p.containers, id] } : p,
          ),
        }))
        return { ok: true }
      },

      addEntryPoint: (pathId, input) => {
        const path = get().paths.find((p) => p.id === pathId && p.isActive)
        if (!path) return { ok: false, message: 'Path inactive or missing.' }
        const id = nanoid()
        const record: EntryPoint = { id, pathId, ...input }
        set((state) => ({
          entryPoints: [...state.entryPoints, record],
          paths: state.paths.map((p) =>
            p.id === pathId ? { ...p, entryPoints: [...p.entryPoints, id] } : p,
          ),
        }))
        return { ok: true }
      },

      addLimit: (pathId, input) => {
        if (pathId !== 'GLOBAL') {
          const path = get().paths.find((p) => p.id === pathId && p.isActive)
          if (!path) return { ok: false, message: 'Path inactive or missing.' }
        }
        const id = nanoid()
        const record: Limit = { id, pathId, ...input }
        set((state) => ({
          limits: [...state.limits, record],
          paths:
            pathId === 'GLOBAL'
              ? state.paths
              : state.paths.map((p) =>
                  p.id === pathId ? { ...p, limits: [...p.limits, id] } : p,
                ),
        }))
        return { ok: true }
      },

      removeContainer: (id) =>
        set((state) => ({
          containers: state.containers.filter((c) => c.id !== id),
          paths: state.paths.map((p) => ({
            ...p,
            containers: p.containers.filter((cid) => cid !== id),
          })),
        })),

      removeEntryPoint: (id) =>
        set((state) => ({
          entryPoints: state.entryPoints.filter((e) => e.id !== id),
          paths: state.paths.map((p) => ({
            ...p,
            entryPoints: p.entryPoints.filter((eid) => eid !== id),
          })),
        })),

      removeLimit: (id) =>
        set((state) => ({
          limits: state.limits.filter((l) => l.id !== id),
          paths: state.paths.map((p) => ({
            ...p,
            limits: p.limits.filter((lid) => lid !== id),
          })),
        })),

      generate: (now = new Date()) => {
        const state = get()
        const constraintState: ConstraintState = {
          paths: state.paths,
          containers: state.containers,
          entryPoints: state.entryPoints,
          limits: state.limits,
          logs: state.logs,
          settings: state.settings,
        }
        const result = generatePrompt(constraintState, now)
        if ('type' in result) {
          set({ lastBlocked: result, lastPrompt: undefined })
        } else {
          set((state) => ({
            lastPrompt: result,
            lastBlocked: null,
            prompts: [result, ...state.prompts],
          }))
        }
        return result
      },

      saveLog: (input) => {
        const id = nanoid()
        const log: Log = { ...input, id }
        set((state) => ({
          logs: [log, ...state.logs].sort(
            (a, b) => new Date(b.dateStartISO).getTime() - new Date(a.dateStartISO).getTime(),
          ),
        }))
        return log
      },

      deleteLog: (id) =>
        set((state) => ({
          logs: state.logs.filter((l) => l.id !== id),
        })),

      importData: (data) =>
        set(() => ({
          ...data,
          settings: { ...defaultSettings, ...data.settings },
          prompts: data.prompts ?? [],
        })),

      resetAll: () => set(() => ({ ...baseData, lastPrompt: undefined, lastBlocked: null })),

      clearPrompt: () => set({ lastPrompt: undefined, lastBlocked: null }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        paths: state.paths,
        containers: state.containers,
        entryPoints: state.entryPoints,
        limits: state.limits,
        prompts: state.prompts,
        logs: state.logs,
        settings: state.settings,
        lastPrompt: state.lastPrompt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // Ensure defaults for new settings keys
        state.settings = { ...defaultSettings, ...state.settings }
      },
    },
  ),
)

export const exportData = (state: PersistedData) =>
  JSON.stringify(
    {
      ...state,
    },
    null,
    2,
  )

export const buildEmptyLog = (prompt: Prompt | undefined): Omit<Log, 'id'> => ({
  promptId: prompt?.id ?? nanoid(),
  pathId: prompt?.pathId ?? '',
  dateStartISO: nowISO(),
  outcome: 'completed',
})
