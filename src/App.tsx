import { useEffect, useState } from 'react'

const HERO =
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2400&q=80'

const GALLERY = [
  {
    src: 'https://images.unsplash.com/photo-1606800052052-a08af952db2a?auto=format&fit=crop&w=1200&q=80',
    label: 'Wedding · Jaipur',
    tall: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    label: 'Reception',
  },
  {
    src: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
    label: 'Garba night',
  },
  {
    src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
    label: 'College fest',
    tall: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1520854221256-54751f900db9?auto=format&fit=crop&w=1200&q=80',
    label: 'Haldi',
  },
  {
    src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
    label: 'Corporate',
  },
]

const MARQUEE = [
  'Weddings',
  'Garba',
  'Navratri',
  'College fests',
  'Marathons',
  'Corporate',
  'Receptions',
  'Sangeet',
]

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9.5" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 19c1.4-2.8 3.8-4.2 6.5-4.2S17.1 16.2 18.5 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const headerClass = `header${scrolled || menuOpen ? ' is-solid' : ''}`

  return (
    <div className="shell">
      <header className={headerClass}>
        <div className="wrap header-inner">
          <a href="/" className="brand">
            <span className="brand-mark">
              <LogoMark />
            </span>
            <span className="brand-name">Lookit</span>
          </a>

          <nav className="nav-desktop">
            <a className="nav-link" href="#how">
              How it works
            </a>
            <a className="nav-link" href="#studios">
              For studios
            </a>
            <a className="nav-link" href="#events">
              Events
            </a>
            <a className="btn btn-nav" href="/login">
              Sign in
            </a>
          </nav>

          <button
            type="button"
            aria-label="Open menu"
            className={`menu-btn${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>

        {menuOpen ? (
          <div className="mobile-menu">
            <a href="#how" onClick={() => setMenuOpen(false)}>
              How it works
            </a>
            <a href="#studios" onClick={() => setMenuOpen(false)}>
              For studios
            </a>
            <a href="#events" onClick={() => setMenuOpen(false)}>
              Events
            </a>
            <a href="/login" onClick={() => setMenuOpen(false)}>
              Sign in
            </a>
          </div>
        ) : null}
      </header>

      <main>
        <section className="hero">
          <div className="hero-bg">
            <img src={HERO} alt="" />
          </div>

          <div className="wrap hero-content">
            <p className="eyebrow anim-rise">AI event photo delivery</p>
            <h1 className="hero-title anim-rise anim-d1">
              Your face.
              <br />
              Your photos.
            </h1>
            <p className="hero-copy anim-rise anim-d2">
              Guests open your event link, take one selfie, and instantly see only the photos they
              appear in.
            </p>
            <div className="hero-actions anim-rise anim-d3">
              <a className="btn btn-solid" href="/register">
                Start as a photographer
              </a>
              <a className="text-link" href="#how">
                See how it works ↓
              </a>
            </div>
            <div className="scroll-cue">
              <span>Scroll</span>
              <i />
            </div>
          </div>
        </section>

        <section className="marquee" aria-hidden>
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map((item, i) => (
              <span className="marquee-item" key={`${item}-${i}`}>
                {item}
                <em>✦</em>
              </span>
            ))}
          </div>
        </section>

        <section className="section" id="how">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="eyebrow">How it works</p>
                <h2 className="section-title">
                  Three steps.
                  <br />
                  Zero scrolling hell.
                </h2>
              </div>
              <p className="section-aside">
                Built for Indian venues with shaky Wi‑Fi and guests stuck inside WhatsApp.
              </p>
            </div>

            <div className="steps">
              <div className="step">
                <span className="step-n">01</span>
                <h3>Upload the event</h3>
                <p>
                  Drop thousands of photos. We process, index faces, and keep everything scoped to
                  that one event.
                </p>
              </div>
              <div className="step">
                <span className="step-n">02</span>
                <h3>Share link or QR</h3>
                <p>
                  Guests open lookit.studio/e/your-event — works in WhatsApp and Instagram browsers.
                </p>
              </div>
              <div className="step">
                <span className="step-n">03</span>
                <h3>Selfie → their gallery</h3>
                <p>
                  One face check. Results in seconds. Download originals. Delete their data anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="events">
          <div className="wrap">
            <p className="eyebrow">Live feel</p>
            <h2 className="section-title">Every event page should feel like your studio.</h2>

            <div className="gallery">
              {GALLERY.map((shot) => (
                <figure key={shot.src} className={`shot ${shot.tall ? 'tall' : 'wide'}`}>
                  <img src={shot.src} alt={shot.label} loading="lazy" />
                  <figcaption>{shot.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="studio" id="studios">
          <div className="studio-bg">
            <img
              src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=80"
              alt=""
            />
          </div>
          <div className="wrap studio-inner">
            <div className="studio-copy">
              <p className="eyebrow">For studios</p>
              <h2 className="section-title">
                Ship albums.
                <br />
                Stop inbox chaos.
              </h2>
              <p className="body">
                Prepaid plans for wedding season. Bulk upload that survives venue Wi‑Fi. Quota you
                can see. Guests that stop asking “please send my photos.”
              </p>
            </div>
            <div className="studio-actions">
              <a className="btn btn-solid" href="/register">
                Create studio account
              </a>
              <a className="btn btn-ghost" href="mailto:hello@lookit.studio">
                Talk to us
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <div className="brand">
            <span className="brand-mark">
              <LogoMark />
            </span>
            <div>
              <p className="brand-name">Lookit.studio</p>
              <p className="footer-meta">Event photos, found by face.</p>
            </div>
          </div>
          <div className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="mailto:hello@lookit.studio">hello@lookit.studio</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
