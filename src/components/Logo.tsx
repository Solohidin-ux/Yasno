export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <rect x="5" y="12" width="9" height="8" rx="2" fill="var(--paper)" />
        <path d="M16 16h5.2" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" />
        <path
          d="M19.2 13.2 23.4 16 19.2 18.8"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {compact ? null : <span className="font-display text-lg tracking-tight">Ясно</span>}
    </span>
  )
}
