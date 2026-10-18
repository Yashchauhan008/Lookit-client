import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function AdminHomePage() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="auth-shell">
        <p className="auth-sub">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <Link to="/" className="brand-name">
          Lookit Admin
        </Link>
        <div className="dash-header-right">
          <Link className="nav-link" to="/app">
            Studio
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <main className="dash-main">
        <p className="eyebrow">Admin</p>
        <h1 className="section-title">Operations</h1>
        <p className="hero-copy">
          Payment approvals, photographers, plans, and face-API spend come next. You’re signed in as{' '}
          {user.email}.
        </p>
      </main>
    </div>
  )
}
