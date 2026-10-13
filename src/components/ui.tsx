import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  to?: string
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-ink text-on-ink hover:opacity-90',
  accent: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'border border-line bg-surface text-ink hover:bg-paper',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-danger text-white hover:opacity-90',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({ to, variant = 'primary', size = 'md', className, children, type, ...props }: ButtonProps) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-45',
    variants[variant],
    sizes[size],
    className,
  )
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type ?? 'button'} className={cls} {...props}>
      {children}
    </button>
  )
}

export const fieldClass =
  'w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/80 focus:border-accent'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button className="absolute inset-0 bg-[rgba(22,18,12,0.46)]" aria-label="Закрыть" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative z-10 w-full max-w-md rounded-3xl border border-line bg-surface p-6 text-ink shadow-[var(--shadow)]"
      >
        <h2 id="dialog-title" className="font-display text-xl leading-tight">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-6 text-muted">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
