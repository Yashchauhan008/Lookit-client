import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { eventsApi } from '../lib/api'
import { num } from '../lib/format'
import { Card, EASE, Pill } from './kit'

type Data = Awaited<ReturnType<typeof eventsApi.scans>>

const ago = (iso: string) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} d ago`
}

/** Owner view of guest face scans: totals, Rekognition usage and the saved selfies. */
export default function GuestScans({ eventId }: { eventId: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<Data['scans'][number] | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await eventsApi.scans(eventId))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load guest scans')
    }
  }, [eventId])

  useEffect(() => {
    void load()
    const t = setInterval(() => document.visibilityState === 'visible' && void load(), 30_000)
    return () => clearInterval(t)
  }, [load])

  const s = data?.stats
  const tiles: Array<[string, string, string]> = s
    ? [
        ['Face scans', num(s.total_scans), 'total searches'],
        ['Guests', num(s.unique_guests), 'unique devices'],
        ['Matched', num(s.matched), `${num(s.no_match)} no match · ${num(s.no_face)} no face`],
        ['Face API calls', num(s.face_api_calls), 'Rekognition searches'],
        ['Calls saved', num(s.calls_saved), 'reopened saved results'],
      ]
    : []

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Pill tint>Guest scans</Pill>
          <h3 className="mt-3 text-xl font-semibold tracking-tight">Who found their photos</h3>
          <p className="mt-1 max-w-xl text-sm text-mute">
            Each guest’s selfie is saved with their consent and shown only to you. They can delete theirs at any time.
          </p>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

      {s ? (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {tiles.map(([label, value, hint], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
              className="rounded-2xl bg-paper px-4 py-3"
            >
              <p className="text-[12px] font-semibold text-mute">{label}</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
              <p className="truncate text-[11.5px] text-mute">{hint}</p>
            </motion.div>
          ))}
        </div>
      ) : null}

      {data && data.scans.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-paper px-5 py-8 text-center text-sm text-mute">
          No guest scans yet. Share the link or QR code and guests will show up here.
        </p>
      ) : null}

      {data && data.scans.length > 0 ? (
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {data.scans.map((sc, i) => (
            <motion.button
              key={sc.id}
              type="button"
              onClick={() => setOpen(sc)}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.03 }}
              whileHover={{ y: -4 }}
              className="group text-left"
            >
              <span className="relative block aspect-square overflow-hidden rounded-2xl bg-paper shadow-soft">
                {sc.selfie_url ? (
                  <img src={sc.selfie_url} alt="Guest selfie" loading="lazy" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-xs text-mute">No preview</span>
                )}
                <span
                  className={`absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                    sc.match_count > 0 ? 'bg-emerald-500 text-white' : 'bg-white/90 text-mute'
                  }`}
                >
                  {sc.match_count > 0 ? `${sc.match_count} photos` : 'no match'}
                </span>
              </span>
              <span className="mt-1 block text-[11.5px] text-mute">{ago(sc.created_at)}</span>
            </motion.button>
          ))}
        </div>
      ) : null}

      <AnimatePresence>
        {open?.selfie_url ? (
          <motion.div
            className="fixed inset-0 z-[80] grid cursor-zoom-out place-items-center bg-ink/80 p-5 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-w-sm overflow-hidden rounded-[1.75rem] bg-white shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={open.selfie_url} alt="Guest selfie" className="max-h-[70svh] w-full object-cover" />
              <p className="px-5 py-4 text-sm font-medium">
                {open.match_count > 0 ? `Matched in ${num(open.match_count)} photos` : 'No matching photos'} ·{' '}
                {ago(open.created_at)}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  )
}
