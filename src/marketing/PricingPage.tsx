import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ADDONS, MONTHLY, PRICING_FAQ, SEASON, TRIAL, inr } from './content'
import { Block, Btn, PageHead, Pill, Reveal } from './ui'

const MODES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'season', label: 'Season Pass' },
] as const

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-black/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-semibold"
      >
        {q}
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="text-2xl font-light text-mute">
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[15px] leading-relaxed text-mute">{a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function PricingPage() {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('monthly')
  const plans = mode === 'monthly' ? MONTHLY : SEASON
  const period = mode === 'monthly' ? '30 days' : '2 months'

  return (
    <>
      <PageHead
        pill="Plans"
        title="Pricing & Plans"
        sub="Simple, transparent pricing designed to scale with your studio. Compare plans and pick the one that fits. Prepaid, with no long-term commitments."
      />

      <Block>
        <div className="relative mx-auto mb-12 grid w-[270px] grid-cols-2 rounded-full bg-white p-1 shadow-soft" role="tablist">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`relative z-10 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                mode === m.id ? 'text-white' : 'text-mute'
              }`}
            >
              {mode === m.id ? (
                <motion.span
                  layoutId="toggle-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-ink"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              ) : null}
              {m.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="grid gap-5 md:grid-cols-3"
            initial="hidden"
            animate="show"
            exit="out"
            variants={{ show: { transition: { staggerChildren: 0.09 } }, out: { opacity: 0, transition: { duration: 0.15 } } }}
          >
            {plans.map((p, i) => (
              <motion.article
                key={p.code}
                variants={{
                  hidden: { opacity: 0, y: 60, rotate: (i - 1) * 4 },
                  show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
                }}
                whileHover={{ y: -10, rotate: (i - 1) * -0.8 }}
                className={`relative flex flex-col rounded-[2rem] p-8 shadow-soft ${
                  p.featured ? 'bg-accent text-white md:-translate-y-3' : 'bg-white'
                }`}
              >
                {p.featured ? (
                  <span className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-accent">
                    Popular
                  </span>
                ) : null}
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
                  {inr(p.price)}
                  <span className={`ml-1 text-sm font-normal tracking-normal ${p.featured ? 'text-white/75' : 'text-mute'}`}>
                    / {period}
                  </span>
                </p>
                <ul className={`my-7 grid flex-1 gap-3 text-[15px] ${p.featured ? 'text-white/90' : 'text-ink/75'}`}>
                  {[
                    `${p.photos.toLocaleString('en-IN')} photos`,
                    'Unlimited events',
                    'AI face search for guests',
                    'Shareable link & QR',
                    '90-day photo retention',
                    p.whiteLabel ? 'White-label guest pages' : '“Powered by Lookit” badge',
                    ...(p.team ? [`${p.team} team logins`] : []),
                  ].map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <span className={p.featured ? 'text-white' : 'text-accent'}>✦</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <Btn to="/register" variant={p.featured ? 'light' : 'dark'}>
                  Get {p.name}
                </Btn>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        <Reveal className="mt-6 flex flex-col items-start justify-between gap-5 rounded-[2rem] border border-dashed border-accent/50 p-7 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-semibold">Free plan</h3>
            <p className="mt-1 text-[15px] text-mute">
              {TRIAL.photos} photos for {TRIAL.days} days, one event. Activate it in one click from
              your dashboard. No card needed.
            </p>
          </div>
          <Btn to="/register" variant="ghost">
            Start Free Trial
          </Btn>
        </Reveal>
      </Block>

      <Block>
        <Reveal className="text-center">
          <Pill tint>Add-ons</Pill>
          <h2 className="mt-5 text-[clamp(2rem,4.4vw,3.4rem)] font-semibold tracking-[-0.04em]">
            Need more photos?
          </h2>
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-md gap-5">
          {ADDONS.map((a) => (
            <Reveal key={a.name} className="rounded-[2rem] bg-white p-8 text-center shadow-soft">
              <h3 className="text-lg font-semibold">{a.name}</h3>
              <p className="mt-3 text-5xl font-semibold tracking-[-0.04em]">{inr(a.price)}</p>
              <p className="mt-3 text-[15px] text-mute">{a.body}</p>
            </Reveal>
          ))}
        </div>
      </Block>

      <Block>
        <Reveal className="text-center">
          <Pill tint>FAQ</Pill>
          <h2 className="mt-5 text-[clamp(2rem,4.4vw,3.4rem)] font-semibold tracking-[-0.04em]">
            Good to know
          </h2>
        </Reveal>
        <Reveal className="mx-auto mt-10 max-w-3xl border-t border-black/10">
          {PRICING_FAQ.map((f) => (
            <Faq key={f.q} {...f} />
          ))}
        </Reveal>
      </Block>
    </>
  )
}
