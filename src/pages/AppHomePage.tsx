import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function AppHomePage() {
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

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <Link to="/" className="brand-name">
          Lookit
        </Link>
        <div className="dash-header-right">
          <span className="dash-meta">
            {user.studio_name || user.name} · {user.role}
          </span>
          {user.role === 'admin' ? (
            <Link className="nav-link" to="/admin">
              Admin
            </Link>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dash-main">
        <p className="eyebrow">Dashboard</p>
        <h1 className="section-title">Welcome, {user.name.split(' ')[0]}</h1>
        <p className="hero-copy">
          Events, uploads, and billing land here next. Auth + role gates are live.
        </p>
        <div className="dash-grid">
          <div className="dash-tile">
            <h3>Events</h3>
            <p>Create themed event pages and share QR links.</p>
            <span className="dash-soon">Next</span>
          </div>
          <div className="dash-tile">
            <h3>Plans & billing</h3>
            <p>UPI orders, quota bars, top-ups.</p>
            <span className="dash-soon">Next</span>
          </div>
          <div className="dash-tile">
            <h3>Uploads</h3>
            <p>Bulk multipart to R2 with live processing.</p>
            <span className="dash-soon">Later</span>
          </div>
        </div>
      </main>
    </div>
  )
}
