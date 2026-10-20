import { lazy, Suspense, type ComponentType } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import ErrorBoundary from './components/ErrorBoundary'
import { useUploads } from './lib/uploads'

/**
 * After a redeploy, an already-open page can reference old hashed chunks
 * that no longer exist ("Failed to fetch dynamically imported module").
 * Reload once to pick up the new index.html instead of showing an error.
 */
export function reloadOnceForStaleChunk(): boolean {
  const KEY = 'lookit-chunk-reload'
  const last = Number(sessionStorage.getItem(KEY) || 0)
  if (Date.now() - last < 10_000) return false
  sessionStorage.setItem(KEY, String(Date.now()))
  window.location.reload()
  return true
}

function lazyRetry<T extends ComponentType>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory()
    } catch (error) {
      if (reloadOnceForStaleChunk()) return new Promise<{ default: T }>(() => {})
      throw error
    }
  })
}

const UploadDock = lazy(() => import('./components/UploadDock'))
const LoginPage = lazyRetry(() => import('./pages/LoginPage'))
const RegisterPage = lazyRetry(() => import('./pages/RegisterPage'))
const VerifyPage = lazyRetry(() => import('./pages/VerifyPage'))
const AppHomePage = lazyRetry(() => import('./pages/AppHomePage'))
const AdminHomePage = lazyRetry(() => import('./pages/AdminHomePage'))
const EventDetailPage = lazyRetry(() => import('./pages/EventDetailPage'))
const GuestEventPage = lazyRetry(() => import('./pages/GuestEventPage'))
const MarketingLayout = lazyRetry(() => import('./marketing/MarketingLayout'))
const HomePage = lazyRetry(() => import('./marketing/HomePage'))
const AboutPage = lazyRetry(() => import('./marketing/AboutPage'))
const FeaturesPage = lazyRetry(() => import('./marketing/FeaturesPage'))
const PricingPage = lazyRetry(() => import('./marketing/PricingPage'))
const ContactPage = lazyRetry(() => import('./marketing/ContactPage'))

/** Only downloads the upload tray (and its animation code) once an upload exists. */
function DockGate() {
  const { jobs } = useUploads()
  return jobs.length ? (
    <Suspense fallback={null}>
      <UploadDock />
    </Suspense>
  ) : null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
        <Suspense fallback={<div className="grid min-h-svh place-items-center bg-paper"><span className="size-3 animate-ping rounded-full bg-accent" /></div>}>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact-us" element={<ContactPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/app" element={<AppHomePage />} />
          <Route path="/app/billing" element={<Navigate to="/app?tab=subscription" replace />} />
          <Route path="/app/events/:id" element={<EventDetailPage />} />
          <Route path="/admin" element={<AdminHomePage />} />
          <Route path="/e/:slug" element={<GuestEventPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
        <DockGate />
      </BrowserRouter>
    </AuthProvider>
  )
}
