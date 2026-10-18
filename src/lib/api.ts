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
