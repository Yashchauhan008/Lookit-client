import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { assessFace, loadFaceDetector } from '../lib/faceQuality'
import { Button } from './kit'

type Phase = 'starting' | 'looking' | 'capturing' | 'denied' | 'fallback'

const HOLD_MS = 900 // face must be well placed and steady for this long before we shoot
const MAX_DRIFT = 0.035 // how far the face may move between checks and still count as "still"
const CHECK_EVERY_MS = 80

/**
 * Opens the front camera and takes the selfie by itself once a face is properly in frame:
 * one face, centred, close enough, level and facing the camera, held steady for a moment.
 * There is no capture button; if the detector can't load we fall back to a manual shutter.
 */
export default function SelfieCamera({
  onCapture,
  busy,
}: {
  onCapture: (file: File) => void
  busy: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const doneRef = useRef(false)
  const [phase, setPhase] = useState<Phase>('starting')
  const [hint, setHint] = useState('Starting camera…')
  const [progress, setProgress] = useState(0)
  const [frozen, setFrozen] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const [attempt, setAttempt] = useState(0)
  // The parent passes a new callback every render; keep the latest one in a ref so a re-render
  // can never restart the camera session (which would shoot, and search, a second time).
  const onCaptureRef = useRef(onCapture)
  useEffect(() => {
    onCaptureRef.current = onCapture
  })

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const shoot = useCallback(async () => {
    const video = videoRef.current
    if (!video || doneRef.current) return
    doneRef.current = true
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 960
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.92))
    if (!blob) {
      doneRef.current = false
      return
    }
    setPhase('capturing')
    setHint('Got it! Finding your photos…')
    setFlash(true)
    setFrozen(URL.createObjectURL(blob))
    stop()
    onCaptureRef.current(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }))
  }, [stop])

  useEffect(() => {
    doneRef.current = false
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    ;(async () => {
      setPhase('starting')
      setHint('Starting camera…')
      setFrozen(null)
      setProgress(0)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        })
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
      } catch {
        if (!cancelled) setPhase('denied')
        return
      }

      setHint('Getting ready…')
      let det
      try {
        det = await loadFaceDetector()
      } catch {
        if (!cancelled) {
          setPhase('fallback')
          setHint('Auto-capture isn’t available on this device')
        }
        return
      }
      if (cancelled) return

      setPhase('looking')
      setHint('Show your face to the camera')
      let goodSince: number | null = null
      let last: { cx: number; cy: number } | null = null
      let lastTime = -1

      const tick = () => {
        if (cancelled || doneRef.current) return
        const video = videoRef.current
        if (video && video.readyState >= 2 && video.currentTime !== lastTime) {
          lastTime = video.currentTime
          const res = det.detectForVideo(video, performance.now())
          const check = assessFace(res.detections, video.videoWidth, video.videoHeight)
          const still = !last || check.cx === undefined || Math.hypot(check.cx - last.cx, (check.cy ?? 0) - last.cy) < MAX_DRIFT
          last = check.cx !== undefined ? { cx: check.cx, cy: check.cy ?? 0 } : null

          if (check.ok && still) {
            goodSince ??= performance.now()
            const p = Math.min(1, (performance.now() - goodSince) / HOLD_MS)
            setProgress(p)
            setHint('Hold still…')
            if (p >= 1) return void shoot()
          } else {
            goodSince = null
            setProgress(0)
            setHint(check.ok ? 'Hold still…' : check.hint)
          }
        }
        timer = setTimeout(tick, CHECK_EVERY_MS)
      }
      tick()
    })()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      stop()
    }
  }, [attempt, shoot, stop])

  const ring = phase === 'capturing' ? 'stroke-emerald-400' : progress > 0 ? 'stroke-accent' : 'stroke-white/80'

  return (
    <div className="grid gap-4">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.5rem] bg-ink">
        <video
          ref={videoRef}
          className={`size-full -scale-x-100 object-cover ${frozen ? 'invisible' : ''}`}
          playsInline
          muted
        />
        {frozen ? <img src={frozen} alt="" className="absolute inset-0 size-full -scale-x-100 object-cover" /> : null}

        {/* dim everything outside the oval, then draw the oval and its progress ring */}
        <svg viewBox="0 0 100 133" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
          <defs>
            <mask id="oval-hole">
              <rect width="100" height="133" fill="white" />
              <ellipse cx="50" cy="62" rx="33" ry="44" fill="black" />
            </mask>
          </defs>
          <rect width="100" height="133" fill="rgba(13,13,16,0.45)" mask="url(#oval-hole)" />
          <ellipse cx="50" cy="62" rx="33" ry="44" fill="none" strokeWidth="0.8" strokeDasharray="2 2" className="stroke-white/50" />
          <ellipse
            cx="50"
            cy="62"
            rx="33"
            ry="44"
            fill="none"
            strokeWidth="1.6"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={phase === 'capturing' ? 0 : 1 - progress}
            className={`${ring} transition-[stroke-dashoffset] duration-100`}
            transform="rotate(-90 50 62)"
          />
        </svg>

        {busy || phase === 'capturing' ? (
          <motion.div
            className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-accent/50 to-transparent"
            animate={{ top: ['-10%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          />
        ) : null}

        <AnimatePresence>
          {flash ? (
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              onAnimationComplete={() => setFlash(false)}
            />
          ) : null}
        </AnimatePresence>

        {phase !== 'denied' ? (
          <div className="absolute inset-x-3 bottom-3 flex justify-center">
            <motion.span
              key={hint}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold backdrop-blur ${
                phase === 'capturing' ? 'bg-emerald-500/90 text-white' : progress > 0 ? 'bg-accent/90 text-white' : 'bg-ink/70 text-white'
              }`}
              role="status"
              aria-live="polite"
            >
              {hint}
            </motion.span>
          </div>
        ) : null}
      </div>

      {phase === 'denied' ? (
        <div className="grid gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
          <p className="text-sm font-medium">
            We couldn’t open your camera. Allow camera access for this site in your browser settings, then try again.
          </p>
          <div>
            <Button small onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </Button>
          </div>
        </div>
      ) : null}

      {phase === 'fallback' ? (
        <div className="grid gap-3">
          <p className="text-sm text-mute">We couldn’t start automatic detection here, so take the photo yourself.</p>
          <div>
            <Button variant="accent" onClick={() => void shoot()}>
              Take selfie
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
