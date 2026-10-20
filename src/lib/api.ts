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
  end_date: string | null
  banner_url: string | null
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
    end_date?: string | null
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
      end_date: string | null
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
  scans(id: string) {
    return api<{
      stats: {
        total_scans: number
        unique_guests: number
        matched: number
        no_match: number
        no_face: number
        face_api_calls: number
        calls_saved: number
      }
      scans: Array<{
        id: string
        match_count: number
        status: 'matched' | 'no_match' | 'no_face'
        created_at: string
        selfie_url: string | null
      }>
    }>(`/events/${id}/scans`)
  },
  insights() {
    return api<{ daily_uploads: Array<{ day: string; photos: number }> }>('/events/insights')
  },
  /** XHR (not fetch) so we can report real upload progress. */
  uploadBanner(id: string, file: File, onProgress?: (pct: number) => void, signal?: AbortSignal) {
    return new Promise<{ event: LookitEvent }>((resolve, reject) => {
      const form = new FormData()
      form.append('banner', file)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/events/${id}/banner`)
      xhr.setRequestHeader('Authorization', `Bearer ${getToken() || ''}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onerror = () => reject(new Error('Network error while uploading. Check your connection and try again.'))
      xhr.onabort = () => reject(new Error('Upload cancelled'))
      signal?.addEventListener('abort', () => xhr.abort(), { once: true })
      xhr.onload = () => {
        let data: { event?: LookitEvent; message?: string } = {}
        try {
          data = JSON.parse(xhr.responseText)
        } catch {
          /* non-JSON error body (e.g. a proxy page) */
        }
        if (xhr.status >= 200 && xhr.status < 300 && data.event) return resolve({ event: data.event })
        if (xhr.status === 413) return reject(new Error('That image is too large for the server. Try a smaller one.'))
        reject(new Error(data.message || `Upload failed (${xhr.status})`))
      }
      xhr.send(form)
    })
  },
  removeBanner(id: string) {
    return api<{ event: LookitEvent }>(`/events/${id}/banner`, { method: 'DELETE' })
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
        end_date: string | null
        banner_url: string | null
        visibility: string
        theme: Record<string, unknown>
        needs_pin: boolean
        studio: { name: string }
      }
    }>(`/e/${slug}`, { auth: false })
  },
}

export type LookitPhoto = {
  id: string
  event_id: string
  status: string
  orig_key: string | null
  prev_key: string | null
  thumb_key: string | null
  thumb_url: string | null
  preview_url: string | null
  content_type: string | null
  original_filename: string | null
  size_bytes: number | null
  faces_count: number
  error: string | null
  created_at: string
}

