import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import AuthShell from '../components/AuthShell'
import { Button, ErrorText, Field, inputCls } from '../components/kit'

export default function RegisterPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [studioName, setStudioName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/app" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        studio_name: studioName.trim() || undefined,
      })
      navigate('/verify', {
        state: {
          registrationToken: res.token,
          email: email.trim().toLowerCase(),
          devOtp: res.dev_otp,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create studio"
      sub="We’ll email a 6-digit OTP to verify"
      footer={
        <>
          Already have an account?{' '}
          <Link className="font-semibold text-ink hover:text-accent" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field label="Your name">
          <input className={inputCls} required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Studio name">
          <input className={inputCls} value={studioName} onChange={(e) => setStudioName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            className={inputCls}
            type="password"
            required
            minLength={5}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" className="mt-1 w-full" disabled={submitting}>
          {submitting ? 'Sending OTP…' : 'Continue'}
        </Button>
      </form>
    </AuthShell>
  )
}
