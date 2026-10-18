import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuth } from '../lib/auth'

type LocState = {
  registrationToken?: string
  email?: string
  devOtp?: string
}

export default function VerifyPage() {
  const location = useLocation()
  const state = (location.state || {}) as LocState
  const { setSession, user, loading } = useAuth()
  const navigate = useNavigate()
  const [otp, setOtp] = useState(state.devOtp || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/app" replace />
  }

  if (!state.registrationToken) {
    return <Navigate to="/register" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await authApi.verify({
        token: state.registrationToken!,
        otp: otp.trim(),
      })
      setSession(res.token, res.user)
      navigate(res.user.role === 'admin' ? '/admin' : '/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
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
        <h1>Enter OTP</h1>
        <p className="auth-sub">
          Sent to {state.email || 'your email'}. Check spam if you don’t see it.
        </p>
        {state.devOtp ? (
          <p className="auth-dev">Dev OTP: {state.devOtp}</p>
        ) : null}

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            6-digit code
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="btn btn-solid auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
