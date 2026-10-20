import { useSyncExternalStore } from 'react'
import { uploadsApi } from './api'

/**
 * App-wide upload manager. It lives outside React so uploads keep running while the user
 * navigates between pages; the dock UI and pages just subscribe to it.
 */

export const MAX_BYTES = 30 * 1024 * 1024
const PART_SIZE = 8 * 1024 * 1024
const BATCH = 200 // files per server upload session (server caps a session at 500)
const CONCURRENCY = 3

export type ItemStatus = 'queued' | 'uploading' | 'done' | 'error'
export type PhotoItem = {
  id: string
  file: File
  status: ItemStatus
  progress: number
  error?: string
  photoId?: string
  uploadId?: string
}

export type JobStatus = 'running' | 'done' | 'error' | 'cancelled'
export type UploadJob = {
  id: string
  kind: 'photos' | 'task'
  title: string
  eventId?: string
  items: PhotoItem[]
  status: JobStatus
  message?: string
  /** 0–100 overall */
  pct: number
  done: number
  failed: number
  total: number
  startedAt: number
  controller: AbortController
}

const jobs: UploadJob[] = []
let version = 0
let doneTick = 0
let timer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()
const baseTitle = typeof document !== 'undefined' ? document.title : ''

function recompute(job: UploadJob) {
  if (job.kind === 'photos') {
    job.total = job.items.length
    job.done = job.items.filter((i) => i.status === 'done').length
    job.failed = job.items.filter((i) => i.status === 'error').length
    const sum = job.items.reduce((s, i) => s + (i.status === 'done' ? 100 : i.progress), 0)
    job.pct = job.total ? Math.round(sum / job.total) : 0
  }
}

const hasActive = () => jobs.some((j) => j.status === 'running')

function flush() {
  timer = null
  version += 1
  const active = jobs.filter((j) => j.status === 'running')
  if (typeof document !== 'undefined') {
    const pct = active.length ? Math.round(active.reduce((s, j) => s + j.pct, 0) / active.length) : null
    document.title = pct === null ? baseTitle : `Uploading ${pct}% · ${baseTitle}`
  }
  listeners.forEach((l) => l())
}

/** Coalesce rapid progress events into ~6 renders a second. */
function emit(immediate = false) {
  if (immediate) {
    if (timer) clearTimeout(timer)
    flush()
  } else if (!timer) {
    timer = setTimeout(flush, 160)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (e) => {
    if (hasActive()) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Subscribe a component to upload state. `tick` bumps whenever a photo finishes uploading. */
export function useUploads() {
  useSyncExternalStore(subscribe, () => version)
  return { jobs, tick: doneTick, active: hasActive() }
}

function putPart(url: string, blob: Blob, signal: AbortSignal, onBytes: (n: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = (e) => e.lengthComputable && onBytes(e.loaded)
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(`Storage rejected the upload (${xhr.status})`))
      const etag = xhr.getResponseHeader('ETag')
      if (!etag) return reject(new Error('Storage did not return an ETag (check bucket CORS)'))
      resolve(etag)
    }
    signal.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(blob)
  })
}

async function uploadOne(job: UploadJob, sessionId: string, item: PhotoItem) {
  const eventId = job.eventId!
  const { signal } = job.controller
  item.status = 'uploading'
  item.progress = 0
  item.error = undefined
  emit()
  try {
    const created = await uploadsApi.createMultipart(eventId, sessionId, {
      filename: item.file.name,
      content_type: item.file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      size_bytes: item.file.size,
    })
    item.photoId = created.photo_id
    item.uploadId = created.upload_id

    const partCount = Math.max(1, Math.ceil(item.file.size / PART_SIZE))
    const parts: Array<{ PartNumber: number; ETag: string }> = []
    let sent = 0
    for (let n = 1; n <= partCount; n += 1) {
      const blob = item.file.slice((n - 1) * PART_SIZE, Math.min(n * PART_SIZE, item.file.size))
      let etag = ''
      for (let attempt = 0; ; attempt += 1) {
        try {
          const signed = await uploadsApi.signPart(eventId, created.photo_id, { part_number: n, upload_id: created.upload_id })
          etag = await putPart(signed.url, blob, signal, (loaded) => {
            item.progress = Math.min(99, Math.round(((sent + loaded) / item.file.size) * 100))
            recompute(job)
            emit()
          })
          break
        } catch (err) {
          if (signal.aborted || attempt >= 2) throw err
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
        }
      }
      parts.push({ PartNumber: n, ETag: etag })
      sent += blob.size
    }

    await uploadsApi.completeMultipart(eventId, created.photo_id, { upload_id: created.upload_id, parts })
    item.status = 'done'
    item.progress = 100
    doneTick += 1
  } catch (err) {
    if (signal.aborted) {
      item.status = 'queued'
      item.progress = 0
      if (item.photoId) void uploadsApi.abortMultipart(eventId, item.photoId, { upload_id: item.uploadId }).catch(() => undefined)
    } else {
      item.status = 'error'
      item.error = err instanceof Error ? err.message : 'Upload failed'
    }
  }
  recompute(job)
  emit()
}

