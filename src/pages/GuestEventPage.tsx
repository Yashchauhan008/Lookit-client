import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { eventsApi, guestApi, type GuestMatchPhoto } from '../lib/api'

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

type Step = 'load' | 'pin' | 'consent' | 'selfie' | 'results'

const guestTokenKey = (slug: string) => `lookit_guest_${slug}`

export default function GuestEventPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [step, setStep] = useState<Step>('load')
  const [pin, setPin] = useState('')
  const [consentText, setConsentText] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [photos, setPhotos] = useState<GuestMatchPhoto[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  useEffect(() => {
    if (!slug) return
    void (async () => {
      try {
        const res = await eventsApi.publicBySlug(slug)
        setEvent(res.event)
        const existing = sessionStorage.getItem(guestTokenKey(slug))
        if (existing) {
          try {
            const consent = await guestApi.consentText(slug)
            setConsentText(consent.consent.text)
          } catch {
            /* ignore */
          }
          setStep('consent')
        } else if (res.event.needs_pin) {
          setStep('pin')
        } else {
          setBusy(true)
          try {
            const unlocked = await guestApi.unlock(slug, {})
            sessionStorage.setItem(guestTokenKey(slug), unlocked.token)
            const consent = await guestApi.consentText(slug)
            setConsentText(consent.consent.text)
            setStep('consent')
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start guest session')
            setStep('pin')
          } finally {
            setBusy(false)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Event not found')
      }
    })()
  }, [slug])

  async function submitPin() {
    if (!slug) return
    setBusy(true)
    setError('')
    try {
      const unlocked = await guestApi.unlock(slug, { pin })
      sessionStorage.setItem(guestTokenKey(slug), unlocked.token)
      const consent = await guestApi.consentText(slug)
      setConsentText(consent.consent.text)
      setStep('consent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect PIN')
    } finally {
      setBusy(false)
    }
  }

  async function submitConsent() {
    if (!slug || !accepted) return
    setBusy(true)
    setError('')
    try {
      const res = await guestApi.consent(slug, { accepted: true })
      sessionStorage.setItem(guestTokenKey(slug), res.token)
      setStep('selfie')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Consent failed')
    } finally {
      setBusy(false)
    }
  }

  async function runSearch(file: File) {
    if (!slug) return
    setBusy(true)
    setError('')
    setMessage('')
    stopCamera()
    try {
      const res = await guestApi.search(slug, file)
      setPhotos(res.photos)
      setMessage(res.message || '')
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setBusy(false)
    }
  }

  async function startCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
    } catch {
      setError('Camera unavailable — upload a selfie instead.')
    }
  }

  async function captureFromCamera() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    )
    if (!blob) return
    await runSearch(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }))
  }

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

            {step === 'pin' ? (
              <section className="guest-panel">
                <h2>Enter event PIN</h2>
                <input
                  className="auth-input"
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-solid"
                  disabled={busy || pin.length < 4}
                  onClick={() => void submitPin()}
                >
                  {busy ? 'Checking…' : 'Unlock'}
                </button>
              </section>
            ) : null}

            {step === 'consent' ? (
              <section className="guest-panel">
                <h2>Before we find your photos</h2>
                <p className="auth-sub">{consentText || 'Loading consent…'}</p>
                <label className="guest-check">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                  />
                  <span>I agree to the selfie search terms</span>
                </label>
                <button
                  type="button"
                  className="btn btn-solid"
                  disabled={busy || !accepted}
                  onClick={() => void submitConsent()}
                >
                  {busy ? 'Saving…' : 'Continue'}
                </button>
              </section>
            ) : null}

            {step === 'selfie' ? (
              <section className="guest-panel">
                <h2>Take a selfie</h2>
                <p className="auth-sub">
                  Face the camera with good light. Your selfie is never stored.
                </p>
                {cameraOn ? (
                  <video ref={videoRef} className="guest-camera" playsInline muted />
                ) : null}
                <div className="guest-actions">
                  {!cameraOn ? (
                    <button type="button" className="btn btn-solid" onClick={() => void startCamera()}>
                      Open camera
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-solid"
                      disabled={busy}
                      onClick={() => void captureFromCamera()}
                    >
                      {busy ? 'Searching…' : 'Capture & search'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                  >
                    Upload selfie
                  </button>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void runSearch(file)
                    e.target.value = ''
                  }}
                />
              </section>
            ) : null}

            {step === 'results' ? (
              <section className="guest-panel">
                <h2>Your photos</h2>
                {message ? <p className="auth-sub">{message}</p> : null}
                {photos.length === 0 ? (
                  <p className="auth-sub">No matches yet.</p>
                ) : (
                  <div className="photo-grid">
                    {photos.map((p) => {
                      const src = p.thumb_url || p.preview_url
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className="photo-tile"
                          onClick={() => setLightbox(p.preview_url || src)}
                        >
                          {src ? (
                            <img src={src} alt={p.original_filename || 'Match'} loading="lazy" />
                          ) : (
                            <div className="photo-tile-empty">Photo</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: '1.25rem' }}
                  onClick={() => {
                    setPhotos([])
                    setMessage('')
                    setStep('selfie')
                  }}
                >
                  Retake selfie
                </button>
              </section>
            ) : null}
          </>
        ) : null}
      </main>

      {lightbox ? (
        <div className="guest-lightbox" onClick={() => setLightbox(null)} role="presentation">
          <img src={lightbox} alt="Preview" />
        </div>
      ) : null}
    </div>
  )
}
