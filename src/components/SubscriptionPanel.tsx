import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { billingApi, type Billing, type Order, type Plan } from '../lib/api'
import { PurchaseList, ResourceCard } from './billing'
import { fmtDate, inr, num } from '../lib/format'
import { Button, Card, EASE, ErrorText, Field, Pill, inputCls } from './kit'

type Upi = { upi_id?: string; payee_name?: string } | null

const GROUPS: Array<[Plan['kind'], string]> = [
  ['monthly', 'Monthly plans'],
  ['season', 'Season passes'],
  ['topup', 'Top-ups'],
]

const ORDER_LABEL: Record<Order['status'], string> = {
  pending_payment: 'Awaiting payment',
  submitted: 'Under review',
  approved: 'Activated',
  rejected: 'Rejected',
  expired: 'Expired',
}

export default function SubscriptionPanel({ onChanged }: { onChanged?: () => void }) {
  const [data, setData] = useState<(Billing & { orders: Order[] }) | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [upi, setUpi] = useState<Upi>(null)
  const [picked, setPicked] = useState<Plan | null>(null)
  const [utr, setUtr] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const [summary, catalog] = await Promise.all([billingApi.summary(), billingApi.plans()])
    setData(summary)
    setPlans(catalog.plans.filter((p) => p.kind !== 'trial'))
    setUpi(catalog.upi)
  }, [])

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [load])

  async function request() {
    if (!picked) return
    setBusy(true)
    setError('')
    try {
      await billingApi.order({ plan_code: picked.code, utr: utr.trim() || null })
      setNotice(`Request sent for ${picked.name}. We’ll activate it once the payment is confirmed.`)
      setPicked(null)
      setUtr('')
      await load()
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
        {error ? (
          <div className="mt-6">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}
        {notice ? (
          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</p>
        ) : null}

        <Card className="mt-8">{data ? <ResourceCard billing={data} /> : <p className="text-mute">Loading…</p>}</Card>

        {data && data.orders.some((o) => o.status === 'pending_payment' || o.status === 'submitted') ? (
          <Card className="mt-6">
            <h2 className="text-xl font-semibold tracking-tight">Open requests</h2>
            <ul className="mt-4 grid gap-3">
              {data.orders
                .filter((o) => o.status === 'pending_payment' || o.status === 'submitted')
                .map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-paper px-4 py-3 text-sm">
                    <span>
                      <strong>{o.plan_name}</strong> · {inr(o.amount_inr)} · ref <code>{o.ref_code}</code>
                    </span>
                    <Pill tint>{ORDER_LABEL[o.status]}</Pill>
                  </li>
                ))}
            </ul>
          </Card>
        ) : null}

        <Card className="mt-6">
          <h2 className="text-xl font-semibold tracking-tight">Photo packs</h2>
          <p className="mt-1 text-sm text-mute">Each plan or top-up adds its own bucket. Older buckets are used first.</p>
          <div className="mt-5">
            <PurchaseList purchases={data?.purchases ?? []} />
          </div>
        </Card>

        <h2 className="mt-14 text-2xl font-semibold tracking-tight">Add a plan or top-up</h2>
        {GROUPS.map(([kind, label]) => {
          const list = plans.filter((p) => p.kind === kind)
          if (list.length === 0) return null
          return (
            <div key={kind} className="mt-6">
              <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-wider text-mute">{label}</p>
              <div className="grid gap-4 md:grid-cols-3">
                {list.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
                    whileHover={{ y: -4 }}
                    className={`rounded-[1.75rem] bg-white p-6 shadow-soft ring-2 transition-shadow ${
                      picked?.id === p.id ? 'ring-ink' : 'ring-transparent'
                    }`}
                  >
                    <h3 className="text-lg font-semibold tracking-tight">{p.name}</h3>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{inr(p.price_inr)}</p>
                    <p className="mt-1 text-sm text-mute">
                      {num(p.photo_quota)} photos · {p.duration_days} days
                    </p>
                    <div className="mt-5">
                      <Button small variant={picked?.id === p.id ? 'dark' : 'ghost'} onClick={() => setPicked(p)}>
                        {picked?.id === p.id ? 'Selected' : 'Choose'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}

        <AnimatePresence>
          {picked ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-8 rounded-[2rem] bg-ink p-7 text-white shadow-lift md:p-9"
            >
              <h3 className="text-2xl font-semibold tracking-tight">
                {picked.name} · {inr(picked.price_inr)}
              </h3>
              <p className="mt-2 text-sm text-white/65">
                Pay by UPI{upi?.upi_id ? ` to ${upi.upi_id}` : ''}
                {upi?.payee_name ? ` (${upi.payee_name})` : ''}, then send the request with your UTR. An admin
                activates it right after confirming.
              </p>
              <div className="mt-5 max-w-sm text-ink">
                <Field label="UTR / transaction ID (optional)">
                  <input className={inputCls} value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 412345678901" />
                </Field>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="light" disabled={busy} onClick={() => void request()}>
                  {busy ? 'Sending…' : 'Send request'}
                </Button>
                <Button variant="ghostLight" onClick={() => setPicked(null)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {data && data.orders.length > 0 ? (
          <Card className="mt-10">
            <h2 className="text-xl font-semibold tracking-tight">History</h2>
            <ul className="mt-4 divide-y divide-black/[0.06] text-sm">
              {data.orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span>
                    {o.plan_name} · {inr(o.amount_inr)}
                    <span className="ml-2 text-mute">{fmtDate(o.created_at)}</span>
                  </span>
                  <span className="text-mute">
                    {ORDER_LABEL[o.status]}
                    {o.reject_reason ? ` — ${o.reject_reason}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
    </div>
  )
}