async function runPhotoJob(job: UploadJob) {
  const { signal } = job.controller
  const pending = job.items.filter((i) => i.status !== 'done')
  pending.forEach((i) => {
    i.status = 'queued'
    i.progress = 0
    i.error = undefined
  })
  job.status = 'running'
  job.message = undefined
  emit(true)

  for (let b = 0; b < pending.length && !signal.aborted; b += BATCH) {
    const batch = pending.slice(b, b + BATCH)
    let sessionId: string
    try {
      sessionId = (await uploadsApi.createSession(job.eventId!, { file_count: batch.length })).session.id
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not start the upload'
      job.message = msg
      for (const i of pending.slice(b)) {
        i.status = 'error'
        i.error = msg
      }
      break
    }

    let next = 0
    const worker = async () => {
      while (!signal.aborted) {
        const i = next++
        if (i >= batch.length) return
        await uploadOne(job, sessionId, batch[i])
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker))

    // Give back the reservation for anything that didn't make it.
    if (signal.aborted || batch.some((i) => i.status !== 'done')) {
      await uploadsApi.abortSession(job.eventId!, sessionId).catch(() => undefined)
    }
  }

  recompute(job)
  job.status = signal.aborted ? 'cancelled' : job.failed > 0 ? 'error' : 'done'
  doneTick += 1
  emit(true)
}

export const uploadStore = {
  startPhotos(eventId: string, title: string, files: File[]) {
    const job: UploadJob = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: 'photos',
      title,
      eventId,
      items: files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        status: 'queued',
        progress: 0,
      })),
      status: 'running',
      pct: 0,
      done: 0,
      failed: 0,
      total: files.length,
      startedAt: Date.now(),
      controller: new AbortController(),
    }
    jobs.unshift(job)
    void runPhotoJob(job)
    return job
  },

  /** Track any single async upload (e.g. a banner) in the dock; it also guards against closing the tab. */
  async runTask<T>(title: string, run: (report: (pct: number) => void, signal: AbortSignal) => Promise<T>) {
    const job: UploadJob = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: 'task',
      title,
      items: [],
      status: 'running',
      pct: 0,
      done: 0,
      failed: 0,
      total: 1,
      startedAt: Date.now(),
      controller: new AbortController(),
    }
    jobs.unshift(job)
    emit(true)
    try {
      const out = await run((pct) => {
        job.pct = pct
        emit()
      }, job.controller.signal)
      job.pct = 100
      job.done = 1
      job.status = 'done'
      doneTick += 1
      return out
    } catch (err) {
      job.failed = 1
      job.status = job.controller.signal.aborted ? 'cancelled' : 'error'
      job.message = err instanceof Error ? err.message : 'Upload failed'
      throw err
    } finally {
      emit(true)
    }
  },

  cancel(job: UploadJob) {
    if (job.status === 'running') job.controller.abort()
  },

  /** Re-run only the files that failed or were cancelled. */
  retry(job: UploadJob) {
    if (job.kind !== 'photos' || job.status === 'running') return
    job.controller = new AbortController()
    void runPhotoJob(job)
  },

  dismiss(job: UploadJob) {
    if (job.status === 'running') return
    const i = jobs.indexOf(job)
    if (i >= 0) jobs.splice(i, 1)
    emit(true)
  },
}
