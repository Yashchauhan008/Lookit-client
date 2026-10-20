import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { EVENT_SHOTS } from '../marketing/content'
import { Brand, EASE, Ground, LogoMark } from './kit'

const TILTS = [
  { src: EVENT_SHOTS[0], rotate: -8, x: -70, y: 10, delay: 0 },
  { src: EVENT_SHOTS[3], rotate: 3, x: 0, y: -26, delay: 0.1 },
  { src: EVENT_SHOTS[1], rotate: 10, x: 74, y: 14, delay: 0.2 },
]

export default function AuthShell({
  title,
  sub,
  children,
  footer,
}: {
  title: string
  sub?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Ground>
      <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative m-4 hidden overflow-hidden rounded-[2.5rem] bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-2 text-[17px] font-bold">
            <span className="text-accent">
              <LogoMark />
            </span>
            Lookit
          </div>

          <div className="relative mx-auto h-[330px] w-[240px]">
            {TILTS.map((t, i) => (
              <motion.img
                key={t.src}
                src={t.src}
                alt=""
                className="absolute inset-0 size-full rounded-[1.6rem] border-[3px] border-white object-cover shadow-lift"
                initial={{ opacity: 0, y: 80, rotate: 0, x: 0 }}
                animate={{ opacity: 1, y: t.y, rotate: t.rotate, x: t.x }}
                transition={{ duration: 1, delay: 0.2 + t.delay, ease: EASE }}
                style={{ zIndex: i }}
              />
            ))}
            <motion.span
              className="absolute -left-10 top-2 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              @riya
            </motion.span>
            <motion.span
              className="absolute -right-8 bottom-10 z-10 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.4, repeat: Infinity }}
            >
              98% match
            </motion.span>
          </div>

          <div>
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.04em]">
              Find every face.
              <br />
              <span className="text-white/50">Deliver every moment.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm text-white/60">
              Upload once. Guests take one selfie and see only the photos they appear in.
            </p>
          </div>
        </aside>

        <main className="grid place-items-center px-5 py-10">
          <motion.div
            className="w-full max-w-[420px]"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="mb-8 lg:hidden">
              <Brand />
            </div>
            <div className="rounded-[2rem] bg-white p-7 shadow-soft md:p-9">
              <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.03em]">{title}</h1>
              {sub ? <p className="mt-2 text-sm leading-relaxed text-mute">{sub}</p> : null}
              <div className="mt-7">{children}</div>
            </div>
            {footer ? <p className="mt-6 text-center text-sm text-mute">{footer}</p> : null}
          </motion.div>
        </main>
      </div>
    </Ground>
  )
}
