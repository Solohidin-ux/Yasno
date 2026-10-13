import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Marketing } from '../components/SiteChrome'
import { Button, Field, fieldClass } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { login, register } from '../lib/db'
import { safeNext } from '../lib/format'
import { useApp } from '../lib/useApp'
import { useTitle } from '../lib/useTitle'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  useTitle(isRegister ? 'Регистрация' : 'Вход')
  const { user } = useApp()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const toast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate(next, { replace: true })
  }, [user, next, navigate])

  if (user) return null

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void (async () => {
      const result = isRegister ? await register(name, email, password) : await login(email, password)
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (result.left > 0) toast('Часть гостевых схем не перенеслась: на Free только 3 схемы')
      navigate(next, { replace: true })
    })()
  }

  return (
    <Marketing>
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-display text-4xl">{isRegister ? 'Аккаунт' : 'Вход'}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Пароль уходит на сервер и хранится как хеш. Писем пока нет: почту мы не подтверждаем.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {isRegister ? (
            <Field label="Имя">
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </Field>
          ) : null}
          <Field label="Почта">
            <input
              className={fieldClass}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Пароль">
            <input
              className={fieldClass}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </Field>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="accent" className="w-full">
            {isRegister ? 'Создать аккаунт' : 'Войти'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted">
          {isRegister ? (
            <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-ink">
              Уже есть аккаунт
            </Link>
          ) : (
            <Link to={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-ink">
              Создать аккаунт
            </Link>
          )}
        </p>
      </div>
    </Marketing>
  )
}
