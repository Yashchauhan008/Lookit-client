# Lookit-client — agent notes

- React + Vite + TypeScript. Guest routes must be code-split so guests never load dashboard/admin.
- UI direction: dark minimal (black ground, thin hairlines, bold display type, intentional motion) inspired by webangles.framer.website — do not copy their copy/branding.
- Marketing routes (`/`, `/about-us`, `/features`, `/pricing`, `/contact-us`, in `src/marketing/`) are the exception: light, airy, scroll-driven. Always build UI with Tailwind, Lenis, GSAP (ScrollTrigger) and Framer Motion.
- Auth UI matches lookit-server boilerplate: register → OTP → verify → login.
- No secrets in the frontend. API base URL via `VITE_API_BASE_URL`.
- Record product decisions in lookit-server `docs/DECISIONS.md` (or mirror here).
