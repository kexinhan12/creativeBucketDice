export type ID = string // nanoid()

export type Path = {
  id: ID
  name: string
  color?: string
  isActive: boolean
  containers: ID[]
  entryPoints: ID[]
  limits: ID[]
  weeklyTarget?: number
}

export type Container = {
  id: ID
  pathId: ID
  name: string
  description?: string
}

export type EntryPoint = {
  id: ID
  pathId: ID
  name: string
  description?: string
}

export type Limit = {
  id: ID
  pathId: ID // 'GLOBAL' is allowed
  name: string
  formula?: string
}

export type ConstraintSnapshot = {
  maxPathsPerDay: number
  pathsUsedToday: ID[]
  weeklyCoverageRequired: ID[]
}

export type Prompt = {
  id: ID
  dateISO: string
  seed: string
  pathId: ID
  containerId: ID
  entryPointId?: ID
  limitIds: ID[]
  text: string
  constraintsApplied: ConstraintSnapshot
}

export type Log = {
  id: ID
  promptId: ID
  dateStartISO: string
  dateEndISO?: string
  durationMin?: number
  outcome: 'completed' | 'aborted' | 'skipped'
  exportUri?: string
  notes?: string
  pathId: ID
}

export type Settings = {
  seed?: string
  dailyMaxPaths: number
  requireWeeklyCoverage: boolean
  weekStartsOn: 1 | 0
  defaultLimitsPerPrompt: [number, number]
  darkMode?: 'light' | 'dark'
}

export type BlockedReason =
  | { type: 'DAILY_CAP'; pathsUsedToday: ID[] }
  | { type: 'NO_ACTIVE_PATHS' }
  | { type: 'NO_CONTAINERS'; pathId: ID }
  | { type: 'NEEDS_DATA'; missing: Array<'paths' | 'containers'> }

export type PersistedData = {
  paths: Path[]
  containers: Container[]
  entryPoints: EntryPoint[]
  limits: Limit[]
  prompts: Prompt[]
  logs: Log[]
  settings: Settings
}
