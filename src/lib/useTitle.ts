import { useEffect } from 'react'

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === 'Ясно' ? 'Ясно — процессы на схеме' : `${title} — Ясно`
  }, [title])
}