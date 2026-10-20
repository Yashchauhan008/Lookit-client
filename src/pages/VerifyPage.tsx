import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import AuthShell from '../components/AuthShell'
import { Button, ErrorText, Field, inputCls } from '../components/kit'

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
    <AuthShell
      title="Enter OTP"
      sub={`Sent to ${state.email || 'your email'}. Check spam if you don’t see it.`}
    >
      {state.devOtp ? (
        <p className="mb-4 rounded-2xl border border-dashed border-accent/50 bg-accent/5 px-4 py-3 text-sm font-medium text-[#c2410c]">
          Dev OTP: {state.devOtp}
        </p>
      ) : null}
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field label="6-digit code">
          <input
            className={`${inputCls} text-center text-2xl font-semibold tracking-[0.5em]`}
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" className="mt-1 w-full" disabled={submitting}>
          {submitting ? 'Verifying…' : 'Verify & continue'}
        </Button>
      </form>
    </AuthShell>
  )
}
