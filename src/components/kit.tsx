import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export const EASE = [0.16, 1, 0.3, 1] as const

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9.5" r="3.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.5 19c1.4-2.8 3.8-4.2 6.5-4.2S17.1 16.2 18.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Brand({ to = '/', label = 'Lookit' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
      <span className="text-accent">
        <LogoMark />
      </span>
      {label}
    </Link>
  )
}

export const VARIANTS = {
  dark: 'bg-ink text-white hover:bg-black',
  light: 'bg-white text-ink hover:bg-white/90',
  accent: 'bg-accent text-white hover:bg-[#f05a1b]',
  ghost: 'border border-black/10 bg-white/70 text-ink hover:bg-white',
  ghostLight: 'border border-white/30 text-white hover:bg-white/10',
}

type Variant = keyof typeof VARIANTS

const btnClass = (variant: Variant, small: boolean, className: string) =>
  `inline-flex items-center justify-center rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${
    small ? 'px-5 py-2.5 text-[13px]' : 'px-7 py-3.5 text-[15px]'
  } ${VARIANTS[variant]} ${className}`

const wrap = (className: string) => (className.includes('w-full') ? 'block' : 'inline-block')

export function LinkButton({
  to,
  variant = 'dark',
  small = false,
  className = '',
  children,
}: {
  to: string
  variant?: Variant
  small?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <motion.span className={wrap(className)} whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <Link to={to} className={btnClass(variant, small, className)}>
        {children}
      </Link>
    </motion.span>
  )
}

export function Button({
  variant = 'dark',
  small = false,
  className = '',
  children,
  disabled,
  ...rest
}: { variant?: Variant; small?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.span
      className={wrap(className)}
      whileHover={disabled ? undefined : { y: -2, scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
    >
      <button type="button" disabled={disabled} className={btnClass(variant, small, className)} {...rest}>
        {children}
      </button>
    </motion.span>
  )
}

/** Download / external anchors styled like buttons. */
export function AnchorButton({
  variant = 'ghost',
  small = false,
  className = '',
  children,
  ...rest
}: { variant?: Variant; small?: boolean } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <motion.span className={wrap(className)} whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <a className={btnClass(variant, small, className)} {...rest}>
        {children}
      </a>
    </motion.span>
  )
}

export function Pill({ children, tint = false }: { children: ReactNode; tint?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${
        tint ? 'bg-accent/10 text-[#c2410c]' : 'border border-black/10 bg-white text-ink shadow-sm'
      }`}
    >
      {children}
    </span>
  )
}

export const inputCls =
  'w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-mute/60 focus:border-ink focus:ring-4 focus:ring-black/5'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[12.5px] font-semibold text-mute">
      {label}
      {children}
    </label>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <motion.p
      role="alert"
      className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.p>
  )
}

export function Card({
  className = '',
  children,
  ...rest
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`rounded-[2rem] bg-white p-6 shadow-soft md:p-8 ${className}`} {...rest}>
      {children}
    </section>
  )
}

/** Light page ground with soft colour wash, shared by every non-marketing screen. */
export function Ground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh bg-paper text-ink">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(255,106,43,0.09),transparent),radial-gradient(50%_45%_at_90%_10%,rgba(43,68,255,0.07),transparent)]"
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <Ground>
      <div className="grid min-h-svh place-items-center">
        <div className="grid justify-items-center gap-3 text-mute">
          <motion.span
            className="text-accent"
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <LogoMark size={34} />
          </motion.span>
          <span className="text-sm font-medium">{label}</span>
        </div>
      </div>
    </Ground>
  )
}

/** Floating pill header for signed-in screens. */
export function AppHeader({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <motion.header
      className="sticky top-3.5 z-40 mx-auto w-[min(1100px,92vw)]"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div className="flex items-center justify-between gap-3 rounded-full border border-black/[0.06] bg-white/80 py-2 pl-5 pr-2 shadow-soft backdrop-blur-xl">
        {left}
        <div className="flex items-center gap-2 text-[13px] font-medium text-mute">{right}</div>
      </div>
    </motion.header>
  )
}

export function PageTitle({ pill, title, sub }: { pill: string; title: string; sub?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <Pill tint>{pill}</Pill>
      <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
        {title}
      </h1>
      {sub ? <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mute">{sub}</p> : null}
    </motion.div>
  )
}
