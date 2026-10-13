import { Menu, Moon, Sun, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { logout } from '../lib/db'
import { useApp } from '../lib/useApp'
import { cn } from '../lib/utils'
import { Logo } from './Logo'

const links = [
  { to: '/create', label: 'Создать' },
  { to: '/processes', label: 'Мои процессы' },
  { to: '/pricing', label: 'Тарифы' },
  { to: '/about', label: 'О продукте' },
]

export function Marketing({ children }: { children: ReactNode }) {
  return (
    <div className="marketing min-h-svh text-ink">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}

export function SiteHeader() {
  const { user } = useApp()
  const { resolved, toggle } = useTheme()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState(location.pathname)
  if (path !== location.pathname) {
    setPath(location.pathname)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link to="/" aria-label="Ясно, на главную" className="text-ink">
          <Logo />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn('rounded-full px-3 py-2 text-sm', isActive ? 'bg-surface font-semibold' : 'text-muted hover:text-ink')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label={resolved === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            onClick={toggle}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface"
          >
            {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <details className="relative hidden md:block">
              <summary className="cursor-pointer list-none rounded-full border border-line bg-surface px-3 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {user.name}
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow)]">
                <p className="px-2 py-1 text-xs text-muted">{user.email}</p>
                <p className="px-2 pb-2 text-xs font-semibold">{user.plan === 'pro' ? 'Pro' : 'Free · 3 схемы'}</p>
                <Link to="/processes" className="block rounded-xl px-2 py-2 text-sm hover:bg-paper">
                  Мои процессы
                </Link>
                <button className="block w-full rounded-xl px-2 py-2 text-left text-sm hover:bg-paper" onClick={() => void logout()}>
                  Выйти
                </button>
              </div>
            </details>
          ) : (
            <Link to="/login" className="hidden rounded-full px-3 py-2 text-sm font-semibold md:inline">
              Войти
            </Link>
          )}
          <Link
            to="/create"
            className="hidden h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-on-ink md:inline-flex"
          >
            Создать процесс
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-line md:hidden"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-line px-5 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="rounded-xl px-2 py-2 text-sm">
                {link.label}
              </Link>
            ))}
            {user ? (
              <button className="rounded-xl px-2 py-2 text-left text-sm" onClick={() => void logout()}>
                Выйти · {user.name}
              </button>
            ) : (
              <Link to="/login" className="rounded-xl px-2 py-2 text-sm">
                Войти
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Схемы и аккаунты хранятся на сервере Ясно.</p>
        <div className="flex gap-4">
          <Link to="/about">О продукте</Link>
          <Link to="/pricing">Тарифы</Link>
        </div>
      </div>
    </footer>
  )
}
