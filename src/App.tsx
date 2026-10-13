import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AboutPage } from './pages/About'
import { AuthPage } from './pages/Auth'
import { CreatePage } from './pages/Create'
import { EditorPage } from './pages/Editor'
import { ExamplePage } from './pages/Example'
import { HomePage } from './pages/Home'
import { PricingPage } from './pages/Pricing'
import { ProcessesPage } from './pages/Processes'
import { PublicPage } from './pages/Public'
import { Marketing } from './components/SiteChrome'
import { Button } from './components/ui'
import { hydrate } from './lib/db'
import { useApp } from './lib/useApp'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Gate>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/editor/:id" element={<EditorPage />} />
            <Route path="/processes" element={<ProcessesPage />} />
            <Route path="/p/:id?" element={<PublicPage />} />
            <Route path="/example/:templateId" element={<ExamplePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Gate>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}

function Gate({ children }: { children: ReactNode }) {
  const { ready } = useApp()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    hydrate().catch(() => setFailed(true))
  }, [])

  if (failed) {
    return (
      <p className="grid min-h-svh place-items-center px-6 text-center text-muted">
        Сервер не отвечает. Запустите его командой npm run dev.
      </p>
    )
  }
  if (!ready) {
    return <p className="grid min-h-svh place-items-center text-muted">Открываем…</p>
  }
  return children
}

function NotFound() {
  return (
    <Marketing>
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-4xl">Такой страницы нет</h1>
        <div className="mt-6">
          <Button to="/">На главную</Button>
        </div>
      </div>
    </Marketing>
  )
}
