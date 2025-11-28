import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { GeneratePage } from './pages/GeneratePage'
import { PathsPage } from './pages/PathsPage'
import { LogsPage } from './pages/LogsPage'
import { SettingsPage } from './pages/SettingsPage'
import { Header } from './components/Header'
import { useStore } from './state/store'

function App() {
  const theme = useStore((s) => s.settings.darkMode ?? 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/generate" />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/paths" element={<PathsPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  )
}

export default App
