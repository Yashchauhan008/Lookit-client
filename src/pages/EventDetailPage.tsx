import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { billingApi, eventsApi, uploadsApi, type LookitEvent, type LookitPhoto } from '../lib/api'
import { fmtDate } from '../lib/format'
import { shrinkImage } from '../lib/image'
import UploadPicker from '../components/UploadPicker'
import GuestScans from '../components/GuestScans'
import { uploadStore, useUploads } from '../lib/uploads'
import {
  AnchorButton,
  AppHeader,
  Button,
  Card,
  EASE,
  ErrorText,
  Ground,
  Loading,
  Field,
  PageTitle,
  Pill,
  inputCls,
} from '../components/kit'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3007'
const APP_BASE = import.meta.env.VITE_APP_BASE_URL || window.location.origin

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading, logout } = useAuth()
  const [event, setEvent] = useState<LookitEvent | null>(null)
  const [photos, setPhotos] = useState<LookitPhoto[]>([])
  const [shareUrl, setShareUrl] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [planEnds, setPlanEnds] = useState<string | null>(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const { tick } = useUploads()
  const [bannerPct, setBannerPct] = useState<number | null>(null)
  const [bannerPhase, setBannerPhase] = useState<'preparing' | 'uploading' | 'processing' | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState('')
  const [bannerBroken, setBannerBroken] = useState(false)

  const loadPhotos = useCallback(async () => {
    if (!id) return
    try {
      const res = await uploadsApi.listPhotos(id)
      setPhotos(res.photos)
      setEvent((prev) => (prev ? { ...prev, photo_count: res.total } : prev))
    } catch {
      /* ignore list errors until uploads configured */
    }
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    let objectUrl = ''
    void (async () => {
      try {
        const res = await eventsApi.get(id)
        setEvent(res.event)
        setStart(res.event.event_date?.slice(0, 10) ?? '')
        setEnd(res.event.end_date?.slice(0, 10) ?? '')
        billingApi.summary().then((b) => setPlanEnds(b.current_plan?.expires_at ?? null)).catch(() => undefined)
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
        await loadPhotos()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event')
      }
    })()
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [user, id, loadPhotos])

  useEffect(() => {
    if (!tick) return
    const t = setTimeout(() => void loadPhotos(), 2500)
    return () => clearTimeout(t)
  }, [tick, loadPhotos])

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />

  async function saveDates() {
    if (!event) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const res = await eventsApi.update(event.id, { event_date: start || null, end_date: end || null })
      setEvent((prev) => (prev ? { ...prev, ...res.event, photo_count: prev.photo_count } : prev))
      setNotice('Dates saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save dates')
    } finally {
      setSaving(false)
    }
  }

  async function pickBanner(picked: File | undefined) {
    if (!event || !picked) return
    setBannerError('')
    setBannerBroken(false)
    setNotice('')
    if (!/^image\/(jpeg|png|webp)$/.test(picked.type)) {
      setBannerError('Choose a JPEG, PNG or WebP image.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    // Show the chosen image immediately, before the upload finishes.
    const preview = URL.createObjectURL(picked)
    setBannerPreview(preview)
    setBannerPct(0)
    setBannerPhase('preparing')
    setSaving(true)
    try {
      const file = await shrinkImage(picked)
      setBannerPhase('uploading')
      const res = await uploadStore.runTask(`Banner · ${event.name}`, (report, signal) =>
        eventsApi.uploadBanner(
          event.id,
          file,
          (pct) => {
            report(pct)
            setBannerPct(pct)
            if (pct >= 100) setBannerPhase('processing')
          },
          signal,
        ),
      )
      setEvent((prev) => (prev ? { ...prev, ...res.event, photo_count: prev.photo_count } : prev))
      if (res.event.cover_desktop_key && !res.event.banner_url) {
        setBannerError('Banner saved, but its preview link could not be created. Check the media storage settings on the server.')
      } else {
        setNotice('Banner updated')
      }
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Banner upload failed')
    } finally {
      setSaving(false)
      setBannerPct(null)
      setBannerPhase(null)
      setBannerPreview(null)
      URL.revokeObjectURL(preview)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  /** Signed banner links expire after an hour; refetch once if the image stops loading. */
  async function refreshBanner() {
    if (!event || bannerBroken) {
      setBannerBroken(true)
      return
    }
    try {
      const res = await eventsApi.get(event.id)
      if (res.event.banner_url && res.event.banner_url !== event.banner_url) {
        setEvent((prev) => (prev ? { ...prev, banner_url: res.event.banner_url } : prev))
      } else {
        setBannerBroken(true)
      }
    } catch {
      setBannerBroken(true)
    }
  }

  async function removeBanner() {
    if (!event) return
    setSaving(true)
    setBannerError('')
    try {
      await eventsApi.removeBanner(event.id)
      setEvent((prev) => (prev ? { ...prev, banner_url: null, cover_desktop_key: null, cover_mobile_key: null } : prev))
      setBannerBroken(false)
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Could not remove banner')
    } finally {
      setSaving(false)
    }
  }

  const endsAfterPlan = Boolean(end && planEnds && new Date(end) > new Date(planEnds))
  const datesInvalid = Boolean(start && end && end < start)

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Ground>
      <div className="pt-3.5">
        <AppHeader
          left={
            <Link to="/app" className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
              <span aria-hidden>←</span> Events
            </Link>
          }
          right={
            <Button small variant="ghost" onClick={logout}>
              Sign out
            </Button>
          }
        />
      </div>

      <main className="mx-auto w-[min(1100px,92vw)] pb-24 pt-14">
        {error ? <ErrorText>{error}</ErrorText> : null}
        {!event ? (
          <p className="text-mute">Loading event…</p>
        ) : (
          <>
            <PageTitle
              pill="Event"
              title={event.name}
              sub={`${
                event.event_date
                  ? event.end_date && event.end_date !== event.event_date
                    ? `${fmtDate(event.event_date)} – ${fmtDate(event.end_date)}`
                    : fmtDate(event.event_date)
                  : 'Date TBD'
              } · ${event.photo_count} photos`}
            />

            <Card className="mt-10 overflow-hidden !p-0">
              <div className="relative aspect-[2/1] bg-ink md:aspect-[3/1]">
                {bannerPreview || (event.banner_url && !bannerBroken) ? (
                  <img
                    key={bannerPreview || event.banner_url}
                    src={bannerPreview || event.banner_url || undefined}
                    alt="Event banner"
                    onError={() => !bannerPreview && void refreshBanner()}
                    className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${
                      bannerPhase ? 'opacity-60' : 'opacity-100'
                    }`}
                  />
                ) : (
                  <>
                    <span className="absolute -right-10 -top-16 size-64 rounded-full bg-accent/60 blur-3xl" />
                    <span className="absolute -bottom-20 left-10 size-64 rounded-full bg-azure/50 blur-3xl" />
                    <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm font-medium text-white/70">
                      {bannerBroken ? 'The banner could not be loaded. Try replacing it.' : 'No banner yet'}
                    </p>
                  </>
                )}
                <AnimatePresence>
                  {bannerPhase ? (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/95 p-4 shadow-lift backdrop-blur md:inset-x-6 md:bottom-6"
                    >
                      <div className="flex items-center justify-between text-[13px] font-semibold">
                        <span>
                          {bannerPhase === 'preparing'
                            ? 'Preparing image…'
                            : bannerPhase === 'uploading'
                              ? 'Uploading banner…'
                              : 'Finishing up…'}
                        </span>
                        <span className="tabular-nums text-mute">
                          {bannerPhase === 'processing' ? '100%' : `${bannerPct ?? 0}%`}
                        </span>
                      </div>
                      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-black/[0.07]">
                        {bannerPhase === 'processing' || bannerPhase === 'preparing' ? (
                          <motion.div
                            className="h-full w-1/3 rounded-full bg-accent"
                            animate={{ x: ['-100%', '300%'] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        ) : (
                          <motion.div
                            className="h-full rounded-full bg-accent"
                            animate={{ width: `${bannerPct ?? 0}%` }}
                            transition={{ duration: 0.25 }}
                          />
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
              <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:p-8">
                <div>
                  <Pill tint>Banner</Pill>
                  <p className="mt-3 max-w-[16rem] text-sm text-mute">
                    Shown on your event card and at the top of the guest page. JPEG, PNG or WebP, up to 8 MB.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => void pickBanner(e.target.files?.[0])}
                  />
                  <div className="mt-4 flex gap-2">
                    <Button small disabled={saving} onClick={() => fileRef.current?.click()}>
                      {saving && bannerPhase ? 'Uploading…' : event.banner_url ? 'Replace' : 'Upload banner'}
                    </Button>
                    {event.banner_url || event.cover_desktop_key ? (
                      <Button small variant="ghost" disabled={saving} onClick={() => void removeBanner()}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  {bannerError ? (
                    <p role="alert" className="mt-3 max-w-[18rem] rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                      {bannerError}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Pill tint>Dates</Pill>
                  <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
                    <Field label="Start date">
                      <input className={inputCls} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                    </Field>
                    <Field label="End date">
                      <input
                        className={inputCls}
                        type="date"
                        min={start || undefined}
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                      />
                    </Field>
                  </div>
                  {endsAfterPlan && planEnds ? (
                    <p className="mt-3 max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700">
                      Your plan ends on {fmtDate(planEnds)}, before this event ends. Uploads stop then, so
                      renew or add a plan first.
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-3">
                    <Button small disabled={saving || datesInvalid} onClick={() => void saveDates()}>
                      {saving && !bannerPhase ? 'Saving…' : 'Save dates'}
                    </Button>
                    {notice ? <span className="text-sm font-medium text-emerald-700">{notice}</span> : null}
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-5 grid gap-5 md:grid-cols-[1.3fr_1fr]">
              <Card>
                <Pill tint>Share</Pill>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">Guest link</h3>
                <a
                  className="mt-2 block break-all text-sm text-mute hover:text-accent"
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {shareUrl}
                </a>
                <div className="mt-6">
                  <Button small variant={copied ? 'accent' : 'dark'} onClick={() => void copyLink()}>
                    {copied ? 'Copied ✓' : 'Copy link'}
                  </Button>
                </div>
              </Card>

              <Card>
                <Pill tint>QR code</Pill>
                {qrUrl ? (
                  <motion.img
                    src={qrUrl}
                    alt={`QR for ${event.name}`}
                    className="mt-4 w-full max-w-[200px] rounded-2xl border border-black/10 bg-white p-3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: EASE }}
                  />
                ) : (
                  <p className="mt-4 text-sm text-mute">Generating…</p>
                )}
                {qrUrl ? (
                  <div className="mt-5">
                    <AnchorButton small href={qrUrl} download={`lookit-${event.slug}.png`}>
                      Download PNG
                    </AnchorButton>
                  </div>
                ) : null}
              </Card>
            </div>

            <div className="mt-5">
              <UploadPicker eventId={event.id} eventName={event.name} />
            </div>

            <div className="mt-5">
              <GuestScans eventId={event.id} />
            </div>

            <Card className="mt-5">
              <h3 className="text-xl font-semibold tracking-tight">Recent uploads</h3>
              {photos.length === 0 ? (
                <p className="mt-3 text-sm text-mute">No photos yet.</p>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {photos.slice(0, 60).map((p, i) => {
                    const src = p.thumb_url || p.preview_url
                    return (
                      <motion.a
                        key={p.id}
                        className="relative block aspect-square overflow-hidden rounded-2xl bg-paper"
                        href={p.preview_url || src || undefined}
                        target="_blank"
                        rel="noreferrer"
                        title={p.original_filename || p.id}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: Math.min(i, 12) * 0.03 }}
                        whileHover={{ scale: 1.04 }}
                      >
                        {src ? (
                          <img src={src} alt={p.original_filename || 'Photo'} loading="lazy" className="size-full object-cover" />
                        ) : (
                          <div className="grid size-full place-items-center text-xs font-semibold uppercase text-mute">
                            {p.status}
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                          {p.status}
                        </span>
                      </motion.a>
                    )
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </Ground>
  )
}
