import { useCallback, useRef, useState } from 'react'
import { uploadsApi } from '../lib/api'

type Props = {
  eventId: string
  onComplete?: () => void
}

type FileJob = {
  id: string
  file: File
  status: 'queued' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

const MAX_BYTES = 30 * 1024 * 1024
const PART_SIZE = 8 * 1024 * 1024
const ACCEPTED = new Set(['image/jpeg', 'image/png'])

function isAccepted(file: File) {
  if (ACCEPTED.has(file.type)) return true
  const n = file.name.toLowerCase()
  return n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.png')
}

async function uploadParts(
  file: File,
  urls: Array<{ partNumber: number; url: string }>,
  onProgress: (ratio: number) => void,
) {
  const parts: Array<{ PartNumber: number; ETag: string }> = []
  let uploaded = 0
  const total = file.size

  for (const { partNumber, url } of urls) {
    const start = (partNumber - 1) * PART_SIZE
    const end = Math.min(start + PART_SIZE, file.size)
    const blob = file.slice(start, end)
    const res = await fetch(url, { method: 'PUT', body: blob })
    if (!res.ok) {
      throw new Error(`Part ${partNumber} failed (${res.status})`)
    }
    const etag = res.headers.get('ETag') || res.headers.get('etag')
    if (!etag) throw new Error(`Missing ETag for part ${partNumber}`)
    parts.push({ PartNumber: partNumber, ETag: etag })
    uploaded += blob.size
    onProgress(uploaded / total)
  }

  return parts
}

export default function EventUploader({ eventId, onComplete }: Props) {
  const [jobs, setJobs] = useState<FileJob[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const draggingRef = useRef(false)
  const [dragging, setDragging] = useState(false)

  const updateJob = useCallback((id: string, patch: Partial<FileJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }, [])

  const queueFiles = useCallback((list: FileList | File[]) => {
    setError('')
    const next: FileJob[] = []
    for (const file of Array.from(list)) {
      if (!isAccepted(file)) {
        setError('Only JPEG and PNG are accepted (HEIC later)')
        continue
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} exceeds 30 MB`)
        continue
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        status: 'queued',
        progress: 0,
      })
    }
    if (next.length) setJobs((prev) => [...prev, ...next])
  }, [])

  const startUpload = useCallback(async () => {
    const pending = jobs.filter((j) => j.status === 'queued' || j.status === 'error')
    if (!pending.length || busy) return

    setBusy(true)
    setError('')
    let sessionId: string | null = null

    try {
      const session = await uploadsApi.createSession(eventId, {
        file_count: pending.length,
      })
      sessionId = session.session.id

      for (const job of pending) {
        updateJob(job.id, { status: 'uploading', progress: 0, error: undefined })
        try {
          const contentType =
            job.file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          const created = await uploadsApi.createMultipart(eventId, sessionId, {
            filename: job.file.name,
            content_type: contentType,
            size_bytes: job.file.size,
          })

          const partCount = Math.max(1, Math.ceil(job.file.size / PART_SIZE))
          const urls: Array<{ partNumber: number; url: string }> = []
          for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
            const signed = await uploadsApi.signPart(eventId, created.photo_id, {
              part_number: partNumber,
              upload_id: created.upload_id,
            })
            urls.push({ partNumber, url: signed.url })
          }

          const parts = await uploadParts(job.file, urls, (ratio) => {
            updateJob(job.id, { progress: Math.round(ratio * 100) })
          })

          await uploadsApi.completeMultipart(eventId, created.photo_id, {
            upload_id: created.upload_id,
            parts,
          })
          updateJob(job.id, { status: 'done', progress: 100 })
        } catch (err) {
          updateJob(job.id, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Upload failed',
          })
        }
      }

      onComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload session failed')
      if (sessionId) {
        void uploadsApi.abortSession(eventId, sessionId).catch(() => undefined)
      }
    } finally {
      setBusy(false)
    }
  }, [busy, eventId, jobs, onComplete, updateJob])

  return (
    <section className="event-card upload-panel">
      <h3>Upload photos</h3>
      <p className="auth-sub">JPEG / PNG · max 30 MB · direct to object storage</p>
      {error ? <p className="auth-error">{error}</p> : null}

      <div
        className={`dropzone${dragging ? ' is-dragging' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault()
          draggingRef.current = true
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => {
          draggingRef.current = false
          setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files?.length) queueFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        role="button"
        tabIndex={0}
      >
        <p>Drop photos here or click to choose</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) queueFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {jobs.length > 0 ? (
        <>
          <ul className="upload-jobs">
            {jobs.map((j) => (
              <li key={j.id}>
                <div className="upload-job-meta">
                  <span>{j.file.name}</span>
                  <span className="photo-status">
                    {j.status === 'uploading' ? `${j.progress}%` : j.status}
                  </span>
                </div>
                <div className="upload-bar">
                  <div style={{ width: `${j.progress}%` }} />
                </div>
                {j.error ? <p className="auth-error">{j.error}</p> : null}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn"
            disabled={busy || !jobs.some((j) => j.status === 'queued' || j.status === 'error')}
            onClick={() => void startUpload()}
            style={{ marginTop: '1rem' }}
          >
            {busy ? 'Uploading…' : 'Start upload'}
          </button>
        </>
      ) : null}
    </section>
  )
}
