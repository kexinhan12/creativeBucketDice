import { useMemo, useState } from 'react'
import { parseISO, startOfWeek, format } from 'date-fns'
import { computeWeeklyCoverage } from '../lib/constraintEngine'
import { formatDateTime } from '../utils/date'
import { useStore } from '../state/store'
import type { Container, Limit, Log, Path, Prompt } from '../types'

const buildCsv = (
  logs: Log[],
  prompts: Prompt[],
  paths: Path[],
  containers: Container[],
  limits: Limit[],
) => {
  const header = ['date', 'path', 'container', 'limits', 'outcome', 'duration', 'exportUri'].join(',')
  const rows = logs.map((log) => {
    const prompt = prompts.find((p) => p.id === log.promptId)
    const path = paths.find((p) => p.id === log.pathId)
    const container = prompt ? containers.find((c) => c.id === prompt.containerId) : undefined
    const limitNames =
      prompt && prompt.limitIds.length
        ? prompt.limitIds
            .map((id) => limits.find((l) => l.id === id)?.name || '')
            .filter(Boolean)
            .join(' | ')
        : ''
    const row = [
      log.dateStartISO,
      path?.name ?? '',
      container?.name ?? '',
      `"${limitNames}"`,
      log.outcome,
      log.durationMin ?? '',
      log.exportUri ?? '',
    ]
    return row.join(',')
  })
  return [header, ...rows].join('\n')
}

export const LogsPage = () => {
  const logs = useStore((s) => s.logs)
  const prompts = useStore((s) => s.prompts)
  const paths = useStore((s) => s.paths)
  const containers = useStore((s) => s.containers)
  const limits = useStore((s) => s.limits)
  const settings = useStore((s) => s.settings)
  const deleteLog = useStore((s) => s.deleteLog)
  const [pathFilter, setPathFilter] = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState('all')

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        const byPath = pathFilter === 'all' || log.pathId === pathFilter
        const byOutcome = outcomeFilter === 'all' || log.outcome === outcomeFilter
        return byPath && byOutcome
      }),
    [logs, pathFilter, outcomeFilter],
  )

  const weeklyCoverage = computeWeeklyCoverage(
    paths.filter((p) => p.isActive),
    logs,
    settings,
    new Date(),
  )

  const fullCoverageWeeks = useMemo(() => {
    const active = paths.filter((p) => p.isActive)
    if (!active.length) return 0
    const coverage = new Map<string, Set<string>>()
    logs.forEach((log) => {
      const key = format(
        startOfWeek(parseISO(log.dateStartISO), { weekStartsOn: settings.weekStartsOn }),
        'yyyy-MM-dd',
      )
      const set = coverage.get(key) ?? new Set<string>()
      set.add(log.pathId)
      coverage.set(key, set)
    })
    return Array.from(coverage.values()).filter((set) =>
      active.every((p) => set.has(p.id)),
    ).length
  }, [logs, paths, settings.weekStartsOn])

  const exportCsv = () => {
    const blob = new Blob([buildCsv(logs, prompts, paths, containers, limits)], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'logs.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Logs</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Weekly summary + CSV/JSON export. Deleting logs reopens constraints.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase text-slate-500">Total prompts</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {logs.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase text-slate-500">Completed %</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {logs.length
              ? Math.round(
                  (logs.filter((l) => l.outcome === 'completed').length / logs.length) * 100,
                )
              : 0}
            %
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase text-slate-500">Weekly coverage</div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            {weeklyCoverage.missing.length
              ? `${weeklyCoverage.missing.length} remaining: ${weeklyCoverage.missing
                  .map((p) => p.name)
                  .join(', ')}`
              : 'All covered this week.'}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Full-coverage weeks: {fullCoverageWeeks}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">All paths</option>
          {paths.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="all">Any outcome</option>
          <option value="completed">Completed</option>
          <option value="aborted">Aborted</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((log) => {
          const path = paths.find((p) => p.id === log.pathId)
          const prompt = prompts.find((p) => p.id === log.promptId)
          const container = prompt
            ? containers.find((c) => c.id === prompt.containerId)
            : undefined
          const limitNames =
            prompt && prompt.limitIds.length
              ? prompt.limitIds
                  .map((id) => limits.find((l) => l.id === id)?.name || '')
                  .filter(Boolean)
                  .join(' · ')
              : '—'
          return (
            <div
              key={log.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-subtle dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: path?.color || '#0f172a' }}
                  />
                  {path?.name || 'Path'}
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {log.outcome}
                  </span>
                </div>
                <div className="text-xs text-slate-500">{formatDateTime(log.dateStartISO)}</div>
              </div>
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                Container: {container?.name || '—'} | Limits: {limitNames}
              </div>
              {log.notes && (
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-300">{log.notes}</div>
              )}
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <div>Duration: {log.durationMin ?? '—'} min | Export: {log.exportUri ?? '—'}</div>
                <button className="text-red-500" onClick={() => deleteLog(log.id)}>
                  Delete
                </button>
              </div>
            </div>
          )
        })}
        {!filtered.length && (
          <div className="text-sm text-slate-500">No logs match the current filters.</div>
        )}
      </div>
    </div>
  )
}
