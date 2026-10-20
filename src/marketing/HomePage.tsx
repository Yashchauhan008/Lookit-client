import { useRef, useSyncExternalStore } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import { EVENT_SHOTS, FACES, MARQUEE, MONTHLY, WHY, inr } from './content'
import { gsap, ScrollTrigger } from './gsap'
import { Btn, Pill, Reveal, SplitHeading } from './ui'

const PROOF_COPY =
  'Whether you are a photographer delivering five thousand photos or a guest hunting for yourself in the crowd, Lookit connects every face to every moment. One selfie. Your photos. Nothing else.'

const CHIPS: Record<number, string> = { 0: '@riya', 2: '@aarav', 4: '@meera' }

/* ───────────── Hero: stacked deck fans into a cascade while the copy swaps ───────────── */
function Hero() {
  const root = useRef<HTMLElement>(null)
  const deck = EVENT_SHOTS.slice(0, 5)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ desk: '(min-width: 768px)', mobile: '(max-width: 767.98px)' }, (ctx) => {
        const desk = !!ctx.conditions?.desk
        const cards = gsap.utils.toArray<HTMLElement>('.deck-card')
        const mid = (cards.length - 1) / 2

        gsap.set(cards, {
          xPercent: -50,
          yPercent: -50,
          x: (i) => (i - mid) * 12,
          y: 0,
          rotation: (i) => (i - mid) * 5,
          zIndex: (i) => i,
        })
        gsap.set('.hero-b', { autoAlpha: 0, y: 50 })
        gsap.set('.deck-chip', { autoAlpha: 0, scale: 0.6 })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=220%',
            pin: true,
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        })
        tl.to('.hero-a', { autoAlpha: 0, y: -90, duration: 0.2 }, 0)
          .to('.hero-cta', { autoAlpha: 0, duration: 0.1 }, 0)
          .to(
            cards,
            {
              x: (i) =>
                (desk ? window.innerWidth * 0.17 : 0) +
                (i - mid) * (desk ? Math.min(95, window.innerWidth * 0.07) : window.innerWidth * 0.1),
              y: (i) => (i - mid) * (desk ? 38 : 24) + (desk ? 0 : window.innerHeight * 0.14),
              rotation: 0,
              scale: desk ? 1.08 : 0.9,
              ease: 'power2.inOut',
              duration: 0.5,
              stagger: 0.03,
            },
            0.08,
          )
          .to('.hero-b', { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.25 }, 0.3)
          .to('.deck-chip', { autoAlpha: 1, scale: 1, ease: 'back.out(2)', stagger: 0.06, duration: 0.15 }, 0.55)
          .to({}, { duration: 0.3 })

        const par = root.current!.querySelector('.deck-par')
        const xTo = gsap.quickTo(par, 'x', { duration: 0.9, ease: 'power3' })
        const yTo = gsap.quickTo(par, 'y', { duration: 0.9, ease: 'power3' })
        const move = (e: PointerEvent) => {
          xTo((e.clientX / window.innerWidth - 0.5) * 36)
          yTo((e.clientY / window.innerHeight - 0.5) * 24)
        }
        window.addEventListener('pointermove', move, { passive: true })
        return () => window.removeEventListener('pointermove', move)
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative h-svh overflow-hidden">
      <div className="hero-a absolute inset-x-0 top-[12svh] z-20 px-5 text-center md:top-[13svh]">
        <Reveal>
          <Pill>AI event photo delivery</Pill>
        </Reveal>
        <SplitHeading
          as="h1"
          immediate
          delay={0.15}
          text="A place where every guest finds their photos."
          className="mx-auto mt-6 max-w-3xl text-[2rem] font-semibold leading-[1.05] tracking-[-0.045em] md:text-[clamp(2.3rem,5.4vw,4.6rem)] md:leading-[1.0]"
        />
      </div>

      <div className="absolute inset-x-0 top-[13svh] px-[6vw] md:inset-y-0 md:top-0 md:flex md:items-center">
        <div className="hero-b max-w-[34rem]">
          <h2 className="text-[clamp(2rem,4.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
            Upload the event.
            <br />
            <span className="text-mute">Guests find themselves.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mute">
            Drop thousands of photos. Share a link or QR. Guests take one selfie and see only the
            photos they appear in.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Btn to="/register">Start Free Trial</Btn>
            <Btn to="/features" variant="ghost">
              How it works
            </Btn>
          </div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute left-1/2 top-[58%] z-0 md:top-[62%]"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden
      >
        <div className="deck-par">
          {deck.map((src, i) => (
            <div
              key={src}
              className="deck-card absolute left-0 top-0 aspect-[3/4] w-[min(40vw,175px)] md:w-[190px]"
            >
              <img
                src={src}
                alt=""
                className="size-full rounded-[1.4rem] border-[3px] border-white object-cover shadow-lift"
                loading={i < 2 ? 'eager' : 'lazy'}
              />
              {CHIPS[i] ? (
                <span className="deck-chip absolute -left-3 -top-3 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white shadow-soft">
                  {CHIPS[i]}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="hero-cta absolute inset-x-0 bottom-[4svh] z-20 flex flex-col items-center gap-4 md:bottom-[7svh] md:gap-5">
        <Btn to="/register">Start Free Trial</Btn>
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-mute">
          Scroll
          <motion.i
            className="block h-8 w-px origin-top bg-ink"
            animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
        </div>
      </div>
    </section>
  )
}

/* ───────────── Proof: words fill in as the section is pinned ───────────── */
const ICONS = [
  <svg key="a" viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.5" /><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" /></svg>,
  <svg key="b" viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h6v6h-6z" /></svg>,
  <svg key="c" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>,
]

function Proof() {
  const root = useRef<HTMLElement>(null)
  const words = PROOF_COPY.split(' ')

  useGSAP(
    () => {
      gsap.set('.proof-word', { opacity: 0.14 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=170%', pin: true, scrub: 0.6 },
      })
      tl.from('.proof-icon', { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.2, ease: 'power2.out' }, 0)
        .to('.proof-word', { opacity: 1, stagger: 0.12, duration: 0.5 }, 0)
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative grid h-svh place-items-center px-[6vw]">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-[clamp(1.6rem,4vw,3.1rem)] font-medium leading-[1.18] tracking-[-0.03em]">
          {words.map((w, i) => (
            <span key={i} className="proof-word">
              {w}{' '}
            </span>
          ))}
        </p>
        <div className="mt-10 flex justify-center gap-3">
          {ICONS.map((icon, i) => (
            <div key={i} className="proof-icon">
              <motion.span
                className="grid size-12 place-items-center rounded-full bg-white shadow-soft [&_svg]:size-5 [&_svg]:fill-none [&_svg]:stroke-ink [&_svg]:stroke-[1.6]"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              >
                {icon}
              </motion.span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────── Among: two rails of faces drift opposite ways, speeding up with scroll ───────────── */
function Among() {
  const root = useRef<HTMLElement>(null)
  const top = FACES.slice(0, 8)
  const bottom = FACES.slice(8)

  useGSAP(
    () => {
      const [a, b] = gsap.utils.toArray<HTMLElement>('.rail-track')
      const tweens = [
        gsap.fromTo(a, { xPercent: 0 }, { xPercent: -50, ease: 'none', duration: 45, repeat: -1 }),
        gsap.fromTo(b, { xPercent: -50 }, { xPercent: 0, ease: 'none', duration: 45, repeat: -1 }),
      ]
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 220, 6)
          tweens.forEach((t) =>
            gsap.to(t, {
              timeScale: boost,
              duration: 0.25,
              overwrite: true,
              onComplete: () => void gsap.to(t, { timeScale: 1, duration: 1.2 }),
            }),
          )
        },
      })
    },
    { scope: root },
  )

  const row = (items: string[]) =>
    [...items, ...items].map((src, i) => (
      <motion.div
        key={i}
        className="size-[84px] shrink-0 overflow-hidden rounded-[1.4rem] shadow-soft md:size-[116px]"
        style={{ marginTop: (i % 4) * 10 }}
        whileHover={{ scale: 1.14, rotate: i % 2 ? 4 : -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      >
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      </motion.div>
    ))

  return (
    <section ref={root} className="grid gap-10 overflow-hidden py-[14vh]">
      <div className="flex w-max gap-4 rail-track">{row(top)}</div>
      <Reveal className="mx-auto max-w-2xl px-5 text-center">
        <h2 className="text-[clamp(2.2rem,5.4vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
          You will find yourself among us
        </h2>
        <p className="mx-auto mt-5 max-w-md text-mute">
          Every search is scoped to one event. Selfies are matched in memory, never stored, and
          guests can delete their data any time.
        </p>
      </Reveal>
      <div className="flex w-max gap-4 rail-track">{row(bottom)}</div>
    </section>
  )
}

/* ───────────── Match: the centre tile swells into the guest's results ───────────── */
function Match() {
  const root = useRef<HTMLElement>(null)
  const grid = FACES.slice(0, 15)

  useGSAP(
    () => {
      const tiles = gsap.utils.toArray<HTMLElement>('.m-tile')
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=240%', pin: true, scrub: 0.7 },
      })
      gsap.set('.m-copy, .m-badge', { autoAlpha: 0, y: 24 })
      tl.to(
        tiles.filter((_, i) => i !== 7),
        {
          opacity: 0.2,
          scale: 0.86,
          x: (i) => ((i < 7 ? i : i + 1) % 5 - 2) * 34,
          y: (i) => (Math.floor((i < 7 ? i : i + 1) / 5) - 1) * 30,
          stagger: { amount: 0.25, from: 'center' },
          duration: 1,
        },
        0,
      )
        .to('.m-hero', { scale: () => (window.innerWidth < 768 ? 2.3 : 2.05), duration: 1 }, 0)
        .to('.m-copy', { autoAlpha: 1, y: 0, duration: 0.5 }, 0.6)
        .to('.m-badge', { autoAlpha: 1, y: 0, duration: 0.4 }, 0.85)
        .to({}, { duration: 0.4 })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative grid h-svh place-items-center overflow-hidden">
      <div className="grid w-[min(92vw,86svh)] grid-cols-5 gap-2.5 md:gap-4" aria-hidden>
        {grid.map((src, i) => (
          <div
            key={src}
            className={`m-tile relative aspect-[3/4] rounded-[18px] ${i === 7 ? 'm-hero z-20' : ''}`}
          >
            <img
              src={src}
              alt=""
              className={`size-full rounded-[18px] object-cover ${i === 7 ? 'border-[2px] border-white shadow-lift' : ''}`}
              loading="lazy"
            />
            {i === 7 ? (
              <span className="m-badge absolute inset-x-1 bottom-1 rounded-full bg-white/95 px-1 py-1 text-center text-[5px] font-bold text-ink md:text-[7px]">
                98% match · 24 photos
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="m-copy absolute inset-x-0 top-[15svh] z-30 mx-auto w-fit max-w-[88vw] rounded-3xl bg-white/85 px-6 py-4 text-center shadow-soft backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">One selfie</p>
        <h2 className="mt-1 text-[clamp(1.4rem,3vw,2.4rem)] font-semibold leading-tight tracking-[-0.03em]">
          Out of 5,000 photos, here are yours.
        </h2>
      </div>
    </section>
  )
}

/* ───────────── Stories ───────────── */
const STORIES = [
  {
    title: 'Instant face search',
    body: 'Guests open your link, take one selfie, and see every photo they appear in, in seconds.',
    img: EVENT_SHOTS[0],
    art: 'bg-white',
  },
  {
    title: 'Secure, private sharing',
    body: 'Selfie-only results, consent before every search, QR codes, and selfies that are never stored.',
    img: EVENT_SHOTS[3],
    art: 'bg-azure',
  },
  {
    title: 'Built for studios',
    body: 'Bulk upload that survives venue Wi‑Fi, a live quota meter, and white-label guest pages.',
    img: EVENT_SHOTS[2],
    art: 'bg-accent',
  },
]

function Stories() {
  return (
    <section className="mx-auto w-[min(1180px,92vw)] py-[12vh]">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Pill tint>Why Lookit</Pill>
        <h2 className="mt-5 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
          Every event tells a story
        </h2>
      </Reveal>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {STORIES.map((c, i) => (
          <motion.article
            key={c.title}
            className="group rounded-[2rem] bg-white p-3.5 shadow-soft"
            initial={{ opacity: 0, y: 70 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -8 }}
          >
            <div className={`overflow-hidden rounded-[1.5rem] ${c.art}`}>
              <img
                src={c.img}
                alt=""
                loading="lazy"
                className={`aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.07] ${
                  c.art === 'bg-white' ? '' : 'opacity-90 mix-blend-luminosity'
                }`}
              />
            </div>
            <h3 className="mt-5 px-2 text-xl font-semibold tracking-tight">{c.title}</h3>
            <p className="mb-3 mt-2 px-2 text-sm leading-relaxed text-mute">{c.body}</p>
          </motion.article>
        ))}
      </div>
      <Reveal className="mt-14 grid gap-8 border-t border-black/10 pt-10 sm:grid-cols-2 lg:grid-cols-5">
        {WHY.slice(3).map((w) => (
          <div key={w.title}>
            <h4 className="text-[15px] font-semibold">{w.title}</h4>
            <p className="mt-2 text-[13px] leading-relaxed text-mute">{w.body}</p>
          </div>
        ))}
      </Reveal>
    </section>
  )
}

/* ───────────── Banner: lime strip, type scrubs sideways with scroll ───────────── */
function Banner() {
  const root = useRef<HTMLDivElement>(null)
  const line = [...MARQUEE, ...MARQUEE]

  useGSAP(
    () => {
      gsap.fromTo(
        '.banner-track',
        { xPercent: 0 },
        {
          xPercent: -50,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
        },
      )
    },
    { scope: root },
  )

  return (
    <section className="px-3.5 py-[6vh]">
      <div
        ref={root}
        className="mx-auto w-full max-w-[1240px] overflow-hidden rounded-[2.5rem] bg-lime py-[9vh]"
      >
        <div className="banner-track flex w-max items-center gap-6 whitespace-nowrap text-[clamp(3rem,9vw,8rem)] font-semibold leading-none tracking-[-0.05em]" aria-hidden>
          {line.map((w, i) => (
            <span key={i} className="flex items-center gap-6">
              {w}
              <img
                src={EVENT_SHOTS[i % EVENT_SHOTS.length]}
                alt=""
                className="size-[0.85em] rounded-[0.22em] object-cover"
                loading="lazy"
              />
            </span>
          ))}
        </div>
        <Reveal className="mt-[8vh] flex flex-col items-center gap-6 px-5 text-center">
          <h2 className="max-w-xl text-[clamp(1.6rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">
            Made for the way India celebrates.
          </h2>
          <Btn to="/features">Explore features</Btn>
        </Reveal>
      </div>
    </section>
  )
}

/* ───────────── Pricing teaser: fanned cards that spread on hover ───────────── */
const fan: Variants = {
  hidden: { opacity: 0, y: 80, x: 0, rotate: 0 },
  show: (i: number) => ({
    opacity: 1,
    y: Math.abs(i - 1) * 16,
    x: (i - 1) * 118,
    rotate: (i - 1) * 7,
    transition: { duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
  spread: (i: number) => ({
    y: Math.abs(i - 1) * 6,
    x: (i - 1) * 172,
    rotate: (i - 1) * 3,
    transition: { type: 'spring', stiffness: 160, damping: 18 },
  }),
}

function useWide(minPx: number) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(`(min-width: ${minPx}px)`)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(`(min-width: ${minPx}px)`).matches,
    () => true,
  )
}

function PricingTeaser() {
  const wide = useWide(640)
  return (
    <section className="mx-auto grid w-[min(1120px,92vw)] items-center gap-14 py-[12vh] md:grid-cols-2">
      <Reveal>
        <Pill tint>Pricing</Pill>
        <h2 className="mt-5 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
          Prepaid plans for wedding season
        </h2>
        <p className="mt-5 max-w-md text-mute">
          Pay by UPI, watch your photo quota live, top up any time. 30-day free plan included.
        </p>
        <div className="mt-7">
          <Btn to="/pricing">See all plans</Btn>
        </div>
      </Reveal>
      {!wide ? (
        <div className="grid gap-3">
          {MONTHLY.map((p, i) => (
            <motion.div
              key={p.code}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`flex items-center justify-between gap-4 rounded-[1.5rem] p-5 shadow-soft ${
                p.featured ? 'bg-accent text-white' : 'bg-white'
              }`}
            >
              <span>
                <span className="block text-sm font-semibold">
                  {p.name}
                  {p.featured ? (
                    <em className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold not-italic text-accent">
                      Popular
                    </em>
                  ) : null}
                </span>
                <small className={p.featured ? 'text-white/80' : 'text-mute'}>
                  {p.photos.toLocaleString('en-IN')} photos / 30 days
                </small>
              </span>
              <strong className="text-3xl font-semibold tracking-tight">{inr(p.price)}</strong>
            </motion.div>
          ))}
        </div>
      ) : null}
      <motion.div
        className={`relative mx-auto h-[330px] w-full max-w-[520px] ${wide ? '' : 'hidden'}`}
        initial="hidden"
        whileInView="show"
        whileHover="spread"
        viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      >
        {MONTHLY.map((p, i) => (
          <motion.div
            key={p.code}
            custom={i}
            variants={fan}
            className={`absolute left-1/2 top-4 -ml-[100px] grid h-[270px] w-[200px] content-between rounded-[1.75rem] p-6 shadow-lift ${
              p.featured ? 'z-10 bg-accent text-white' : 'bg-white'
            }`}
          >
            <span className="text-sm font-semibold">{p.name}</span>
            <div>
              <strong className="block text-4xl font-semibold tracking-tight">{inr(p.price)}</strong>
              <small className={p.featured ? 'text-white/80' : 'text-mute'}>
                {p.photos.toLocaleString('en-IN')} photos / 30 days
              </small>
            </div>
            {p.featured ? (
              <em className="absolute right-4 top-4 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold not-italic text-accent">
                Popular
              </em>
            ) : null}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Proof />
      <Among />
      <Match />
      <Stories />
      <Banner />
      <PricingTeaser />
    </>
  )
}
