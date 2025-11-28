import { nanoid } from 'nanoid'
import { inInterval, isSameLocalDay, getWeekInterval } from '../utils/date'
import { buildSeed, chance, makeRng, pickRandom, randInt, sampleWithoutReplacement } from '../utils/random'
import type {
  BlockedReason,
  Container,
  EntryPoint,
  Limit,
  Log,
  Path,
  Prompt,
  Settings,
} from '../types'

export type ConstraintState = {
  paths: Path[]
  containers: Container[]
  entryPoints: EntryPoint[]
  limits: Limit[]
  logs: Log[]
  settings: Settings
}

const defaultWeeklyTarget = 1

export const computePathsUsedToday = (logs: Log[], now: Date) => {
  const ids = logs.filter((l) => isSameLocalDay(l.dateStartISO, now)).map((l) => l.pathId)
  return Array.from(new Set(ids))
}

export const computeWeeklyCoverage = (
  paths: Path[],
  logs: Log[],
  settings: Settings,
  now: Date,
) => {
  const { start, end } = getWeekInterval(now, settings)
  const coveredCount = new Map<string, number>()
  logs
    .filter((l) => inInterval(l.dateStartISO, start, end))
    .forEach((log) => coveredCount.set(log.pathId, (coveredCount.get(log.pathId) ?? 0) + 1))

  const missing = paths.filter((p) => {
    const target = p.weeklyTarget ?? defaultWeeklyTarget
    if (!p.isActive || target <= 0) return false
    const count = coveredCount.get(p.id) ?? 0
    return count < target
  })

  return { missing, coveredCount, interval: { start, end } }
}

const renderPrompt = (
  path: Path,
  container: Container,
  entry: EntryPoint | undefined,
  limits: Limit[],
) => {
  const limitsList = limits.map((l) => l.name).join(' · ')
  const obeyList = limits.map((l) => l.name).join('; ')
  const entryStart = entry?.description ?? 'Use your usual entry.'
  const containerText = container.description || container.name
  return [
    `Path: ${path.name}`,
    `Container: ${container.name}`,
    `Entry: ${entry ? entry.name : '—'}`,
    `Limits: ${limitsList || '—'}`,
    '',
    'Creative Prompt:',
    `- Start with: ${entryStart}`,
    `- Deliver a ${containerText}.`,
    `- Obey strictly: ${obeyList || '—'}`,
  ].join('\n')
}

export const generatePrompt = (state: ConstraintState, now = new Date()): Prompt | BlockedReason => {
  const { paths, containers, entryPoints, limits, logs, settings } = state
  if (!paths.length) {
    return { type: 'NEEDS_DATA', missing: ['paths', 'containers'] }
  }

  const rngSeed = buildSeed(settings.seed, now)
  const rng = makeRng(rngSeed)

  const activePaths = paths.filter((p) => p.isActive)
  if (!activePaths.length) {
    return { type: 'NO_ACTIVE_PATHS' }
  }

  const pathsUsedToday = computePathsUsedToday(logs, now)
  if (pathsUsedToday.length >= settings.dailyMaxPaths) {
    return { type: 'DAILY_CAP', pathsUsedToday }
  }

  const { missing } = computeWeeklyCoverage(activePaths, logs, settings, now)
  const pool = settings.requireWeeklyCoverage && missing.length > 0 ? missing : activePaths
  if (!pool.length) {
    return { type: 'NO_ACTIVE_PATHS' }
  }

  const path = pickRandom(pool, rng)
  const pathContainers = containers.filter((c) => c.pathId === path.id)
  if (!pathContainers.length) {
    return { type: 'NO_CONTAINERS', pathId: path.id }
  }
  const container = pickRandom(pathContainers, rng)

  const pathEntryPoints = entryPoints.filter((e) => e.pathId === path.id)
  const maybeEntry = pathEntryPoints.length && chance(0.5, rng) ? pickRandom(pathEntryPoints, rng) : undefined

  const limitsPool = [
    ...limits.filter((l) => l.pathId === 'GLOBAL'),
    ...limits.filter((l) => l.pathId === path.id),
  ]
  const [minLimits, maxLimits] = settings.defaultLimitsPerPrompt
  const desired = randInt(minLimits, maxLimits, rng)
  const chosenLimits = sampleWithoutReplacement(limitsPool, desired, rng)

  const text = renderPrompt(path, container, maybeEntry, chosenLimits)

  return {
    id: nanoid(),
    dateISO: now.toISOString(),
    seed: rngSeed,
    pathId: path.id,
    containerId: container.id,
    entryPointId: maybeEntry?.id,
    limitIds: chosenLimits.map((l) => l.id),
    text,
    constraintsApplied: {
      maxPathsPerDay: settings.dailyMaxPaths,
      pathsUsedToday,
      weeklyCoverageRequired: missing.map((p) => p.id),
    },
  }
}
