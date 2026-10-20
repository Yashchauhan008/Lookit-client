import { useState } from 'react'
import { motion } from 'framer-motion'
import { EASE } from './kit'
import { num } from '../lib/format'

type Segment = { label: string; value: number; className: string }

/** Ring chart. Segments animate in one after another; the centre shows the headline figure. */
export function DonutChart({
  segments,
  value,
  caption,
}: {
  segments: Segment[]
  value: string
  caption: string
}) {
  const R = 52
  const C = 2 * Math.PI * R
  const total = segments.reduce((s, x) => s + x.value, 0)
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="12" className="stroke-black/[0.07]" />
          {total > 0
            ? segments.map((s, i) => {
                const len = (s.value / total) * C
                const el = (
                  <motion.circle
                    key={s.label}
                    cx="60"
                    cy="60"
                    r={R}
                    fill="none"
                    strokeWidth="12"
                    strokeLinecap="butt"
                    className={s.className}
                    strokeDashoffset={-offset}
                    initial={{ strokeDasharray: `0 ${C}` }}
                    animate={{ strokeDasharray: `${Math.max(0, len - 1.5)} ${C}` }}
                    transition={{ duration: 1, delay: 0.15 * i, ease: EASE }}
                  />
                )
                offset += len
                return el
              })
            : null}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <span className="text-2xl font-semibold tracking-[-0.03em]">{value}</span>
          <span className="text-[11.5px] font-medium text-mute">{caption}</span>
        </div>
      </div>
      <ul className="grid w-full gap-2.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-mute">
              <span className={`size-2.5 rounded-full ${s.className.replace('stroke-', 'bg-')}`} />
              {s.label}
            </span>
            <strong className="font-semibold">{num(s.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Smooth area/line chart with hover read-out. */
export function AreaChart({ data }: { data: Array<{ day: string; photos: number }> }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 600
  const H = 170
  const PAD = { t: 16, b: 8, x: 8 }
  const max = Math.max(1, ...data.map((d) => d.photos))
  const pts = data.map((d, i) => ({
    x: PAD.x + (i / Math.max(1, data.length - 1)) * (W - PAD.x * 2),
    y: PAD.t + (1 - d.photos / max) * (H - PAD.t - PAD.b),
  }))

  const line = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = pts[i - 1]
    const mx = (prev.x + p.x) / 2
    return `${acc} C${mx},${prev.y} ${mx},${p.y} ${p.x},${p.y}`
  }, '')
  const area = pts.length ? `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z` : ''
  const active = hover ?? data.length - 1
  const fmt = (s: string) =>
    new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-semibold tracking-[-0.03em]">
          {data[active] ? num(data[active].photos) : 0}
          <span className="ml-2 text-sm font-medium text-mute">
            photos · {data[active] ? fmt(data[active].day) : ''}
          </span>
        </p>
      </div>
      <div className="relative mt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-44 w-full" preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} className="stroke-black/[0.06]" strokeDasharray="4 6" />
          ))}
          <motion.path d={area} fill="url(#area-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }} />
          <motion.path
            d={line}
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="stroke-accent"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: EASE }}
          />
          {pts.map((p, i) => (
            <rect
              key={data[i].day}
              x={p.x - (W / data.length) / 2}
              y={0}
              width={W / data.length}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>
        {pts[active] ? (
          <span
            className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow"
            style={{ left: `${(pts[active].x / W) * 100}%`, top: `${(pts[active].y / H) * 100}%` }}
          />
        ) : null}
      </div>
      <div className="mt-1 flex justify-between text-[11.5px] font-medium text-mute">
        <span>{data[0] ? fmt(data[0].day) : ''}</span>
        <span>{data.length ? fmt(data[data.length - 1].day) : ''}</span>
      </div>
    </div>
  )
}

/** Horizontal ranked bars. */
export function BarList({ items }: { items: Array<{ id: string; label: string; value: number; to?: string }> }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="grid gap-4">
      {items.map((it, i) => (
        <li key={it.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{it.label}</span>
            <span className="shrink-0 text-mute">{num(it.value)}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-black/[0.07]">
            <motion.div
              className={`h-full rounded-full ${i === 0 ? 'bg-accent' : 'bg-ink'}`}
              initial={{ width: 0 }}
              animate={{ width: `${(it.value / max) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.08 * i, ease: EASE }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