export const uploadsApi = {
  createSession(eventId: string, body: { file_count: number }) {
    return api<{
      session: {
        id: string
        reserved_count: number
        remaining_quota: number
        expires_at: string
      }
    }>(`/events/${eventId}/uploads/sessions`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  /** Which of these files (name + size) are already uploaded to the event? */
  checkDuplicates(eventId: string, files: Array<{ name: string; size: number }>) {
    return api<{ duplicates: Array<{ name: string; size: number }> }>(
      `/events/${eventId}/uploads/check-duplicates`,
      { method: 'POST', body: JSON.stringify({ files }) },
    )
  },
  createMultipart(
    eventId: string,
    sessionId: string,
    body: { filename: string; content_type: string; size_bytes: number },
  ) {
    return api<{
      photo_id: string
      key: string
      upload_id: string
      part_size: number
    }>(`/events/${eventId}/uploads/sessions/${sessionId}/files`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  signPart(
    eventId: string,
    photoId: string,
    body: { part_number: number; upload_id?: string },
  ) {
    return api<{ url: string; headers: Record<string, string> }>(
      `/events/${eventId}/uploads/photos/${photoId}/sign-part`,
      { method: 'POST', body: JSON.stringify(body) },
    )
  },
  listParts(eventId: string, photoId: string, uploadId?: string) {
    const q = uploadId ? `?upload_id=${encodeURIComponent(uploadId)}` : ''
    return api<{
      parts: Array<{ PartNumber?: number; ETag?: string; Size?: number }>
    }>(`/events/${eventId}/uploads/photos/${photoId}/parts${q}`)
  },
  completeMultipart(
    eventId: string,
    photoId: string,
    body: {
      upload_id?: string
      parts: Array<{ PartNumber: number; ETag: string }>
    },
  ) {
    return api<{ photo: LookitPhoto }>(
      `/events/${eventId}/uploads/photos/${photoId}/complete`,
      { method: 'POST', body: JSON.stringify(body) },
    )
  },
  abortMultipart(
    eventId: string,
    photoId: string,
    body?: { upload_id?: string },
  ) {
    return api<{ message: string }>(
      `/events/${eventId}/uploads/photos/${photoId}/abort`,
      { method: 'POST', body: JSON.stringify(body || {}) },
    )
  },
  abortSession(eventId: string, sessionId: string) {
    return api<{ message: string }>(
      `/events/${eventId}/uploads/sessions/${sessionId}/abort`,
      { method: 'POST', body: JSON.stringify({}) },
    )
  },
  listPhotos(eventId: string) {
    return api<{ photos: LookitPhoto[]; total: number }>(
      `/events/${eventId}/photos`,
    )
  },
}

export type GuestMatchPhoto = {
  id: string
  original_filename: string | null
  faces_count: number
  thumb_url: string | null
  preview_url: string | null
}

function guestToken(slug: string) {
  return sessionStorage.getItem(`lookit_guest_${slug}`)
}

async function guestFetch<T>(
  slug: string,
  path: string,
  options: RequestInit & { json?: unknown; formData?: FormData; timeoutMs?: number; token?: string | null } = {},
): Promise<T> {
  const headers = new Headers(options.headers || {})
  // Prefer a token passed directly by the caller (no sessionStorage race);
  // fall back to the stored one.
  const token = options.token !== undefined ? options.token : guestToken(slug)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let body = options.body
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }
  if (options.formData) {
    body = options.formData
  }
  let signal = options.signal ?? undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  if (options.timeoutMs) {
    const controller = new AbortController()
    signal = controller.signal
    timer = setTimeout(() => controller.abort(), options.timeoutMs)
  }
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers, body, signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Search timed out — please try again.')
    }
    throw err
  } finally {
    if (timer) clearTimeout(timer)
  }
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; code?: string }
  if (!res.ok) {
    // Keep status + code so callers can tell "gone" from "offline".
    throw Object.assign(new Error(data.message || `Request failed (${res.status})`), {
      status: res.status,
      code: data.code,
    })
  }
  return data
}

export const guestApi = {
  unlock(slug: string, body: { pin?: string | null }) {
    return guestFetch<{ token: string; event_id: string; needs_consent: boolean }>(
      slug,
      `/e/${slug}/unlock`,
      { method: 'POST', json: body },
    )
  },
  consentText(slug: string) {
    return api<{ consent: { version: string; text: string } }>(
      `/e/${slug}/consent-text`,
      { auth: false },
    )
  },
  consent(slug: string, body: { accepted: true }, token?: string | null) {
    return guestFetch<{ token: string; consent_version: string }>(
      slug,
      `/e/${slug}/consent`,
      { method: 'POST', json: body, token },
    )
  },
  search(slug: string, file: File, token?: string | null, guestId?: string) {
    const form = new FormData()
    // Text fields must come before the file so multer has them when the file arrives.
    if (guestId) form.append('guest_id', guestId)
    form.append('selfie', file)
    return guestFetch<{
      photos: GuestMatchPhoto[]
      match_count: number
      message?: string
      code?: string
      scan_id?: string
      guest_id?: string
      scan_token?: string
    }>(slug, `/e/${slug}/search`, { method: 'POST', formData: form, timeoutMs: 25_000, token })
  },
  /** Reopen saved matches from a previous scan (no face search is run). */
  myResults(slug: string, scanToken: string) {
    return guestFetch<{
      photos: GuestMatchPhoto[]
      match_count: number
      scanned_at: string
      new_photos: number
      status: 'matched' | 'no_match' | 'no_face'
    }>(slug, `/e/${slug}/my-results`, { method: 'POST', json: { token: scanToken }, token: null })
  },
  deleteScan(slug: string, scanToken: string) {
    return guestFetch<{ message: string }>(slug, `/e/${slug}/my-scan/delete`, {
      method: 'POST',
      json: { token: scanToken },
      token: null,
    })
  },
  photoUrl(slug: string, photoId: string, variant: 'thumb' | 'preview' | 'orig' = 'preview', token?: string | null) {
    return guestFetch<{ url: string; expires_in: number; filename: string | null }>(
      slug,
      `/e/${slug}/photos/${photoId}/url?variant=${variant}`,
      { token },
    )
  },
}

