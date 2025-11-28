import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { computePathsUsedToday, computeWeeklyCoverage } from '../lib/constraintEngine'
import { useStore } from '../state/store'

const NavLink = ({ to, label }: { to: string; label: string }) => {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link
      to={to}
      className={clsx(
        'rounded-full px-3 py-1 text-sm font-medium transition',
        active
          ? 'bg-slate-900 text-white shadow-subtle dark:bg-white dark:text-slate-900'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white',
      )}
    >
      {label}
    </Link>
  )
}

const ThemeToggle = () => {
  const theme = useStore((s) => s.settings.darkMode ?? 'light')
  const setSettings = useStore((s) => s.setSettings)
  const isDark = theme === 'dark'
  const toggle = () => setSettings({ darkMode: isDark ? 'light' : 'dark' })
  return (
    <button
      onClick={toggle}
      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
      aria-label="Toggle dark mode"
    >
      {isDark ? 'Light' : 'Dark'} mode
    </button>
  )
}

const CoverageChips = () => {
  const paths = useStore((s) => s.paths)
  const logs = useStore((s) => s.logs)
  const settings = useStore((s) => s.settings)
  const activePaths = paths.filter((p) => p.isActive)
  const now = new Date()
  const pathsUsedToday = computePathsUsedToday(logs, now)
  const { missing, coveredCount } = computeWeeklyCoverage(activePaths, logs, settings, now)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
        Paths today: {pathsUsedToday.length}/{settings.dailyMaxPaths}
      </div>
      {activePaths.map((path) => {
        const hits = coveredCount.get(path.id) ?? 0
        const isMissing = missing.some((p) => p.id === path.id)
        return (
          <div
            key={path.id}
            className={clsx(
              'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition',
              isMissing
                ? 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                : 'border-transparent text-slate-900 shadow-subtle dark:bg-slate-700 dark:text-white',
            )}
            style={{ borderColor: path.color || undefined }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: path.color || '#0f172a' }}
            />
            {path.name}
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {hits}/{path.weeklyTarget ?? 1}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export const Header = () => {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link to="/generate" className="text-lg font-bold text-slate-900 dark:text-white">
            Creative Bucket Dice
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to="/generate" label="Generate" />
            <NavLink to="/paths" label="Paths" />
            <NavLink to="/logs" label="Logs" />
            <NavLink to="/settings" label="Settings" />
          </nav>
        </div>
        <div className="flex flex-col items-end gap-2 md:flex-row md:items-center md:gap-4">
          <CoverageChips />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
