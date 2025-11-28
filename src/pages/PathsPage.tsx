import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../state/store'
import type { Path } from '../types'

const PathRow = ({
  path,
  onSelect,
  isActive,
}: {
  path: Path
  onSelect: (id: string) => void
  isActive: boolean
}) => {
  const updatePath = useStore((s) => s.updatePath)
  const archivePath = useStore((s) => s.archivePath)
  const removePath = useStore((s) => s.removePath)
  return (
    <div
      className={`grid grid-cols-5 items-center rounded-lg border px-3 py-2 text-sm ${isActive ? 'border-slate-200 bg-white shadow-subtle dark:border-slate-800 dark:bg-slate-900' : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'}`}
    >
      <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: path.color || '#0f172a' }} />
        {path.name}
      </div>
      <div className="text-xs text-slate-500">Weekly target: {path.weeklyTarget ?? 1}</div>
      <div className="text-xs text-slate-500">{path.isActive ? 'Active' : 'Inactive'}</div>
      <div className="flex items-center gap-2 text-xs">
        <button
          className="rounded-full bg-slate-900 px-3 py-1 text-white dark:bg-white dark:text-slate-900"
          onClick={() => onSelect(path.id)}
        >
          Edit
        </button>
        <button
          className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-100"
          onClick={() => updatePath(path.id, { isActive: !path.isActive })}
        >
          {path.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 dark:border-slate-700 dark:text-slate-100"
          onClick={() => archivePath(path.id)}
        >
          Archive
        </button>
      </div>
      <button
        className="justify-self-end text-xs text-red-500"
        onClick={() => {
          const result = removePath(path.id)
          if (!result.ok && result.message) {
            window.alert(result.message)
          }
        }}
      >
        Delete
      </button>
    </div>
  )
}

const AddPathForm = () => {
  const addPath = useStore((s) => s.addPath)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0f172a')
  const [weeklyTarget, setWeeklyTarget] = useState(1)

  const submit = () => {
    const result = addPath({ name, color, weeklyTarget })
    if (!result.ok) {
      if (result.message) window.alert(result.message)
      return
    }
    setName('')
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create Path</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-100">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Writing, Visual..."
          />
        </label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-100">
          Color
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-100">
          Weekly target
          <input
            type="number"
            min={0}
            value={weeklyTarget}
            onChange={(e) => setWeeklyTarget(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      </div>
      <button
        onClick={submit}
        className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-subtle dark:bg-white dark:text-slate-900"
      >
        Add Path
      </button>
    </div>
  )
}

const CollectionEditor = ({
  title,
  items,
  onAdd,
  onRemove,
}: {
  title: string
  items: { id: string; name: string; description?: string }[]
  onAdd: (name: string, description?: string) => void
  onRemove: (id: string) => void
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            onClick={() => {
              if (!name.trim()) return
              onAdd(name.trim(), description.trim() || undefined)
              setName('')
              setDescription('')
            }}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-900"
          >
            Add
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
          >
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
              {item.description && (
                <div className="text-xs text-slate-500 dark:text-slate-300">{item.description}</div>
              )}
            </div>
            <button className="text-xs text-red-500" onClick={() => onRemove(item.id)}>
              Remove
            </button>
          </div>
        ))}
        {!items.length && <div className="text-xs text-slate-500">No items yet.</div>}
      </div>
    </div>
  )
}

export const PathsPage = () => {
  const paths = useStore((s) => s.paths)
  const containers = useStore((s) => s.containers)
  const entryPoints = useStore((s) => s.entryPoints)
  const limits = useStore((s) => s.limits)
  const addContainer = useStore((s) => s.addContainer)
  const addEntryPoint = useStore((s) => s.addEntryPoint)
  const addLimit = useStore((s) => s.addLimit)
  const removeContainer = useStore((s) => s.removeContainer)
  const removeEntryPoint = useStore((s) => s.removeEntryPoint)
  const removeLimit = useStore((s) => s.removeLimit)

  const [selectedPathId, setSelectedPathId] = useState<string | null>(
    paths.find((p) => p.isActive)?.id ?? null,
  )

  useEffect(() => {
    if (!selectedPathId && paths.length) {
      setSelectedPathId(paths[0].id)
    }
  }, [paths, selectedPathId])

  const selectedPath = useMemo(
    () => paths.find((p) => p.id === selectedPathId) || null,
    [paths, selectedPathId],
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Paths</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Manage work streams and the containers/entry points/limits that belong to them.
          </p>
        </div>
      </div>

      <AddPathForm />

      <div className="space-y-2">
        {paths.map((p) => (
          <PathRow key={p.id} path={p} isActive={selectedPathId === p.id} onSelect={setSelectedPathId} />
        ))}
      </div>

      {selectedPath && (
        <div className="grid gap-4 md:grid-cols-2">
          <CollectionEditor
            title="Containers"
            items={containers.filter((c) => c.pathId === selectedPath.id)}
            onAdd={(name, description) => addContainer(selectedPath.id, { name, description })}
            onRemove={removeContainer}
          />
          <CollectionEditor
            title="Entry Points"
            items={entryPoints.filter((e) => e.pathId === selectedPath.id)}
            onAdd={(name, description) => addEntryPoint(selectedPath.id, { name, description })}
            onRemove={removeEntryPoint}
          />
          <CollectionEditor
            title="Limits"
            items={limits.filter((l) => l.pathId === selectedPath.id)}
            onAdd={(name, description) => addLimit(selectedPath.id, { name, formula: description })}
            onRemove={removeLimit}
          />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Global Limits</h3>
        <CollectionEditor
          title="GLOBAL"
          items={limits.filter((l) => l.pathId === 'GLOBAL')}
          onAdd={(name, description) => addLimit('GLOBAL', { name, formula: description })}
          onRemove={removeLimit}
        />
      </div>
    </div>
  )
}
