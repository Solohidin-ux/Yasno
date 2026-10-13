import type { ThemeChoice } from '../types'

const THEME_KEY = 'yasno.theme'
const ONBOARD_KEY = 'yasno.onboarding'

export function getTheme(): ThemeChoice {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  try {
    const legacy = localStorage.getItem('yasno.v1')
    const theme = legacy ? (JSON.parse(legacy) as { theme?: string }).theme : undefined
    if (theme === 'light' || theme === 'dark' || theme === 'system') return theme
  } catch {
    return 'system'
  }
  return 'system'
}

export function setTheme(theme: ThemeChoice) {
  localStorage.setItem(THEME_KEY, theme)
}

export function getOnboardingSeen() {
  return localStorage.getItem(ONBOARD_KEY) === '1'
}

export function setOnboardingSeen(seen: boolean) {
  localStorage.setItem(ONBOARD_KEY, seen ? '1' : '0')
}
