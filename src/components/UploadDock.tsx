import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { uploadStore, useUploads, type UploadJob } from '../lib/uploads'
import { EASE } from './kit'
import { num } from '../lib/format'

const STATUS_TEXT: Record<UploadJob['status'], string> = {
  running: 'Uploading',
  done: 'Upload complete',
  error: 'Finished with errors',
  cancelled: 'Cancelled',
}

function Ring({ pct, status }: { pct: number; status: UploadJob['status'] }) {
  const R = 15
  const C = 2 * Math.PI * R
  const color = status === 'done' ? 'stroke-emerald-500' : status === 'error' ? 'stroke-red-500' : 'stroke-accent'
  return (
    <svg viewBox="0 0 36 36" className="size-10 shrink-0 -rotate-90">
      <circle cx="18" cy="18" r={R} fill="none" strokeWidth="3.5" className="stroke-black/10" />
      <circle
        cx="18"
        cy="18"
        r={R}
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        className={`${color} transition-[stroke-dashoffset] duration-300`}
        strokeDasharray={C}
        strokeDashoffset={C * (1 - pct / 100)}
      />
    </svg>
  )
}

function JobCard({ job }: { job: UploadJob }) {
  const [open, setOpen] = useState(false)
  const running = job.status === 'running'
  const isPhotos = job.kind === 'photos'
  const problems = job.items.filter((i) => i.status === 'error')
  const live = job.items.filter((i) => i.status === 'uploading')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white shadow-lift"
    >
      <div
        className={`flex items-center gap-3 p-4 ${isPhotos ? 'cursor-pointer' : ''}`}
        onClick={isPhotos ? () => setOpen((v) => !v) : undefined}
        title={isPhotos ? (open ? 'Hide files' : 'Show files') : undefined}
      >
        <Ring pct={job.pct} status={job.status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">{job.title}</p>
          <p className="truncate text-[12.5px] text-mute">
            {STATUS_TEXT[job.status]}
            {isPhotos ? ` · ${num(job.done)} of ${num(job.total)} files` : ''}
            {job.failed && isPhotos ? ` · ${job.failed} failed` : ''}
          </p>
        </div>
        <span className="text-sm font-semibold tabular-nums">{job.pct}%</span>
        {isPhotos ? (
          <button
            type="button"
            aria-label={open ? 'Hide files' : 'Show files'}
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            className="grid size-8 place-items-center rounded-full text-mute hover:bg-black/5"
          >
            <span className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
          </button>
        ) : null}
      </div>

      <div className="px-4 pb-4">
        <div
          className={`h-1.5 overflow-hidden rounded-full bg-black/[0.07] ${isPhotos ? 'cursor-pointer' : ''}`}
          onClick={isPhotos ? () => setOpen((v) => !v) : undefined}
          title={isPhotos ? (open ? 'Hide files' : 'Show files') : undefined}
        >
          <motion.div
            className={`h-full rounded-full ${job.status === 'error' ? 'bg-red-500' : job.status === 'done' ? 'bg-emerald-500' : 'bg-accent'}`}
            animate={{ width: `${job.pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {job.message ? <p className="mt-3 text-[12.5px] font-medium text-red-600">{job.message}</p> : null}

        <AnimatePresence initial={false}>
          {open && isPhotos ? (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 max-h-44 space-y-1.5 overflow-y-auto pr-1 text-[12.5px]"
              data-lenis-prevent
            >
              {[...problems, ...live].slice(0, 40).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">{i.file.name}</span>
                  <span className={`shrink-0 font-medium ${i.status === 'error' ? 'text-red-600' : 'text-mute'}`}>
                    {i.status === 'error' ? i.error : `${i.progress}%`}
                  </span>
                </li>
              ))}
              {problems.length + live.length === 0 ? <li className="text-mute">No problems so far.</li> : null}
            </motion.ul>
          ) : null}
        </AnimatePresence>

        <div className="mt-3 flex flex-wrap gap-2">
          {running ? (
            <button
              type="button"
              className="rounded-full border border-black/10 px-4 py-2 text-[12.5px] font-semibold hover:bg-black/[0.04]"
              onClick={() => {
                if (confirm('Cancel this upload? Photos that already finished are kept.')) uploadStore.cancel(job)
              }}
            >
              Cancel upload
            </button>
          ) : (
            <>
              {isPhotos && (job.failed > 0 || job.status === 'cancelled') ? (
                <button
                  type="button"
                  className="rounded-full bg-ink px-4 py-2 text-[12.5px] font-semibold text-white"
                  onClick={() => uploadStore.retry(job)}
                >
                  {job.status === 'cancelled' ? 'Resume' : 'Retry failed'}
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-black/10 px-4 py-2 text-[12.5px] font-semibold hover:bg-black/[0.04]"
                onClick={() => uploadStore.dismiss(job)}
              >
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/** Floating bottom-right upload tray. Mounted once at the app root so it survives navigation. */
export default function UploadDock() {
  const { jobs, active } = useUploads()
  const [minimised, setMinimised] = useState(false)
  if (jobs.length === 0) return null
  const running = jobs.filter((j) => j.status === 'running')
  const overall = running.length ? Math.round(running.reduce((s, j) => s + j.pct, 0) / running.length) : 100

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(380px,calc(100vw-2rem))] flex-col items-end gap-3">
      {minimised ? (
        <motion.button
          layout
          type="button"
          onClick={() => setMinimised(false)}
          className="pointer-events-auto flex items-center gap-3 rounded-full border border-black/[0.06] bg-white py-2 pl-2 pr-5 text-sm font-semibold shadow-lift"
        >
          <Ring pct={overall} status={active ? 'running' : 'done'} />
          {active ? `Uploading · ${overall}%` : 'Uploads finished'}
        </motion.button>
      ) : (
        <div className="pointer-events-auto grid w-full gap-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setMinimised(true)}
              className="rounded-full bg-ink/90 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur hover:bg-ink"
            >
              Minimise
            </button>
          </div>
          <AnimatePresence initial={false}>
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
