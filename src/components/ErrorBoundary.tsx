import { Component, type ErrorInfo, type ReactNode } from 'react'

type State = { error: Error | null }

/** Turns a render crash into a readable message instead of a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="grid min-h-svh place-items-center bg-paper px-5 text-ink">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-soft">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-mute">
            This page hit an error. Reloading usually fixes it; if not, restart the API server.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-2xl bg-paper p-3 text-xs text-red-600">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
