import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { eventsApi, guestApi, type GuestMatchPhoto } from '../lib/api'
import { Brand, Button, EASE, ErrorText, Ground, Pill } from '../components/kit'
import { fmtDate } from '../lib/format'
import SelfieCamera from '../components/SelfieCamera'

type PublicEvent = {
  id: string
  slug: string
  name: string
  description: string | null
  event_date: string | null
  end_date: string | null
  banner_url: string | null
  visibility: string
  studio: { name: string }
}

type Step = 'load' | 'consent' | 'selfie' | 'results'

const guestTokenKey = (slug: string) => `lookit_guest_${slug}`

// Saved-results bookkeeping lives on the guest's device (localStorage): a random guest id plus, per event,
// a signed scan token. No image or face data is kept here, only a pointer the server can verify.
const GUEST_ID_KEY = 'lookit_guest_id'
const scanKey = (slug: string) => `lookit_scan_${slug}`

function getGuestId(): string | undefined {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(GUEST_ID_KEY, id)
    }
    return id
  } catch {
    return undefined
  }
}
const loadScanToken = (slug: string) => {
  try {
    return localStorage.getItem(scanKey(slug))
  } catch {
    return null
  }
}
const saveScanToken = (slug: string, token: string) => {
  try {
    localStorage.setItem(scanKey(slug), token)
  } catch {
    /* private mode: results just won't persist */
  }
}
const clearScanToken = (slug: string) => {
  try {
    localStorage.removeItem(scanKey(slug))
  } catch {
    /* ignore */
  }
}

