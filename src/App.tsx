import { useState } from 'react'

const nav = [
  { label: 'Product', href: '#product' },
  { label: 'For photographers', href: '#photographers' },
  { label: 'Guest flow', href: '#guest' },
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-svh bg-black text-[#f5f5f5]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-2 tracking-[0.14em]">
            <span
              className="text-lg font-bold uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Lookit
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-white/55 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/login"
              className="rounded-full border border-white/20 px-4 py-1.5 text-sm transition-colors hover:bg-white hover:text-black"
            >
              Sign in
            </a>
          </nav>

          <button
            type="button"
            aria-label="Menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="block h-px w-5 bg-white" />
            <span className="block h-px w-5 bg-white" />
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 px-5 py-4 md:hidden">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2 text-sm text-white/70"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a href="/login" className="mt-2 block py-2 text-sm text-white">
              Sign in
            </a>
          </div>
        )}
      </header>

      <main>
        {/* Hero — Web Angles–inspired: black field, huge type, thin rules */}
        <section className="relative flex min-h-svh flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 70% 20%, rgba(255,255,255,0.08), transparent 60%)',
            }}
          />

          <p className="anim-rise mb-4 text-xs uppercase tracking-[0.28em] text-white/45">
            AI event photo delivery
          </p>

          <h1
            className="anim-rise-2 max-w-4xl text-[clamp(2.75rem,10vw,6.5rem)] font-extrabold leading-[0.95] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Your face.
            <br />
            Your photos.
            <br />
            Built for every angle.
          </h1>

          <div className="anim-line mt-8 h-px w-full max-w-xl bg-white/20" />

          <p className="anim-rise-3 mt-6 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
            Photographers upload thousands of event photos. Guests open one link, take a selfie, and
            instantly see only the shots they appear in — scoped to that event alone.
          </p>

          <div className="anim-rise-3 mt-10 flex flex-wrap gap-3">
            <a
              href="/register"
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Start free trial
            </a>
            <a
              href="#guest"
              className="inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm text-white transition-colors hover:bg-white/5"
            >
              See guest flow
            </a>
          </div>
        </section>

        <section id="product" className="border-t border-white/10 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">Product</p>
            <h2
              className="mt-4 max-w-2xl text-3xl font-bold sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Smart photo experiences for Indian events.
            </h2>
            <div className="mt-14 grid gap-px bg-white/10 sm:grid-cols-3">
              {[
                {
                  title: 'Bulk upload',
                  body: 'Thousands of files, resume on bad venue Wi‑Fi, direct to cloud storage.',
                },
                {
                  title: 'Face search',
                  body: 'One selfie → matches inside that event only. Never cross-event.',
                },
                {
                  title: 'Share & QR',
                  body: 'Event link + QR. Guests in WhatsApp get results in seconds.',
                },
              ].map((card) => (
                <div key={card.title} className="bg-black p-8">
                  <h3
                    className="text-xl font-semibold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="photographers" className="border-t border-white/10 px-5 py-20 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">Photographers</p>
              <h2
                className="mt-4 text-3xl font-bold sm:text-5xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Less “send my photos”. More delivery.
              </h2>
              <p className="mt-5 text-white/50">
                Plans for wedding season, top-ups when a night runs long, themed guest pages that
                feel like your studio — not a generic gallery.
              </p>
            </div>
            <a
              href="/register"
              className="inline-flex shrink-0 items-center rounded-full border border-white/25 px-6 py-3 text-sm hover:bg-white hover:text-black"
            >
              Create studio account
            </a>
          </div>
        </section>

        <section id="guest" className="border-t border-white/10 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs uppercase tracking-[0.28em] text-white/40">Guest flow</p>
            <h2
              className="mt-4 text-3xl font-bold sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Open. Consent. Selfie. Done.
            </h2>
            <ol className="mt-12 grid gap-8 sm:grid-cols-4">
              {['Open event link / QR', 'Accept consent', 'Take one selfie', 'See your photos'].map(
                (step, i) => (
                  <li key={step} className="border-t border-white/15 pt-4">
                    <span className="text-xs text-white/35">0{i + 1}</span>
                    <p
                      className="mt-2 text-lg font-semibold"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {step}
                    </p>
                  </li>
                ),
              )}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span
            className="text-sm font-bold uppercase tracking-[0.14em]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Lookit.studio
          </span>
          <p className="text-xs text-white/40">
            Visual language inspired by modern agency sites — Lookit brand, not a copy.
          </p>
        </div>
      </footer>
    </div>
  )
}
