import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { eventsApi } from '../lib/api'

type PublicEvent = {
  id: string
  slug: string
  name: string
  description: string | null
  event_date: string | null
  visibility: string
  needs_pin: boolean
  studio: { name: string }
}

export default function GuestEventPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    void eventsApi
      .publicBySlug(slug)
      .then((res) => setEvent(res.event))
      .catch((err) => setError(err instanceof Error ? err.message : 'Event not found'))
  }, [slug])

  return (
    <div className="guest-shell">
      <header className="guest-top">
        <Link to="/" className="brand-name">
          Lookit
        </Link>
      </header>

      <main className="guest-main">
        {error ? <p className="auth-error">{error}</p> : null}
        {!event && !error ? <p className="auth-sub">Loading event…</p> : null}
        {event ? (
          <>
            <p className="eyebrow">{event.studio.name}</p>
            <h1 className="hero-title guest-title">{event.name}</h1>
            <p className="hero-copy">
              {event.event_date || 'Event'}
              {event.description ? ` · ${event.description}` : ''}
            </p>
            {event.needs_pin ? (
              <p className="auth-dev">This event is PIN protected — unlock flow next.</p>
            ) : null}
            <button type="button" className="btn btn-solid" disabled>
              Continue (coming soon)
            </button>
          </>
        ) : null}
      </main>
    </div>
  )
}
