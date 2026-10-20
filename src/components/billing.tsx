import { motion } from 'framer-motion'
import type { Billing, Purchase } from '../lib/api'
import { EASE, Pill } from './kit'
import { daysLeft, fmtDate, num } from '../lib/format'

/** Fills with what's LEFT, so a full bar means nothing used yet. Turns red when nearly out. */
export function Meter({
  used,
  reserved = 0,
  quota,
  dark = false,
}: {
  used: number
  reserved?: number
  quota: number
  dark?: boolean
}) {
  const left = Math.max(0, quota - used - reserved)
  const pct = quota > 0 ? (left / quota) * 100 : 0
  const low = quota > 0 && pct < 15
  return (
    <div
      role="progressbar"
      aria-label="Photos remaining"
      aria-valuemin={0}
      aria-valuemax={quota}
      aria-valuenow={left}
      className={`h-3 w-full overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-black/[0.07]'}`}
    >
      <motion.div
        className={`h-full rounded-full ${low ? 'bg-red-500' : dark ? 'bg-lime' : 'bg-accent'}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: EASE }}
      />
    </div>
  )
}

const KIND_LABEL: Record<string, string> = {
  monthly: 'Monthly',
  season: 'Season pass',
  topup: 'Top-up',
  trial: 'Free plan',
}

/** Plan + remaining-resource summary. Identical for the customer and the admin looking at them. */
export function ResourceCard({ billing }: { billing: Billing }) {
  const { current_plan: plan, totals, usage } = billing
  const topups = billing.topups ?? { count: 0, quota: 0, remaining: 0 }
  const ent = plan?.entitlements

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tint>{plan ? KIND_LABEL[plan.kind] : 'No active plan'}</Pill>
          {plan ? <Pill>{daysLeft(plan.expires_at)} days left</Pill> : null}
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{plan ? plan.name : 'Nothing active'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          {plan
            ? `Uploads open until ${fmtDate(plan.expires_at)}. Photos stay available until ${fmtDate(plan.retention_end)}.`
            : 'Pick a plan to keep uploading photos to your events.'}
        </p>
        {ent ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {topups.count ? <Pill tint>+ {topups.count} top-up{topups.count > 1 ? 's' : ''} ({num(topups.quota)} photos)</Pill> : null}
            <Pill>{ent.white_label ? 'White-label' : 'Lookit badge'}</Pill>
            {ent.team_logins ? <Pill>{ent.team_logins} team logins</Pill> : null}
            <Pill>{ent.max_events ? `${ent.max_events} event` : 'Unlimited events'}</Pill>
          </div>
        ) : null}
      </div>

      <div className="rounded-[1.5rem] bg-paper p-5">
        <p className="text-[12.5px] font-semibold text-mute">Photos remaining</p>
        <p className="mt-1 text-5xl font-semibold tracking-[-0.04em]">{num(totals.remaining)}</p>
        <div className="mt-4">
          <Meter used={totals.used} reserved={totals.reserved} quota={totals.quota} />
        </div>
        <div className="mt-3 flex justify-between text-[12.5px] text-mute">
          <span>{num(totals.used)} used</span>
          <span>{num(totals.quota)} total</span>
        </div>
        <p className="mt-3 text-[12.5px] text-mute">
          {usage.events} {usage.events === 1 ? 'event' : 'events'} · {num(usage.photos)} photos uploaded
        </p>
      </div>
    </div>
  )
}

const STATUS_STYLE: Record<Purchase['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700',
  exhausted: 'bg-amber-50 text-amber-700',
  expired: 'bg-black/5 text-mute',
  revoked: 'bg-red-50 text-red-600',
}

export function PurchaseList({
  purchases,
  action,
}: {
  purchases: Purchase[]
  action?: (p: Purchase) => React.ReactNode
}) {
  if (purchases.length === 0) return <p className="py-6 text-sm text-mute">No plans activated yet.</p>
  return (
    <ul className="grid gap-3">
      {purchases.map((p) => (
        <li key={p.id} className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <strong className="text-[15px]">{p.plan_name}</strong>
              <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${STATUS_STYLE[p.status]}`}>
                {p.status}
              </span>
            </div>
            {action?.(p)}
          </div>
          <div className="mt-3">
            <Meter used={p.photos_used} reserved={p.photos_reserved} quota={p.photo_quota} />
          </div>
          <p className="mt-2 text-[12.5px] text-mute">
            {num(p.remaining)} of {num(p.photo_quota)} left · uploads until {fmtDate(p.upload_window_end)}
          </p>
        </li>
      ))}
    </ul>
  )
}
