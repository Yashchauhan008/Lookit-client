const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3007'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'photographer' | 'admin'
  status: 'active' | 'suspended'
  studio_name: string | null
}

type ApiError = { message?: string }

function getToken() {
  return localStorage.getItem('lookit_token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('lookit_token', token)
  else localStorage.removeItem('lookit_token')
}

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (options.auth !== false) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = (await res.json().catch(() => ({}))) as T & ApiError

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`)
  }
  return data
}

export type LookitEvent = {
  id: string
  slug: string
  name: string
  description: string | null
  event_date: string | null
  visibility: 'selfie_only' | 'full_gallery'
  theme: Record<string, unknown>
  cover_desktop_key: string | null
  cover_mobile_key: string | null
  status: 'active' | 'hidden' | 'deleted'
  has_pin: boolean
  created_at: string
  updated_at: string | null
  photo_count: number
}

export const authApi = {
  register(body: { name: string; email: string; password: string; studio_name?: string }) {
    return api<{ token: string; message?: string; dev_otp?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: false,
    })
  },
  verify(body: { token: string; otp: string }) {
    return api<{ token: string; user: AuthUser }>('/auth/verify-registration', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: false,
    })
  },
  login(body: { email: string; password: string }) {
    return api<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: false,
    })
  },
  me() {
    return api<{ user: AuthUser }>('/auth/me')
  },
}

export const eventsApi = {
  list() {
    return api<{ events: LookitEvent[] }>('/events')
  },
  create(body: {
    name: string
    description?: string | null
    event_date?: string | null
    visibility?: 'selfie_only' | 'full_gallery'
    pin?: string | null
    slug?: string
  }) {
    return api<{ event: LookitEvent }>('/events', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  get(id: string) {
    return api<{ event: LookitEvent; share_url: string }>(`/events/${id}`)
  },
  update(
    id: string,
    body: Partial<{
      name: string
      description: string | null
      event_date: string | null
      visibility: 'selfie_only' | 'full_gallery'
      pin: string | null
      clear_pin: boolean
      status: 'active' | 'hidden'
    }>,
  ) {
    return api<{ event: LookitEvent }>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
  remove(id: string) {
    return api<{ message: string }>(`/events/${id}`, { method: 'DELETE' })
  },
  qrUrl(id: string) {
    const token = getToken()
    return `${API_BASE}/events/${id}/qr?t=${encodeURIComponent(token || '')}`
  },
  publicBySlug(slug: string) {
    return api<{
      event: {
        id: string
        slug: string
        name: string
        description: string | null
        event_date: string | null
        visibility: string
        theme: Record<string, unknown>
        needs_pin: boolean
        studio: { name: string }
      }
    }>(`/e/${slug}`, { auth: false })
  },
}
