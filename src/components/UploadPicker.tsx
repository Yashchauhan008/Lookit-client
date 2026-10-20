import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { billingApi, uploadsApi } from '../lib/api'
import { MAX_BYTES, uploadStore } from '../lib/uploads'
import { Button, Card, EASE } from './kit'
import { num } from '../lib/format'

const isImage = (f: File) => /\.(jpe?g|png)$/i.test(f.name) || f.type === 'image/jpeg' || f.type === 'image/png'
const isHeic = (f: File) => /\.(heic|heif)$/i.test(f.name)

const fmtSize = (b: number) =>
  b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(2)} GB` : b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(2)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`

type Picked = { files: File[]; ignored: number; heic: number; large: number; folder: string | null }

/** Reads dropped files, descending into dropped folders. Entries must be grabbed synchronously. */
async function filesFromDrop(dt: DataTransfer): Promise<{ files: File[]; folder: string | null }> {
  const entries = Array.from(dt.items || [])
    .map((i) => i.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => Boolean(e))
  if (!entries.some((e) => e.isDirectory)) return { files: Array.from(dt.files), folder: null }

  const out: File[] = []
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      out.push(await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej)))
      return
    }
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej))
      if (!batch.length) break
      for (const e of batch) await walk(e)
    }
  }
  for (const e of entries) await walk(e)
  const dirs = entries.filter((e) => e.isDirectory)
  return { files: out, folder: dirs.length === 1 ? dirs[0].name : null }
}

const LIST_CAP = 300
const CHECK_CHUNK = 2000
const dupKey = (f: { name: string; size: number }) => `${f.name}|${f.size}`

type DupState = {
  status: 'idle' | 'checking' | 'done' | 'failed'
  keys: Set<string>
  checked: number
  total: number
  error?: string
}
const IDLE: DupState = { status: 'idle', keys: new Set(), checked: 0, total: 0 }

