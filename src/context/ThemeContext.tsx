import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getTheme, setTheme } from '../lib/prefs'
import type { ThemeChoice } from '../types'

type ThemeValue = {
  resolved: 'light' | 'dark'
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ThemeChoice>(() => getTheme())
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolved = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.style.colorScheme = resolved
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#12110e' : '#f3efe6')
  }, [resolved])

  const value = {
    resolved,
    toggle: () => {
      const next = resolved === 'dark' ? 'light' : 'dark'
      setTheme(next)
      setChoice(next)
    },
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('Тема не подключена')
  return value
}
