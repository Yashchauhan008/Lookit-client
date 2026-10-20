import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { billingApi, eventsApi, type Billing, type LookitEvent } from '../lib/api'
import { Meter } from '../components/billing'
import { AreaChart, BarList, DonutChart } from '../components/charts'
import SubscriptionPanel from '../components/SubscriptionPanel'
import { daysLeft, fmtDate, greeting, num } from '../lib/format'
import {
  AppHeader,
  Brand,
  Button,
  Card,
  EASE,
  ErrorText,
  Field,
  Ground,
  LinkButton,
  Loading,
  Pill,
  inputCls,
} from '../components/kit'

const APP_BASE = import.meta.env.VITE_APP_BASE_URL || window.location.origin

type Tab = 'overview' | 'events' | 'subscription'
const TABS: Array<[Tab, string]> = [
  ['overview', 'Overview'],
  ['events', 'Events'],
  ['subscription', 'Subscription'],
]

const dateRange = (ev: LookitEvent) =>
  ev.event_date
    ? ev.end_date && ev.end_date !== ev.event_date
      ? `${fmtDate(ev.event_date)} – ${fmtDate(ev.end_date)}`
      : fmtDate(ev.event_date)
    : 'Date TBD'

const todayISO = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Reveal({ i = 0, className = '', children }: { i?: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.08 * i, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

function EventCard({ ev, i, onDelete }: { ev: LookitEvent; i: number; onDelete: (id: string) => void }) {
  const share = `${APP_BASE}/e/${ev.slug}`
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.6, delay: Math.min(i, 6) * 0.05, ease: EASE }}
      whileHover={{ y: -6 }}
      className="flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-soft"
    >
      <Link to={`/app/events/${ev.id}`} className="relative grid h-36 place-items-center overflow-hidden bg-ink text-white">
        {ev.banner_url ? (
          <img src={ev.banner_url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            <span className="absolute -right-6 -top-10 size-40 rounded-full bg-accent/60 blur-2xl" />
            <span className="absolute -bottom-12 -left-6 size-40 rounded-full bg-azure/50 blur-2xl" />
            <span className="relative text-6xl font-semibold tracking-tight">{ev.name.slice(0, 1).toUpperCase()}</span>
          </>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate text-lg font-semibold tracking-tight">{ev.name}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill>{dateRange(ev)}</Pill>
          <Pill>{ev.photo_count} photos</Pill>
          <Pill tint>{ev.visibility.replace('_', ' ')}</Pill>
        </div>
        <a className="mt-3 block truncate text-[13px] text-mute hover:text-accent" href={share} target="_blank" rel="noreferrer">
          {share}
        </a>
        <div className="mt-auto flex gap-2 pt-5">
          <LinkButton small to={`/app/events/${ev.id}`}>
            Open
          </LinkButton>
          <Button small variant="ghost" onClick={() => onDelete(ev.id)}>
            Delete
          </Button>
        </div>
      </div>
    </motion.article>
  )
}

export default function AppHomePage() {
  const { user, loading, logout } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab: Tab = TABS.some(([t]) => t === params.get('tab')) ? (params.get('tab') as Tab) : 'overview'
  const setTab = (t: Tab) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true })

  const [now] = useState(() => new Date())
  const [events, setEvents] = useState<LookitEvent[]>([])
  const [billing, setBilling] = useState<Billing | null>(null)
  const [daily, setDaily] = useState<Array<{ day: string; photos: number }>>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [activating, setActivating] = useState(false)
  const [notice, setNotice] = useState('')
  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [visibility, setVisibility] = useState<'selfie_only' | 'full_gallery'>('selfie_only')

  async function load() {
    const res = await eventsApi.list()
    setEvents(res.events)
  }

  function loadBilling() {
    billingApi.summary().then(setBilling).catch(() => undefined)
  }

  useEffect(() => {
    if (!user) return
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
    loadBilling()
    eventsApi.insights().then((r) => setDaily(r.daily_uploads)).catch(() => undefined)
  }, [user])

  useEffect(() => {
    if (!showCreate) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowCreate(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showCreate])

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await eventsApi.create({
        name: name.trim(),
        event_date: eventDate || null,
        end_date: endDate || null,
        visibility,
      })
      setName('')
      setEventDate('')
      setEndDate('')
      setShowCreate(false)
      await load()
      setTab('events')
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

  async function activateFree() {
    setActivating(true)
    setError('')
    try {
      const res = await billingApi.activateFreePlan()
      setNotice(res.message)
      loadBilling()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not activate the free plan')
    } finally {
      setActivating(false)
    }
  }

  function closeCreate() {
    setShowCreate(false)
    setError('')
  }

  const totalPhotos = events.reduce((n, ev) => n + ev.photo_count, 0)
  const today = todayISO(now)
  const live = events.filter((e) => e.event_date && e.event_date <= today && today <= (e.end_date || e.event_date))
  const upcoming = events
    .filter((e) => e.event_date && e.event_date > today)
    .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))
  const happening = [...live, ...upcoming].slice(0, 4)
  const top = [...events].sort((a, b) => b.photo_count - a.photo_count).slice(0, 5)

  const planEnds = billing?.current_plan?.expires_at ?? null
  const endsAfterPlan = Boolean(endDate && planEnds && new Date(endDate) > new Date(planEnds))
  const datesInvalid = Boolean(eventDate && endDate && endDate < eventDate)
  const totals = billing?.totals
  const offerFree = Boolean(billing && !billing.current_plan && billing.free_plan_available)
  const topupCount = billing?.topups?.count ?? 0

  const kpis: Array<[string, string, string]> = [
    ['Events', num(events.length), `${live.length} happening now`],
    ['Photos uploaded', num(totalPhotos), `${num(top[0]?.photo_count ?? 0)} in your top event`],
    ['Photos left', totals ? num(totals.remaining) : '–', totals ? `of ${num(totals.quota)}` : ''],
    [
      'Days left',
      billing?.current_plan ? String(daysLeft(billing.current_plan.expires_at)) : '–',
      billing?.current_plan ? `ends ${fmtDate(billing.current_plan.expires_at)}` : 'No active plan',
    ],
  ]

  return (
    <Ground>
      <div className="pt-3.5">
        <AppHeader
          left={<Brand />}
          right={
            <>
              <span className="hidden px-2 sm:inline">{user.studio_name || user.name}</span>
              {user.role === 'admin' ? (
                <Link className="rounded-full px-4 py-2 hover:text-ink" to="/admin">
                  Admin
                </Link>
              ) : null}
              <Button small variant="ghost" onClick={logout}>
                Sign out
              </Button>
            </>
          }
        />
      </div>

      <main className="mx-auto w-[min(1100px,92vw)] pb-24 pt-14">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Pill tint>
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Pill>
            <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
              {greeting(user.name, now)} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mute">
              {live.length
                ? `${live.length} ${live.length === 1 ? 'event is' : 'events are'} happening right now.`
                : upcoming.length
                  ? `Your next event, ${upcoming[0].name}, is on ${fmtDate(upcoming[0].event_date!)}.`
                  : 'Here’s how your studio is doing.'}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>+ New event</Button>
        </Reveal>

        <div className="mt-10 flex gap-1 rounded-full bg-black/[0.05] p-1 text-sm font-semibold sm:w-fit">
          {TABS.map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative flex-1 rounded-full px-5 py-2.5 transition-colors sm:flex-none sm:px-6 ${
                tab === t ? 'text-ink' : 'text-mute hover:text-ink'
              }`}
            >
              {tab === t ? (
                <motion.span
                  layoutId="dash-tab"
                  className="absolute inset-0 rounded-full bg-white shadow-soft"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              ) : null}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        {notice ? (
          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</p>
        ) : null}

        {offerFree ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative mt-6 overflow-hidden rounded-[2rem] bg-lime p-7 shadow-soft md:p-9"
          >
            <span aria-hidden className="absolute -right-10 -top-14 size-52 rounded-full bg-white/50 blur-2xl" />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <Pill>Welcome to Lookit</Pill>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
                  Start free for a month
                </h2>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink/70">
                  500 photos, 30 days, one event, with guest face search included. No card needed.
                </p>
              </div>
              <Button disabled={activating} onClick={() => void activateFree()}>
                {activating ? 'Activating…' : 'Activate free plan'}
              </Button>
            </div>
          </motion.div>
        ) : null}

        {error && !showCreate ? (
          <div className="mt-6">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}

        {tab === 'overview' ? (
          <div className="mt-8 grid gap-5">
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <Reveal i={0}>
                <div className="grid h-full gap-6 rounded-[2rem] bg-ink p-7 text-white shadow-lift md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[12.5px] font-semibold text-white/60">Current subscription</p>
                      <p className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
                        {billing?.current_plan ? billing.current_plan.name : billing ? 'No active plan' : '…'}
                      </p>
                      <p className="mt-1 text-sm text-white/60">
                        {billing?.current_plan
                          ? `${daysLeft(billing.current_plan.expires_at)} days left · ends ${fmtDate(billing.current_plan.expires_at)}${
                              topupCount ? ` · + ${topupCount} top-up${topupCount > 1 ? 's' : ''}` : ''
                            }`
                          : 'Choose a plan to upload photos'}
                      </p>
                    </div>
                    <LinkButton to="/app?tab=subscription" variant="light" small>
                      {billing?.current_plan ? 'Manage' : 'Choose a plan'}
                    </LinkButton>
                  </div>
                  {totals ? (
                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-4xl font-semibold tracking-[-0.04em]">{num(totals.remaining)}</span>
                        <span className="text-[12.5px] text-white/60">
                          photos left · {num(totals.used)} used of {num(totals.quota)}
                        </span>
                      </div>
                      <div className="mt-3">
                        <Meter dark used={totals.used} reserved={totals.reserved} quota={totals.quota} />
                      </div>
                    </div>
                  ) : null}
                </div>
              </Reveal>

              <Reveal i={1}>
                <Card className="h-full">
                  <h2 className="text-lg font-semibold tracking-tight">Photo allowance</h2>
                  <div className="mt-5">
                    {totals && totals.quota > 0 ? (
                      <DonutChart
                        value={`${Math.round((totals.remaining / totals.quota) * 100)}%`}
                        caption="remaining"
                        segments={[
                          { label: 'Remaining', value: totals.remaining, className: 'stroke-accent' },
                          { label: 'Used', value: totals.used + totals.reserved, className: 'stroke-ink' },
                        ]}
                      />
                    ) : (
                      <p className="py-8 text-center text-sm text-mute">No active plan yet.</p>
                    )}
                  </div>
                </Card>
              </Reveal>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {kpis.map(([label, value, hint], i) => (
                <Reveal key={label} i={i + 2}>
                  <div className="h-full rounded-[1.5rem] bg-white px-5 py-4 shadow-soft">
                    <p className="text-[12.5px] font-semibold text-mute">{label}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-[-0.03em]">{value}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-mute">{hint}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <Reveal i={6}>
                <Card className="h-full">
                  <h2 className="text-lg font-semibold tracking-tight">Uploads, last 14 days</h2>
                  <div className="mt-4">
                    {daily.length ? <AreaChart data={daily} /> : <p className="py-10 text-center text-sm text-mute">No uploads yet.</p>}
                  </div>
                </Card>
              </Reveal>
              <Reveal i={7}>
                <Card className="h-full">
                  <h2 className="text-lg font-semibold tracking-tight">Top events</h2>
                  <p className="mt-1 text-sm text-mute">By photos uploaded</p>
                  <div className="mt-5">
                    {top.length && top[0].photo_count > 0 ? (
                      <BarList items={top.map((e) => ({ id: e.id, label: e.name, value: e.photo_count }))} />
                    ) : (
                      <p className="py-6 text-center text-sm text-mute">Upload photos to see your top events.</p>
                    )}
                  </div>
                </Card>
              </Reveal>
            </div>

            <Reveal i={8}>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">Current &amp; upcoming events</h2>
                  <button type="button" onClick={() => setTab('events')} className="text-sm font-semibold text-accent hover:underline">
                    All events →
                  </button>
                </div>
                {happening.length === 0 ? (
                  <p className="py-8 text-center text-sm text-mute">
                    Nothing scheduled. Add a start date when you create an event and it shows up here.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-black/[0.06]">
                    {happening.map((ev) => {
                      const isLive = live.includes(ev)
                      return (
                        <li key={ev.id}>
                          <Link
                            to={`/app/events/${ev.id}`}
                            className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:text-accent"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink font-semibold text-white">
                                {ev.banner_url ? (
                                  <img src={ev.banner_url} alt="" className="size-full object-cover" />
                                ) : (
                                  ev.name.slice(0, 1).toUpperCase()
                                )}
                              </span>
                              <span className="min-w-0">
                                <strong className="block truncate text-[15px]">{ev.name}</strong>
                                <span className="text-[12.5px] text-mute">{dateRange(ev)}</span>
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <Pill>{ev.photo_count} photos</Pill>
                              {isLive ? (
                                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[12.5px] font-semibold text-emerald-700">
                                  Live now
                                </span>
                              ) : (
                                <Pill tint>Upcoming</Pill>
                              )}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </Reveal>
          </div>
        ) : null}

        {tab === 'events' ? (
          <div className="mt-8">
            {events.length === 0 ? (
              <Card className="text-center">
                <h2 className="text-xl font-semibold tracking-tight">No events yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-mute">
                  Create your first event to get a share link and QR code for guests.
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowCreate(true)}>+ New event</Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence initial={false}>
                  {events.map((ev, i) => (
                    <EventCard key={ev.id} ev={ev} i={i} onDelete={(id) => void onDelete(id)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : null}

        {tab === 'subscription' ? (
          <div className="mt-8">
            <SubscriptionPanel onChanged={loadBilling} />
          </div>
        ) : null}
      </main>

      <AnimatePresence>
        {showCreate ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCreate}
          >
            <motion.form
              onSubmit={onCreate}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="New event"
              className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-lift md:p-8"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">New event</h2>
                  <p className="mt-1 text-sm text-mute">You can upload photos right after.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeCreate}
                  className="grid size-9 place-items-center rounded-full bg-black/[0.05] text-lg text-mute hover:text-ink"
                >
                  ×
                </button>
              </div>
              <div className="mt-6 grid gap-4">
                <Field label="Name">
                  <input
                    className={inputCls}
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ananya & Rohan"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start date">
                    <input
                      className={inputCls}
                      type="date"
                      value={eventDate}
                      onChange={(e) => {
                        setEventDate(e.target.value)
                        if (endDate && e.target.value > endDate) setEndDate(e.target.value)
                      }}
                    />
                  </Field>
                  <Field label="End date">
                    <input
                      className={inputCls}
                      type="date"
                      min={eventDate || undefined}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Field>
                </div>
                {endsAfterPlan && planEnds ? (
                  <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700">
                    Your plan ends on {fmtDate(planEnds)}, before this event ends. Uploads stop then, so renew or
                    add a plan first.
                  </p>
                ) : null}
                <Field label="Visibility">
                  <select
                    className={inputCls}
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'selfie_only' | 'full_gallery')}
                  >
                    <option value="selfie_only">Selfie results only</option>
                    <option value="full_gallery">Browse all photos</option>
                  </select>
                </Field>
              </div>
              {error ? (
                <div className="mt-4">
                  <ErrorText>{error}</ErrorText>
                </div>
              ) : null}
              <div className="mt-6 flex gap-3">
                <Button type="submit" disabled={busy || datesInvalid}>
                  {busy ? 'Saving…' : 'Create event'}
                </Button>
                <Button variant="ghost" onClick={closeCreate}>
                  Cancel
                </Button>
              </div>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Ground>
  )
}
