import type { ReactNode } from 'react'
import { Pill } from '../components/kit'
import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

/** Fades, lifts and un-blurs children when they scroll into view. */
export function Reveal({
  delay = 0,
  className = '',
  children,
}: {
  delay?: number
  className?: string
  children: ReactNode
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Headline whose words rise out of a mask, staggered. */
export function SplitHeading({
  text,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  immediate = false,
}: {
  text: string
  as?: 'h1' | 'h2'
  className?: string
  delay?: number
  immediate?: boolean
}) {
  const M = motion[Tag]
  return (
    <M
      className={className}
      initial="hidden"
      {...(immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } })}
      transition={{ staggerChildren: 0.06, delayChildren: delay }}
    >
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: '110%' }, show: { y: 0 } }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </M>
  )
}

export { Pill, LinkButton as Btn } from '../components/kit'

export const PageHead = ({
  pill,
  title,
  sub,
}: {
  pill: string
  title: string
  sub?: string
}) => (
  <section className="mx-auto max-w-4xl px-5 pb-10 pt-40 text-center">
    <Reveal>
      <Pill tint>{pill}</Pill>
    </Reveal>
    <SplitHeading
      as="h1"
      immediate
      text={title}
      className="mt-6 text-[clamp(2.4rem,6vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.04em]"
    />
    {sub ? (
      <Reveal delay={0.25}>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-mute">{sub}</p>
      </Reveal>
    ) : null}
  </section>
)

export const Block = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`mx-auto w-[min(1120px,92vw)] py-[7vh] ${className}`}>{children}</section>
)
