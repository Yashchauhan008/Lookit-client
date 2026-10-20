import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../lib/auth'
import {
  adminApi,
  type AdminOrder,
  type AdminUserRow,
  type Billing,
  type Plan,
} from '../lib/api'
import { Meter, PurchaseList, ResourceCard } from '../components/billing'
import { fmtDate, inr, num } from '../lib/format'
import {
  AppHeader,
  Brand,
  Button,
  Card,
  EASE,
  ErrorText,
  Ground,
  Loading,
  PageTitle,
  Pill,
  inputCls,
} from '../components/kit'

type Stats = Awaited<ReturnType<typeof adminApi.overview>>['stats']
type Tab = 'requests' | 'accounts'
type Detail = Billing & { user: { id: string; name: string; email: string; studio_name: string | null } }

const errMsg = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong')

function Requests({ onChange, notify }: { onChange: () => void; notify: (m: string) => void }) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setOrders((await adminApi.orders('open')).orders)
  }, [])

  useEffect(() => {
    void load().catch((e) => setError(errMsg(e)))
  }, [load])

  async function decide(o: AdminOrder, decision: 'approve' | 'reject') {
    let reason: string | null = null
    if (decision === 'reject') {
      reason = window.prompt('Reason for rejecting (shown to the customer)?')
      if (reason === null) return
    }
    setBusy(o.id)
    setError('')
    try {
      const res = await adminApi.review(o.id, { decision, reason })
      notify(res.message)
      await load()
      onChange()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="grid gap-4">
      {error ? <ErrorText>{error}</ErrorText> : null}
      {orders && orders.length === 0 ? (
        <p className="py-10 text-center text-mute">No open requests. You’re all caught up.</p>
      ) : null}
      <AnimatePresence initial={false}>
        {(orders ?? []).map((o) => (
          <motion.article
            key={o.id}
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex flex-col gap-4 rounded-[1.75rem] bg-white p-6 shadow-soft md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight">{o.plan_name}</h3>
                <Pill tint>{inr(o.amount_inr)}</Pill>
                <Pill>{o.status === 'submitted' ? 'UTR sent' : 'No UTR yet'}</Pill>
              </div>
              <p className="mt-2 truncate text-sm text-mute">
                {o.user_name} · {o.user_email}
              </p>
              <p className="mt-1 text-[12.5px] text-mute">
                Ref <code>{o.ref_code}</code>
                {o.utr ? ` · UTR ${o.utr}` : ''} · {fmtDate(o.created_at)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button small disabled={busy === o.id} onClick={() => void decide(o, 'approve')}>
                Approve & activate
              </Button>
              <Button small variant="ghost" disabled={busy === o.id} onClick={() => void decide(o, 'reject')}>
                Reject
              </Button>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  )
}

function CustomerPanel({
  id,
  plans,
  onClose,
  onChange,
  notify,
}: {
  id: string
  plans: Plan[]
  onClose: () => void
  onChange: () => void
  notify: (m: string) => void
}) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setDetail(await adminApi.user(id))
  }, [id])

  useEffect(() => {
    void load().catch((e) => setError(errMsg(e)))
  }, [load])

  async function run(fn: () => Promise<{ message: string }>) {
    setBusy(true)
    setError('')
    try {
      notify((await fn()).message)
      await load()
      onChange()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  function activate(p: Plan) {
    if (!confirm(`Activate ${p.name} (${num(p.photo_quota)} photos) for ${detail?.user.email}?`)) return
    void run(() => adminApi.grant(id, { plan_code: p.code }))
  }

  const groups: Array<[string, Plan[]]> = [
    ['Plans', plans.filter((p) => p.kind === 'monthly')],
    ['Season passes', plans.filter((p) => p.kind === 'season')],
    ['Top-ups & free plan', plans.filter((p) => p.kind === 'topup' || p.kind === 'trial')],
  ]

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-xl overflow-y-auto bg-paper p-6 shadow-lift md:rounded-l-[2.25rem] md:p-8"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.5, ease: EASE }}
        data-lenis-prevent
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold tracking-tight">{detail?.user.name ?? 'Loading…'}</h2>
            <p className="truncate text-sm text-mute">
              {detail?.user.email}
              {detail?.user.studio_name ? ` · ${detail.user.studio_name}` : ''}
            </p>
          </div>
          <Button small variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {error ? (
          <div className="mt-4">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}

        {detail ? (
          <>
            <Card className="mt-6 !p-5">
              <ResourceCard billing={detail} />
            </Card>

            <h3 className="mt-8 text-lg font-semibold tracking-tight">Activate instantly</h3>
            <p className="mt-1 text-sm text-mute">Takes effect immediately and is recorded in the audit log.</p>
            {groups.map(([label, list]) =>
              list.length ? (
                <div key={label} className="mt-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-mute">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {list.map((p) => (
                      <Button key={p.id} small variant="ghost" disabled={busy} onClick={() => activate(p)}>
                        {p.kind === 'trial' ? p.name : `${p.name.replace(/ \(.*\)/, '')} · ${inr(p.price_inr)}`}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null,
            )}

            <h3 className="mt-8 text-lg font-semibold tracking-tight">Photo packs</h3>
            <div className="mt-3">
              <PurchaseList
                purchases={detail.purchases}
                action={(p) =>
                  p.live ? (
                    <button
                      type="button"
                      className="text-[12.5px] font-semibold text-red-600 hover:underline"
                      onClick={() => {
                        if (confirm(`Revoke ${p.plan_name}? The customer loses its remaining photos.`))
                          void run(() => adminApi.revoke(p.id))
                      }}
                    >
                      Revoke
                    </button>
                  ) : null
                }
              />
            </div>
          </>
        ) : null}
      </motion.aside>
    </motion.div>
  )
}

function Customers({
  plans,
  onChange,
  notify,
}: {
  plans: Plan[]
  onChange: () => void
  notify: (m: string) => void
}) {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<AdminUserRow[] | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      adminApi
        .users(q)
        .then((r) => setRows(r.users))
        .catch((e) => setError(errMsg(e)))
    }, 250)
    return () => clearTimeout(t)
  }, [q, tick])

  return (
    <div>
      <input
        className={`${inputCls} max-w-md`}
        placeholder="Search accounts by name, email or studio"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error ? (
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      ) : null}
      <div className="mt-5 grid gap-3">
        {rows && rows.length === 0 ? <p className="py-10 text-center text-mute">No accounts found.</p> : null}
        {(rows ?? []).map((u, i) => {
          const remaining = Math.max(0, u.quota - u.used - u.reserved)
          return (
            <motion.button
              key={u.id}
              type="button"
              onClick={() => setOpen(u.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.03, ease: EASE }}
              whileHover={{ y: -3 }}
              className="grid gap-3 rounded-[1.5rem] bg-white p-5 text-left shadow-soft md:grid-cols-[1.3fr_1fr_1fr] md:items-center"
            >
              <span className="min-w-0">
                <strong className="block truncate text-[15px]">
                  {u.name}
                  {u.role === 'admin' ? (
                    <span className="ml-2 rounded-full bg-ink px-2 py-0.5 align-middle text-[10.5px] font-semibold text-white">
                      Admin
                    </span>
                  ) : null}
                </strong>
                <span className="block truncate text-sm text-mute">{u.email}</span>
              </span>
              <span className="text-sm">
                {u.plan_name ? <Pill tint>{u.plan_name}</Pill> : <Pill>No plan</Pill>}
                <span className="mt-1 block text-[12.5px] text-mute">
                  {u.expires_at ? `until ${fmtDate(u.expires_at)}` : 'Not active'} · {u.events} events
                </span>
              </span>
              <span>
                <span className="flex justify-between text-[12.5px] text-mute">
                  <span>{num(remaining)} left</span>
                  <span>{num(u.quota)}</span>
                </span>
                <span className="mt-1.5 block">
                  <Meter used={u.used} reserved={u.reserved} quota={u.quota} />
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {open ? (
          <CustomerPanel
            key={open}
            id={open}
            plans={plans}
            onClose={() => setOpen(null)}
            onChange={() => {
              setTick((n) => n + 1)
              onChange()
            }}
            notify={notify}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function AdminHomePage() {
  const { user, loading, logout } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [tab, setTab] = useState<Tab>('requests')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [rev, setRev] = useState(0)

  const refresh = useCallback(() => {
    adminApi
      .overview()
      .then((r) => {
        setStats(r.stats)
        setPlans(r.plans)
      })
      .catch((e) => setError(errMsg(e)))
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') refresh()
  }, [user, refresh])

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/app" replace />

  const tiles: Array<[string, string]> = stats
    ? [
        ['Accounts', num(stats.customers)],
        ['Active plans', num(stats.active_customers)],
        ['Open requests', num(stats.pending_orders)],
        ['Photos used', num(stats.photos_used)],
        ['Revenue', inr(stats.revenue_inr)],
      ]
    : []

  return (
    <Ground>
      <div className="pt-3.5">
        <AppHeader
          left={<Brand label="Lookit Admin" />}
          right={
            <>
              <Link className="rounded-full px-4 py-2 hover:text-ink" to="/app">
                Studio
              </Link>
              <Button small variant="ghost" onClick={logout}>
                Sign out
              </Button>
            </>
          }
        />
      </div>
      <main className="mx-auto w-[min(1100px,92vw)] pb-24 pt-14">
        <PageTitle
          pill="Admin"
          title="Operations"
          sub="Activate plans and top-ups, approve UPI requests and see what each customer has left."
        />

        {error ? (
          <div className="mt-6">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {tiles.map(([label, value], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: EASE }}
              className={`rounded-[1.5rem] bg-white px-5 py-4 shadow-soft ${
                i === tiles.length - 1 ? 'col-span-2 md:col-span-1' : ''
              }`}
            >
              <p className="text-[12.5px] font-semibold text-mute">{label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex gap-1 rounded-full bg-black/[0.05] p-1 text-sm font-semibold sm:w-fit">
          {(['requests', 'accounts'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`relative rounded-full px-6 py-2.5 capitalize transition-colors ${
                tab === t ? 'text-ink' : 'text-mute hover:text-ink'
              }`}
            >
              {tab === t ? (
                <motion.span
                  layoutId="admin-tab"
                  className="absolute inset-0 -z-0 rounded-full bg-white shadow-soft"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              ) : null}
              <span className="relative">
                {t}
                {t === 'requests' && stats?.pending_orders ? ` (${stats.pending_orders})` : ''}
              </span>
            </button>
          ))}
        </div>

        {notice ? (
          <motion.p
            key={notice}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
          >
            {notice}
          </motion.p>
        ) : null}

        <div className="mt-6">
          {tab === 'requests' ? (
            <Requests key={rev} onChange={refresh} notify={setNotice} />
          ) : (
            <Customers
              plans={plans}
              onChange={() => {
                refresh()
                setRev((n) => n + 1)
              }}
              notify={setNotice}
            />
          )}
        </div>
      </main>
    </Ground>
  )
}
