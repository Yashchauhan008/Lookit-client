import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { eventsApi, type LookitEvent } from '../lib/api'

const APP_BASE = import.meta.env.VITE_APP_BASE_URL || window.location.origin

export default function AppHomePage() {
  const { user, loading, logout } = useAuth()
  const [events, setEvents] = useState<LookitEvent[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [pin, setPin] = useState('')
  const [visibility, setVisibility] = useState<'selfie_only' | 'full_gallery'>('selfie_only')

  async function load() {
    const res = await eventsApi.list()
    setEvents(res.events)
  }

  useEffect(() => {
    if (!user) return
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [user])

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

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await eventsApi.create({
        name: name.trim(),
        event_date: eventDate || null,
        pin: pin || null,
        visibility,
      })
      setName('')
      setEventDate('')
      setPin('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this event? Guests will lose access.')) return
    setBusy(true)
    try {
      await eventsApi.remove(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
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
        <h1 className="section-title">Your events</h1>
        <p className="hero-copy">Create an event, share the link or QR, then upload photos next.</p>

        <form className="event-create" onSubmit={onCreate}>
          <h2>New event</h2>
          <div className="event-create-grid">
            <label>
              Name
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya & Rohan" />
            </label>
            <label>
              Date
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </label>
            <label>
              PIN (optional)
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                minLength={4}
                maxLength={12}
                placeholder="4–12 digits"
              />
            </label>
            <label>
              Visibility
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'selfie_only' | 'full_gallery')}
              >
                <option value="selfie_only">Selfie results only</option>
                <option value="full_gallery">Browse all photos</option>
              </select>
            </label>
          </div>
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="btn btn-solid" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Create event'}
          </button>
        </form>

        <div className="event-list">
          {events.length === 0 ? (
            <p className="auth-sub">No events yet — create your first above.</p>
          ) : (
            events.map((ev) => {
              const share = `${APP_BASE}/e/${ev.slug}`
              return (
                <article key={ev.id} className="event-card">
                  <div>
                    <h3>{ev.name}</h3>
                    <p>
                      {ev.event_date || 'Date TBD'} · {ev.photo_count} photos ·{' '}
                      {ev.has_pin ? 'PIN on' : 'Open'} · {ev.visibility.replace('_', ' ')}
                    </p>
                    <a className="event-link" href={share} target="_blank" rel="noreferrer">
                      {share}
                    </a>
                  </div>
                  <div className="event-actions">
                    <Link className="btn btn-ghost" to={`/app/events/${ev.id}`}>
                      Open
                    </Link>
                    <button type="button" className="btn btn-ghost" onClick={() => void onDelete(ev.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
