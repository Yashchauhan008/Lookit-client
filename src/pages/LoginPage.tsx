import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import AuthShell from '../components/AuthShell'
import { Button, ErrorText, Field, inputCls } from '../components/kit'

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim().toLowerCase(), password)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      sub="Photographers and studio admins"
      footer={
        <>
          New studio?{' '}
          <Link className="font-semibold text-ink hover:text-accent" to="/register">
            Create account
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            className={inputCls}
            type="password"
            autoComplete="current-password"
            required
            minLength={5}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" className="mt-1 w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}