export default function UploadPicker({ eventId, eventName }: { eventId: string; eventName: string }) {
  const filesInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [dragging, setDragging] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [reading, setReading] = useState(false)
  const [dup, setDup] = useState<DupState>(IDLE)
  const [mode, setMode] = useState<'remove' | 'keep'>('remove')
  const checkRun = useRef(0)

  useEffect(() => {
    if (!picked) return
    billingApi.summary().then((b) => setRemaining(b.totals.remaining)).catch(() => setRemaining(null))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPicked(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked])

  function ingest(list: File[], folderHint: string | null) {
    const seen = new Set<string>()
    const files: File[] = []
    let ignored = 0
    let heic = 0
    let large = 0
    for (const f of list) {
      if (isHeic(f)) heic += 1
      else if (!isImage(f)) ignored += 1
      else if (f.size > MAX_BYTES) large += 1
      else {
        const key = `${f.name}|${f.size}|${f.lastModified}`
        if (seen.has(key)) continue
        seen.add(key)
        files.push(f)
      }
    }
    const rel = list.find((f) => f.webkitRelativePath)?.webkitRelativePath.split('/')[0] ?? null
    setPicked({ files, ignored, heic, large, folder: folderHint ?? rel })
    setMode('remove')
    void checkDuplicates(files)
  }

  /** Ask the server which files are already in this event (matched by name + size). */
  async function checkDuplicates(files: File[]) {
    const run = ++checkRun.current
    if (!files.length) return setDup({ ...IDLE, status: 'done' })
    setDup({ ...IDLE, status: 'checking', total: files.length })
    try {
      const keys = new Set<string>()
      for (let i = 0; i < files.length; i += CHECK_CHUNK) {
        const slice = files.slice(i, i + CHECK_CHUNK)
        const res = await uploadsApi.checkDuplicates(
          eventId,
          slice.map((f) => ({ name: f.name, size: f.size })),
        )
        res.duplicates.forEach((d) => keys.add(dupKey(d)))
        if (run === checkRun.current) {
          setDup({ status: 'checking', keys: new Set(keys), checked: i + slice.length, total: files.length })
        }
      }
      if (run === checkRun.current) setDup({ status: 'done', keys, checked: files.length, total: files.length })
    } catch (err) {
      if (run !== checkRun.current) return
      const raw = err instanceof Error ? err.message : ''
      setDup({
        ...IDLE,
        status: 'failed',
        error: /404/.test(raw)
          ? 'The server doesn’t support duplicate checking yet. Restart or update the API, then retry.'
          : raw || 'The check could not be completed.',
      })
    }
  }

  const dupFiles = picked ? picked.files.filter((f) => dup.keys.has(dupKey(f))) : []
  const toUpload = picked ? (mode === 'remove' ? picked.files.filter((f) => !dup.keys.has(dupKey(f))) : picked.files) : []
  const over = picked && remaining !== null && toUpload.length > remaining
  const total = toUpload.reduce((s, f) => s + f.size, 0)

  function start() {
    if (!picked || !toUpload.length || over || dup.status === 'checking') return
    uploadStore.startPhotos(eventId, `${eventName} · ${num(toUpload.length)} photos`, toUpload)
    setPicked(null)
  }

  return (
    <Card>
      <h3 className="text-xl font-semibold tracking-tight">Upload photos</h3>
      <p className="mt-1 text-sm text-mute">
        JPEG / PNG · up to 30 MB each. Uploads keep running in the corner while you browse.
      </p>

      <motion.div
        className={`mt-5 grid place-items-center rounded-[1.5rem] border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? 'border-accent bg-accent/5' : 'border-black/15'
        }`}
        animate={{ scale: dragging ? 1.01 : 1 }}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          setReading(true)
          void filesFromDrop(e.dataTransfer)
            .then(({ files, folder }) => files.length && ingest(files, folder))
            .finally(() => setReading(false))
        }}
      >
        <div className="grid justify-items-center gap-4">
          <motion.span
            className="grid size-12 place-items-center rounded-full bg-ink text-xl text-white"
            animate={{ y: dragging ? -6 : [0, -4, 0] }}
            transition={dragging ? undefined : { duration: 2.4, repeat: Infinity }}
          >
            ↑
          </motion.span>
          <p className="font-semibold">{reading ? 'Reading files…' : 'Drop photos or a whole folder here'}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button small onClick={() => filesInput.current?.click()}>
              Choose photos
            </Button>
            <Button small variant="ghost" onClick={() => folderInput.current?.click()}>
              Choose folder
            </Button>
          </div>
        </div>
        <input
          ref={filesInput}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) ingest(Array.from(e.target.files), null)
            e.target.value = ''
          }}
        />
        <input
          ref={folderInput}
          type="file"
          multiple
          hidden
          {...({ webkitdirectory: '', directory: '' } as object)}
          onChange={(e) => {
            if (e.target.files?.length) ingest(Array.from(e.target.files), null)
            e.target.value = ''
          }}
        />
      </motion.div>

      <AnimatePresence>
        {picked ? (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-3 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPicked(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Review upload"
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[min(90svh,780px)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-lift"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5">
                <h2 className="text-xl font-semibold tracking-tight">{picked.folder ? 'Upload folder' : 'Upload photos'}</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setPicked(null)}
                  className="grid size-9 place-items-center rounded-full bg-black/[0.05] text-lg text-mute hover:text-ink"
                >
                  ×
                </button>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{picked.folder ?? 'Selected photos'}</p>
                  <p className="text-[13px] text-mute">
                    {[
                      picked.ignored ? `${num(picked.ignored)} non-image files ignored` : '',
                      picked.heic ? `${num(picked.heic)} HEIC files skipped (JPEG & PNG only for now)` : '',
                      picked.large ? `${num(picked.large)} over 30 MB skipped` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Ready to upload'}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-paper px-4 py-2 text-[13px] font-semibold">
                  {num(toUpload.length)} files · {fmtSize(total)}
                </span>
              </div>

              {dup.status === 'checking' ? (
                <div className="mx-6 mt-4 rounded-2xl bg-paper p-4" role="status" aria-live="polite">
                  <div className="flex items-center gap-3">
                    <motion.span
                      className="size-5 rounded-full border-[2.5px] border-black/10 border-t-accent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="text-[13.5px] font-semibold">
                      Checking for photos already in this event…
                    </span>
                    <span className="ml-auto text-[12.5px] tabular-nums text-mute">
                      {num(dup.checked)} / {num(dup.total)}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
                    {dup.checked === 0 ? (
                      <motion.div
                        className="h-full w-1/3 rounded-full bg-accent"
                        animate={{ x: ['-100%', '300%'] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ) : (
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        animate={{ width: `${(dup.checked / Math.max(1, dup.total)) * 100}%` }}
                        transition={{ duration: 0.25 }}
                      />
                    )}
                  </div>
                </div>
              ) : null}
              {dup.status === 'failed' ? (
                <div className="mx-6 mt-4 rounded-2xl bg-amber-50 p-4 text-amber-800">
                  <p className="text-[13.5px] font-semibold">Couldn’t check for duplicates</p>
                  <p className="mt-1 text-[13px]">{dup.error}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-ink px-4 py-2 text-[12.5px] font-semibold text-white"
                      onClick={() => picked && void checkDuplicates(picked.files)}
                    >
                      Retry check
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-amber-300 px-4 py-2 text-[12.5px] font-semibold hover:bg-amber-100"
                      onClick={() => {
                        setMode('keep')
                        setDup({ ...IDLE, status: 'done' })
                      }}
                    >
                      Upload without checking
                    </button>
                  </div>
                </div>
              ) : null}
              {dupFiles.length > 0 ? (
                <div className="mx-6 mt-4 rounded-2xl border border-black/[0.08] bg-paper p-4">
                  <p className="text-[14px] font-semibold">
                    {num(dupFiles.length)} {dupFiles.length === 1 ? 'photo is' : 'photos are'} already in this event
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Duplicate handling">
                    {(
                      [
                        ['remove', 'Skip duplicates', 'Recommended. Only new photos upload.'],
                        ['keep', 'Upload anyway', 'Adds a second copy of each.'],
                      ] as const
                    ).map(([value, title, hint]) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={mode === value}
                        onClick={() => setMode(value)}
                        className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                          mode === value ? 'border-ink bg-white' : 'border-transparent bg-white/60 hover:bg-white'
                        }`}
                      >
                        <span className="block text-[13.5px] font-semibold">{title}</span>
                        <span className="block text-[12px] text-mute">{hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {over && remaining !== null ? (
                <p className="mx-6 mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700">
                  Your plan has {num(remaining)} photos left but you picked {num(toUpload.length)}. Remove some, or{' '}
                  <Link to="/app?tab=subscription" className="underline">
                    add a plan or top-up
                  </Link>
                  .
                </p>
              ) : remaining !== null ? (
                <p className="mx-6 mt-4 text-[12.5px] text-mute">{num(remaining)} photos left on your plan.</p>
              ) : null}

              <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto px-6 pb-2" data-lenis-prevent>
                {picked.files.slice(0, LIST_CAP).map((f) => {
                  const isDup = dup.keys.has(dupKey(f))
                  return (
                  <li
                    key={`${f.name}|${f.size}|${f.lastModified}`}
                    className={`flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3 transition-opacity ${
                      isDup && mode === 'remove' ? 'opacity-50' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className={`block truncate text-[14px] font-medium ${isDup && mode === 'remove' ? 'line-through' : ''}`}>
                        {f.name}
                      </span>
                      <span className="text-[12px] text-mute">
                        {fmtSize(f.size)}
                        {isDup ? (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            {mode === 'remove' ? 'Already uploaded · skipped' : 'Already uploaded'}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-mute hover:bg-black/[0.06] hover:text-red-600"
                      onClick={() => setPicked((p) => (p ? { ...p, files: p.files.filter((x) => x !== f) } : p))}
                    >
                      🗑
                    </button>
                  </li>
                  )
                })}
                {picked.files.length > LIST_CAP ? (
                  <li className="py-2 text-center text-[13px] text-mute">
                    + {num(picked.files.length - LIST_CAP)} more files not shown
                  </li>
                ) : null}
                {picked.files.length === 0 ? (
                  <li className="py-10 text-center text-sm text-mute">No JPEG or PNG photos in this selection.</li>
                ) : null}
              </ul>

              <div className="grid grid-cols-2 gap-3 border-t border-black/[0.06] p-5">
                <Button variant="ghost" className="w-full" onClick={() => setPicked(null)}>
                  Close
                </Button>
                <Button
                  className="w-full"
                  disabled={!toUpload.length || Boolean(over) || dup.status === 'checking' || dup.status === 'failed'}
                  onClick={start}
                >
                  {dup.status === 'checking'
                    ? 'Checking…'
                    : dup.status === 'failed'
                      ? 'Resolve the check first'
                    : toUpload.length
                      ? `Upload ${num(toUpload.length)} ${toUpload.length === 1 ? 'photo' : 'photos'}`
                      : 'Nothing new to upload'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  )
}
