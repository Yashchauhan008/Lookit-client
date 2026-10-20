import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'framer-motion'
import { CONTACT_EMAIL } from './content'
import { ScrollTrigger } from './gsap'
import SmoothScroll from './SmoothScroll'
import { LogoMark } from '../components/kit'
import { Btn, Reveal } from './ui'

const LINKS = [
  { to: '/about-us', label: 'About Us' },
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact-us', label: 'Contact Us' },
]

function Nav() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [raised, setRaised] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setRaised(y > 16)
    setHidden(y > 240 && y > prev && !open)
  })

  return (
    <motion.header
      className="fixed inset-x-0 top-3.5 z-50 flex justify-center px-3.5"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden ? -100 : 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-full max-w-[1100px]">
        <div
          className={`flex items-center justify-between rounded-full border border-black/[0.06] bg-white/80 py-2 pl-5 pr-2 backdrop-blur-xl transition-shadow duration-500 ${
            raised ? 'shadow-soft' : 'shadow-none'
          }`}
        >
          <Link to="/" className="flex items-center gap-2 font-tight text-[17px] font-bold tracking-tight">
            <span className="text-accent">
              <LogoMark />
            </span>
            Lookit
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${
                    isActive ? 'text-ink' : 'text-mute hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 -z-10 rounded-full bg-black/[0.05]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    {l.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className="rounded-full px-4 py-2 text-[13.5px] font-medium text-mute hover:text-ink">
              Sign In
            </Link>
            <Btn to="/register" small>
              Start for free
            </Btn>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full bg-ink md:hidden"
          >
            <span className="relative block h-3 w-5">
              <motion.i
                className="absolute left-0 top-0 block h-[1.5px] w-5 bg-white"
                animate={open ? { y: 5, rotate: 45 } : { y: 0, rotate: 0 }}
              />
              <motion.i
                className="absolute bottom-0 left-0 block h-[1.5px] w-5 bg-white"
                animate={open ? { y: -5, rotate: -45 } : { y: 0, rotate: 0 }}
              />
            </span>
          </button>
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              onClick={() => setOpen(false)}
              className="mt-2 overflow-hidden rounded-3xl border border-black/[0.06] bg-white/95 p-3 shadow-soft backdrop-blur-xl md:hidden"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {[...LINKS, { to: '/login', label: 'Sign In' }].map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link to={l.to} className="block rounded-2xl px-4 py-3.5 text-lg font-semibold hover:bg-black/[0.04]">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <div className="p-2 pt-3">
                <Btn to="/register" className="w-full">
                  Start for free
                </Btn>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

function Footer() {
  return (
    <footer className="px-3.5 pb-4 pt-[6vh]">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 rounded-[2.25rem] bg-white p-8 shadow-soft md:grid-cols-[1.4fr_1fr] md:p-14">
        <Reveal>
          <h2 className="max-w-md text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
            Your event.
            <br />
            Their photos.
          </h2>
          <p className="mt-5 max-w-sm text-mute">
            Upload once. Every guest finds themselves with a single selfie, on a page that feels like
            your studio.
          </p>
          <div className="mt-7">
            <Btn to="/register">Start for free</Btn>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="grid content-start gap-3">
            <h4 className="font-semibold">Product</h4>
            <Link className="text-mute hover:text-ink" to="/features">Features</Link>
            <Link className="text-mute hover:text-ink" to="/pricing">Pricing</Link>
            <Link className="text-mute hover:text-ink" to="/login">Sign In</Link>
          </div>
          <div className="grid content-start gap-3">
            <h4 className="font-semibold">Company</h4>
            <Link className="text-mute hover:text-ink" to="/about-us">About Us</Link>
            <Link className="text-mute hover:text-ink" to="/contact-us">Contact Us</Link>
            <a className="break-all text-mute hover:text-ink" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
        <p className="text-xs text-mute md:col-span-2">© 2026 Lookit. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default function MarketingLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => ScrollTrigger.refresh(), 100)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-clip bg-paper font-tight text-ink antialiased">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(255,106,43,0.09),transparent),radial-gradient(50%_45%_at_90%_10%,rgba(43,68,255,0.07),transparent)]"
        />
        <SmoothScroll />
        <Nav />
        <motion.main
          key={pathname}
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
