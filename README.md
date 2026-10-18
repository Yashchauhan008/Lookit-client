# Lookit-client

React + Vite + TypeScript SPA for [lookit.studio](https://lookit.studio).

## Quick start

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS
- React Router + TanStack Query (wired as features land)
- Visual direction: dark minimal agency aesthetic (Web Angles–inspired layout/motion — Lookit brand)

## Routes (planned)

- `/` — marketing
- `/login`, `/register` — photographer auth (boilerplate OTP flow)
- `/app/*` — photographer dashboard
- `/e/:slug` — guest event (code-split)
- `/admin/*` — admin only (`yashchauhan1775@gmail.com`)

## Deploy

Same pattern as rtmetal-client: `Dockerfile` (nginx) + `deploy.sh` → Docker Hub → VPS compose.
