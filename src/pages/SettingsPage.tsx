import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { exportData, useStore } from '../state/store'

export const SettingsPage = () => {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const resetAll = useStore((s) => s.resetAll)
  const importData = useStore((s) => s.importData)
  const paths = useStore((s) => s.paths)
  const containers = useStore((s) => s.containers)
  const entryPoints = useStore((s) => s.entryPoints)
  const limits = useStore((s) => s.limits)
  const prompts = useStore((s) => s.prompts)
  const logs = useStore((s) => s.logs)
  const [limitsRange, setLimitsRange] = useState(settings.defaultLimitsPerPrompt)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    setLimitsRange(settings.defaultLimitsPerPrompt)
  }, [settings.defaultLimitsPerPrompt])

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const parsed = JSON.parse(text)
      importData(parsed)
      setImportError(null)
    } catch (err) {
      setImportError('Invalid JSON import.')
    }
  }

  const handleExport = () => {
    const blob = new Blob(
      [
        exportData({
          paths,
          containers,
          entryPoints,
          limits,
          prompts,
          logs,
          settings,
        }),
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mps-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Seeds, caps, and data import/export (localStorage key mps.v1).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Randomness</h3>
          <label className="mt-2 block text-sm font-semibold text-slate-700 dark:text-slate-100">
            Seed (optional)
            <input
              value={settings.seed ?? ''}
              onChange={(e) => setSettings({ seed: e.target.value || undefined })}
              placeholder="opal-1"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Constraints</h3>
          <label className="mt-2 block text-sm font-semibold text-slate-700 dark:text-slate-100">
            Daily max paths
            <input
              type="number"
              min={1}
              value={settings.dailyMaxPaths}
              onChange={(e) => setSettings({ dailyMaxPaths: Number(e.target.value) || 1 })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
            <input
              type="checkbox"
              checked={settings.requireWeeklyCoverage}
              onChange={(e) => setSettings({ requireWeeklyCoverage: e.target.checked })}
            />
            Require weekly coverage before free choice
          </label>
          <label className="mt-3 block text-sm font-semibold text-slate-700 dark:text-slate-100">
            Week starts on
            <select
              value={settings.weekStartsOn}
              onChange={(e) => setSettings({ weekStartsOn: Number(e.target.value) as 0 | 1 })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-100">
              Limits per prompt (min)
              <input
                type="number"
                min={0}
                value={limitsRange[0]}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0
                  const next: [number, number] = [v, Math.max(v, limitsRange[1])]
                  setLimitsRange(next)
                  setSettings({ defaultLimitsPerPrompt: next })
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-100">
              Limits per prompt (max)
              <input
                type="number"
                min={limitsRange[0]}
                value={limitsRange[1]}
                onChange={(e) => {
                  const v = Number(e.target.value) || limitsRange[0]
                  const next: [number, number] = [limitsRange[0], Math.max(v, limitsRange[0])]
                  setLimitsRange(next)
                  setSettings({ defaultLimitsPerPrompt: next })
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Import / Export</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Persisted in localStorage under mps.v1. Import replaces current state.
            </p>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100">
              Import JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={handleExport}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
            >
              Export JSON
            </button>
          </div>
        </div>
        {importError && <div className="mt-2 text-sm text-red-500">{importError}</div>}
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-900/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Danger</h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              Reset to example data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => resetAll()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
