import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { reloadOnceForStaleChunk } from './App.tsx'

// Stale chunk after a redeploy: reload once instead of an error page.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadOnceForStaleChunk()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
