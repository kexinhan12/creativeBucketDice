import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { computePathsUsedToday, computeWeeklyCoverage } from '../lib/constraintEngine'
import { toInputDateTimeValue } from '../utils/date'
import { useStore, buildEmptyLog } from '../state/store'
import type { BlockedReason, Prompt } from '../types'

const BlockedBanner = ({ blocked }: { blocked: BlockedReason }) => {
  const paths = useStore((s) => s.paths)
  if (blocked.type === 'DAILY_CAP') {
    const names = blocked.pathsUsedToday
      .map((id) => paths.find((p) => p.id === id)?.name || id)
      .join(', ')
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/40 dark:text-amber-100">
        Daily cap hit. Paths already used today: {names}.{' '}
        <Link to="/logs" className="underline">
          Review logs
        </Link>
      </div>
    )
  }
  if (blocked.type === 'NO_CONTAINERS') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-900/40 dark:text-red-100">
        Selected path has no containers. Add a container for this path and try again.
      </div>
    )
  }
  if (blocked.type === 'NO_ACTIVE_PATHS') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-900/40 dark:text-red-100">
        No active paths. Activate or create a path first.
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-900/40 dark:text-red-100">
      Add at least one path and container to generate prompts.
    </div>
  )
}

const PromptCard = ({ prompt }: { prompt: Prompt }) => {
  const paths = useStore((s) => s.paths)
  const containers = useStore((s) => s.containers)
  const entryPoints = useStore((s) => s.entryPoints)
  const limits = useStore((s) => s.limits)
  const path = paths.find((p) => p.id === prompt.pathId)
  const container = containers.find((c) => c.id === prompt.containerId)
  const entry = entryPoints.find((e) => e.id === prompt.entryPointId)
  const selectedLimits = limits.filter((l) => prompt.limitIds.includes(l.id))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">
          Seed: {prompt.seed}
        </span>
        <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">
          {new Date(prompt.dateISO).toLocaleString()}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: path?.color || '#0f172a' }} />
          Path: {path?.name}
        </div>
        <div>Container: {container?.name}</div>
        <div>Entry: {entry?.name ?? '—'}</div>
        <div className="text-slate-700 dark:text-slate-200">
          Limits:{' '}
          {selectedLimits.length ? selectedLimits.map((l) => l.name).join(' · ') : '—'}
        </div>
      </div>
      <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
        {prompt.text}
      </pre>
    </div>
  )
}

export const GeneratePage = () => {
  const paths = useStore((s) => s.paths)
  const lastPrompt = useStore((s) => s.lastPrompt)
  const lastBlocked = useStore((s) => s.lastBlocked)
  const generate = useStore((s) => s.generate)
  const saveLog = useStore((s) => s.saveLog)
  const settings = useStore((s) => s.settings)
  const logs = useStore((s) => s.logs)

  const [logDraft, setLogDraft] = useState(() => buildEmptyLog(lastPrompt))
  useEffect(() => {
    if (lastPrompt) {
      setLogDraft({
        ...buildEmptyLog(lastPrompt),
        promptId: lastPrompt.id,
        pathId: lastPrompt.pathId,
      })
    }
  }, [lastPrompt])

  const now = useMemo(() => new Date(), [logs.length, settings.dailyMaxPaths])
  const pathsUsedToday = computePathsUsedToday(logs, now)
  const weekly = computeWeeklyCoverage(paths.filter((p) => p.isActive), logs, settings, now)

  const handleSaveLog = () => {
    if (!logDraft.pathId) return
    saveLog(logDraft)
    setLogDraft(buildEmptyLog(lastPrompt))
  }

  const blocked = lastBlocked

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Generate Prompt</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Respects daily cap and weekly coverage with your seedable dice roll.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-subtle transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          onClick={() => generate(new Date())}
        >
          🎲 Generate prompt
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <div className="text-xs font-semibold uppercase text-slate-500">Today</div>
          <div className="mt-2 font-semibold">
            {pathsUsedToday.length}/{settings.dailyMaxPaths} paths used
          </div>
          <p className="text-xs text-slate-500">
            {pathsUsedToday.length >= settings.dailyMaxPaths
              ? 'Daily cap reached.'
              : 'You can hit another path today.'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <div className="text-xs font-semibold uppercase text-slate-500">Weekly coverage</div>
          <div className="mt-2 font-semibold">{weekly.missing.length} paths still missing</div>
          <p className="text-xs text-slate-500">
            {weekly.missing.map((p) => p.name).join(', ') || 'All covered. Free choice.'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <div className="text-xs font-semibold uppercase text-slate-500">Seed</div>
          <div className="mt-2 font-semibold">{settings.seed || 'Random (time)'}</div>
          <p className="text-xs text-slate-500">
            Add a seed in Settings for reproducible dice rolls.
          </p>
        </div>
      </div>

      {blocked && <BlockedBanner blocked={blocked} />}
      {lastPrompt && <PromptCard prompt={lastPrompt} />}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Log this prompt</h2>
          <span className="text-xs text-slate-500">Counts toward daily + weekly caps</span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
              Path
              <input
                value={paths.find((p) => p.id === logDraft.pathId)?.name || ''}
                readOnly
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Generate a prompt to log"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
              Start
              <input
                type="datetime-local"
                value={toInputDateTimeValue(logDraft.dateStartISO)}
                onChange={(e) =>
                  setLogDraft((d) => ({ ...d, dateStartISO: new Date(e.target.value).toISOString() }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
              End
              <input
                type="datetime-local"
                value={logDraft.dateEndISO ? toInputDateTimeValue(logDraft.dateEndISO) : ''}
                onChange={(e) =>
                  setLogDraft((d) => ({
                    ...d,
                    dateEndISO: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
              Duration (min)
              <input
                type="number"
                min={0}
                value={logDraft.durationMin ?? ''}
                onChange={(e) =>
                  setLogDraft((d) => ({
                    ...d,
                    durationMin: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Optional"
              />
            </label>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
              Outcome
              <select
                value={logDraft.outcome}
                onChange={(e) =>
                  setLogDraft((d) => ({ ...d, outcome: e.target.value as typeof d.outcome }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="completed">Completed</option>
                <option value="aborted">Aborted</option>
                <option value="skipped">Skipped</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
              Export URI
              <input
                value={logDraft.exportUri ?? ''}
                onChange={(e) => setLogDraft((d) => ({ ...d, exportUri: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="link or filename"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
              Notes
              <textarea
                value={logDraft.notes ?? ''}
                onChange={(e) => setLogDraft((d) => ({ ...d, notes: e.target.value }))}
                className="mt-1 h-28 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="What worked / stuck point / next tweak"
              />
            </label>
            <button
              onClick={handleSaveLog}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-subtle transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:opacity-40"
              disabled={!logDraft.pathId}
            >
              Save log
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
