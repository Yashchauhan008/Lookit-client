import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { eventsApi, type LookitEvent } from '../lib/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3007'
const APP_BASE = import.meta.env.VITE_APP_BASE_URL || window.location.origin

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading, logout } = useAuth()
  const [event, setEvent] = useState<LookitEvent | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !id) return
    let objectUrl = ''
    void (async () => {
      try {
        const res = await eventsApi.get(id)
        setEvent(res.event)
        setShareUrl(res.share_url || `${APP_BASE}/e/${res.event.slug}`)

        const token = localStorage.getItem('lookit_token')
        const qrRes = await fetch(`${API_BASE}/events/${id}/qr`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (qrRes.ok) {
          const blob = await qrRes.blob()
          objectUrl = URL.createObjectURL(blob)
          setQrUrl(objectUrl)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event')
      }
    })()
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [user, id])

  if (loading) {
    return (
      <div className="auth-shell">
        <p className="auth-sub">Loading…</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="dash-shell">
      <header className="dash-header">
        <Link to="/app" className="brand-name">
          ← Events
        </Link>
        <div className="dash-header-right">
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dash-main">
        {error ? <p className="auth-error">{error}</p> : null}
        {!event ? (
          <p className="auth-sub">Loading event…</p>
        ) : (
          <>
            <p className="eyebrow">Event</p>
            <h1 className="section-title">{event.name}</h1>
            <p className="hero-copy">
              {event.event_date || 'Date TBD'} · {event.photo_count} photos ·{' '}
              {event.has_pin ? 'PIN protected' : 'No PIN'}
            </p>

            <div className="event-detail-grid">
              <section className="event-card">
                <h3>Share</h3>
                <p className="auth-sub">Guest link</p>
                <a className="event-link" href={shareUrl} target="_blank" rel="noreferrer">
                  {shareUrl}
                </a>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: '1rem' }}
                  onClick={() => void navigator.clipboard.writeText(shareUrl)}
                >
                  Copy link
                </button>
              </section>

              <section className="event-card">
                <h3>QR code</h3>
                {qrUrl ? (
                  <img src={qrUrl} alt={`QR for ${event.name}`} className="event-qr" />
                ) : (
                  <p className="auth-sub">Generating…</p>
                )}
                {qrUrl ? (
                  <a className="btn btn-ghost" href={qrUrl} download={`lookit-${event.slug}.png`}>
                    Download PNG
                  </a>
                ) : null}
              </section>
            </div>

            <p className="auth-sub" style={{ marginTop: '2rem' }}>
              Uploads & face indexing come next.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
