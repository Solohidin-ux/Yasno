import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

const ToastContext = createContext<(message: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef(0)
  const push = useCallback((text: string) => {
    setMessage(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(null), 3400)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      {message ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[70] max-w-[min(92vw,28rem)] -translate-x-1/2 rounded-full bg-[#1c1915] px-4 py-2.5 text-center text-sm text-[#f7f3ea] shadow-lg"
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
