import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuth } from '../lib/auth'

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
    <div className="auth-shell">
      <div className="auth-card">
        <Link to="/" className="brand auth-brand">
          <span className="brand-name">Lookit</span>
        </Link>
        <h1>Create studio</h1>
        <p className="auth-sub">We’ll email a 6-digit OTP to verify</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Your name
            <input required value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Studio name
            <input value={studioName} onChange={(e) => setStudioName(e.target.value)} />
          </label>
          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={5}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="btn btn-solid auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Sending OTP…' : 'Continue'}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