export default function GuestEventPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [step, setStep] = useState<Step>('load')
  const [consentText, setConsentText] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [photos, setPhotos] = useState<GuestMatchPhoto[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [newPhotos, setNewPhotos] = useState(0)
  const [selfieAttempt, setSelfieAttempt] = useState(0)

  // Guest token is kept in a ref and passed directly to every guest API
  // call — never rely on reading sessionStorage back mid-flow.
  const tokenRef = useRef<string | null>(null)

  function storeToken(token: string) {
    tokenRef.current = token
    if (slug) sessionStorage.setItem(guestTokenKey(slug), token)
  }

  async function unlockFresh(): Promise<string> {
    const unlocked = await guestApi.unlock(slug!, {})
    storeToken(unlocked.token)
    return unlocked.token
  }

  async function ensureToken(): Promise<string> {
    if (tokenRef.current) return tokenRef.current
    const existing = slug ? sessionStorage.getItem(guestTokenKey(slug)) : null
    if (existing) {
      tokenRef.current = existing
      return existing
    }
    return unlockFresh()
  }

  function isGuestAuthError(err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    return msg.includes('Guest token') || msg.includes('Invalid guest token')
  }

  useEffect(() => {
    if (!slug) return
    void (async () => {
      try {
        const res = await eventsApi.publicBySlug(slug)
        setEvent(res.event)

        // Returning guest: reopen the matches we saved, with no new face search.
        const savedToken = loadScanToken(slug)
        if (savedToken) {
          try {
            const r = await guestApi.myResults(slug, savedToken)
            setPhotos(r.photos)
            setSavedAt(r.scanned_at)
            setNewPhotos(r.new_photos)
            setMessage(r.status === 'no_match' ? 'No matching photos were found last time.' : '')
            setStep('results')
            return
          } catch (err) {
            const status = (err as { status?: number }).status
            if (status === 401 || status === 404 || status === 409) clearScanToken(slug)
            // otherwise (offline etc.) fall through to the normal flow
          }
        }
        const existing = sessionStorage.getItem(guestTokenKey(slug))
        if (existing) tokenRef.current = existing
        if (existing) {
          try {
            const consent = await guestApi.consentText(slug)
            setConsentText(consent.consent.text)
          } catch {
            /* ignore */
          }
          setStep('consent')
        } else {
          setBusy(true)
          try {
            const unlocked = await guestApi.unlock(slug, {})
            storeToken(unlocked.token)
            const consent = await guestApi.consentText(slug)
            setConsentText(consent.consent.text)
            setStep('consent')
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not start guest session')
          } finally {
            setBusy(false)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Event not found')
      }
    })()
  }, [slug])

  async function submitConsent() {
    if (!slug || !accepted) return
    setBusy(true)
    setError('')
    try {
      let res
      try {
        res = await guestApi.consent(slug, { accepted: true }, await ensureToken())
      } catch (err) {
        if (!isGuestAuthError(err)) throw err
        // Stored token missing/expired — get a fresh one and retry once.
        res = await guestApi.consent(slug, { accepted: true }, await unlockFresh())
      }
      storeToken(res.token)
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
    try {
      let res
      try {
        res = await guestApi.search(slug, file, await ensureToken(), getGuestId())
      } catch (err) {
        if (!isGuestAuthError(err)) throw err
        // Session expired — re-unlock, re-consent (already agreed), retry once.
        const consented = await guestApi.consent(slug, { accepted: true }, await unlockFresh())
        storeToken(consented.token)
        res = await guestApi.search(slug, file, consented.token, getGuestId())
      }
      setPhotos(res.photos)
      setMessage(res.message || '')
      if (res.scan_token) saveScanToken(slug, res.scan_token)
      setSavedAt(null)
      setNewPhotos(0)
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setSelfieAttempt((n) => n + 1)
    } finally {
      setBusy(false)
    }
  }

  /** Returning guests have no live session; reuse the consent they already gave for these exact terms. */
  async function startRescan() {
    if (!slug) return
    setError('')
    setPhotos([])
    setMessage('')
    if (tokenRef.current) {
      setStep('selfie')
      return
    }
    setBusy(true)
    try {
      const token = await unlockFresh()
      const consent = await guestApi.consentText(slug)
      setConsentText(consent.consent.text)
      const res = await guestApi.consent(slug, { accepted: true }, token)
      storeToken(res.token)
      setStep('selfie')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start a new scan')
    } finally {
      setBusy(false)
    }
  }

  async function deleteMine() {
    if (!slug) return
    if (!confirm('Delete your selfie and saved results? You can always scan again.')) return
    setBusy(true)
    setError('')
    try {
      const token = loadScanToken(slug)
      if (token) await guestApi.deleteScan(slug, token)
      clearScanToken(slug)
      sessionStorage.removeItem(guestTokenKey(slug))
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete your data')
      setBusy(false)
    }
  }

  const STEPS: Step[] = ['consent', 'selfie', 'results']
  const stepIndex = STEPS.indexOf(step)

  return (
    <Ground>
      <header className="mx-auto flex w-[min(720px,92vw)] items-center justify-between pt-6">
        <Brand />
        {event && step !== 'load' ? (
          <div className="flex gap-1.5" aria-label="Progress">
            {STEPS.map((st, i) => (
              <motion.span
                key={st}
                className="h-1.5 rounded-full bg-ink"
                animate={{ width: i === stepIndex ? 28 : 8, opacity: i <= stepIndex ? 1 : 0.18 }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            ))}
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-[min(720px,92vw)] pb-20 pt-12">
        {error ? <ErrorText>{error}</ErrorText> : null}
        {!event && !error ? <p className="text-mute">Loading event…</p> : null}

        {event ? (
          <>
            {event.banner_url ? (
              <motion.img
                src={event.banner_url}
                alt=""
                className="mb-8 aspect-[2/1] w-full rounded-[2rem] object-cover shadow-lift sm:aspect-[3/1]"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: EASE }}
              />
            ) : null}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
              <Pill tint>{event.studio.name}</Pill>
              <h1 className="mt-4 text-[clamp(2.4rem,8vw,4.5rem)] font-semibold leading-[1.0] tracking-[-0.045em]">
                {event.name}
              </h1>
              <p className="mt-3 text-mute">
                {event.event_date
                  ? event.end_date && event.end_date !== event.event_date
                    ? `${fmtDate(event.event_date)} – ${fmtDate(event.end_date)}`
                    : fmtDate(event.event_date)
                  : 'Event'}
                {event.description ? ` · ${event.description}` : ''}
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {step === 'consent' || step === 'selfie' ? (
              <motion.section
                key={step}
                className="mt-8 grid max-w-md gap-4 rounded-[2rem] bg-white p-7 shadow-soft"
                initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {step === 'consent' ? (
                  <>
                    <h2 className="text-2xl font-semibold tracking-tight">Before we find your photos</h2>
                    <p className="text-sm leading-relaxed text-mute">{consentText || 'Loading consent…'}</p>
                    <label className="flex cursor-pointer items-start gap-3 text-sm font-medium">
                      <input
                        className="mt-0.5 size-5 accent-[#ff6a2b]"
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                      />
                      <span>I agree to the selfie search terms</span>
                    </label>
                    <Button className="w-full" disabled={busy || !accepted} onClick={() => void submitConsent()}>
                      {busy ? 'Saving…' : 'Continue'}
                    </Button>
                  </>
                ) : null}

                {step === 'selfie' ? (
                  <>
                    <h2 className="text-2xl font-semibold tracking-tight">Take a selfie</h2>
                    <p className="text-sm leading-relaxed text-mute">
                      Look straight at the camera. We’ll take the photo automatically once your face is in the oval.
                      Your selfie is saved with this event and the photographer can see it. You can delete it any time
                      from your results.
                    </p>
                    <SelfieCamera key={selfieAttempt} busy={busy} onCapture={(file) => void runSearch(file)} />
                  </>
                ) : null}
              </motion.section>
              ) : null}
            </AnimatePresence>

            {step === 'results' ? (
              <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                <h2 className="text-3xl font-semibold tracking-[-0.03em]">Your photos</h2>
                {savedAt ? (
                  <p className="mt-2 text-sm text-mute">
                    Saved results from {new Date(savedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    . Loaded instantly, no new scan needed.
                  </p>
                ) : null}
                {newPhotos > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-amber-800">
                    <p className="text-sm font-medium">
                      {newPhotos} new {newPhotos === 1 ? 'photo was' : 'photos were'} added since you scanned.
                    </p>
                    <Button small disabled={busy} onClick={() => void startRescan()}>
                      Scan again
                    </Button>
                  </div>
                ) : null}
                {message ? <p className="mt-2 text-mute">{message}</p> : null}
                {photos.length === 0 ? (
                  <p className="mt-4 text-mute">No matches yet.</p>
                ) : (
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {photos.map((p, i) => {
                      const src = p.thumb_url || p.preview_url
                      return (
                        <motion.button
                          key={p.id}
                          type="button"
                          className="relative aspect-square overflow-hidden rounded-[1.4rem] bg-white shadow-soft"
                          onClick={() => setLightbox(p.preview_url || src)}
                          initial={{ opacity: 0, y: 40, scale: 0.94 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.7, delay: Math.min(i, 10) * 0.06, ease: EASE }}
                          whileHover={{ y: -6 }}
                        >
                          {src ? (
                            <img src={src} alt={p.original_filename || 'Match'} loading="lazy" className="size-full object-cover" />
                          ) : (
                            <span className="grid size-full place-items-center text-xs font-semibold uppercase text-mute">Photo</span>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                )}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="ghost" disabled={busy} onClick={() => void startRescan()}>
                    {savedAt ? 'Scan again' : 'Retake selfie'}
                  </Button>
                  <Button variant="ghost" disabled={busy} onClick={() => void deleteMine()}>
                    Delete my selfie &amp; results
                  </Button>
                </div>
              </motion.section>
            ) : null}
          </>
        ) : null}
      </main>

      <AnimatePresence>
        {lightbox ? (
          <motion.div
            className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-ink/85 p-5 backdrop-blur-md"
            onClick={() => setLightbox(null)}
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.img
              src={lightbox}
              alt="Preview"
              className="max-h-[90svh] max-w-full rounded-2xl object-contain shadow-lift"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Ground>
  )
}