export type PlanEntitlements = {
  white_label?: boolean
  team_logins?: number
  max_events?: number | null
  powered_by_badge?: boolean
}

export type Plan = {
  id: string
  code: string
  name: string
  kind: 'monthly' | 'season' | 'topup' | 'trial'
  price_inr: number
  photo_quota: number
  duration_days: number
  retention_days: number
  entitlements: PlanEntitlements
}

export type Purchase = {
  id: string
  status: 'active' | 'exhausted' | 'expired' | 'revoked'
  live: boolean
  photo_quota: number
  photos_used: number
  photos_reserved: number
  remaining: number
  upload_window_end: string
  retention_end: string
  created_at: string
  plan_code: string
  plan_name: string
  plan_kind: Plan['kind']
}

export type Billing = {
  free_plan_available: boolean
  current_plan: {
    code: string
    name: string
    kind: Plan['kind']
    expires_at: string
    retention_end: string
    entitlements: PlanEntitlements
  } | null
  topups: { count: number; quota: number; remaining: number }
  totals: { quota: number; used: number; reserved: number; remaining: number }
  usage: { events: number; photos: number }
  purchases: Purchase[]
}

export type Order = {
  id: string
  kind: string
  amount_inr: number
  ref_code: string
  utr: string | null
  status: 'pending_payment' | 'submitted' | 'approved' | 'rejected' | 'expired'
  reject_reason: string | null
  created_at: string
  plan_name: string | null
}

export type AdminOrder = Order & {
  plan_code: string | null
  reviewed_at: string | null
  user_id: string
  user_name: string
  user_email: string
}

export type AdminUserRow = {
  id: string
  name: string
  email: string
  role: 'photographer' | 'admin'
  studio_name: string | null
  status: 'active' | 'suspended'
  created_at: string
  quota: number
  used: number
  reserved: number
  expires_at: string | null
  plan_name: string | null
  events: number
}

export const billingApi = {
  plans() {
    return api<{ plans: Plan[]; upi: { upi_id?: string; payee_name?: string } | null }>('/billing/plans')
  },
  summary() {
    return api<Billing & { orders: Order[] }>('/billing/summary')
  },
  activateFreePlan() {
    return api<{ message: string }>('/billing/free-plan', { method: 'POST' })
  },
  order(body: { plan_code: string; utr?: string | null }) {
    return api<{ order: Order }>('/billing/orders', { method: 'POST', body: JSON.stringify(body) })
  },
}

export const adminApi = {
  overview() {
    return api<{
      stats: {
        customers: number
        pending_orders: number
        active_customers: number
        photos_used: number
        revenue_inr: number
      }
      plans: Plan[]
    }>('/admin/overview')
  },
  users(q = '') {
    return api<{ users: AdminUserRow[] }>(`/admin/users?q=${encodeURIComponent(q)}`)
  },
  user(id: string) {
    return api<
      Billing & {
        user: { id: string; name: string; email: string; studio_name: string | null; status: string; created_at: string }
      }
    >(`/admin/users/${id}`)
  },
  grant(userId: string, body: { plan_code: string; utr?: string | null }) {
    return api<{ message: string }>(`/admin/users/${userId}/grants`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  orders(status: 'open' | 'approved' | 'rejected' | 'all' = 'open') {
    return api<{ orders: AdminOrder[] }>(`/admin/orders?status=${status}`)
  },
  review(id: string, body: { decision: 'approve' | 'reject'; reason?: string | null }) {
    return api<{ message: string }>(`/admin/orders/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  revoke(purchaseId: string) {
    return api<{ message: string }>(`/admin/purchases/${purchaseId}/revoke`, { method: 'POST' })
  },
}
