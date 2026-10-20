import { FaceDetector, FilesetResolver, type Detection } from '@mediapipe/tasks-vision'

let detector: Promise<FaceDetector> | null = null

/** Loads the on-device face detector once (self-hosted model + WASM, runs entirely in the browser). */
export function loadFaceDetector() {
  detector ??= (async () => {
    const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: '/mediapipe/blaze_face_short_range.tflite', delegate: 'CPU' },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.6,
    })
  })().catch((err) => {
    detector = null // allow a retry
    throw err
  })
  return detector
}

export type FaceCheck = {
  ok: boolean
  hint: string
  /** Face centre as a fraction of the frame, used to tell "holding still" from "moving". */
  cx?: number
  cy?: number
}

// Tuned for a selfie held at arm's length inside a 3:4 portrait frame.
const MIN_WIDTH = 0.26 // face width / frame width: closer than this = too far
const MAX_WIDTH = 0.62
const MAX_OFFSET_X = 0.13
const MAX_OFFSET_Y = 0.15
const MAX_TILT_DEG = 12
const MAX_YAW = 0.2 // nose offset from the eye midpoint, in eye-distances

/** Decides whether a detected face is good enough to take the selfie, or what to tell the guest to fix. */
export function assessFace(detections: Detection[], vw: number, vh: number): FaceCheck {
  if (detections.length === 0) return { ok: false, hint: 'Show your face to the camera' }
  if (detections.length > 1) return { ok: false, hint: 'Just one face in the frame, please' }

  const d = detections[0]
  const box = d.boundingBox
  if (!box || vw === 0 || vh === 0) return { ok: false, hint: 'Show your face to the camera' }

  const w = box.width / vw
  const cx = (box.originX + box.width / 2) / vw
  const cy = (box.originY + box.height / 2) / vh
  const at = { cx, cy }

  if (w < MIN_WIDTH) return { ok: false, hint: 'Move a little closer', ...at }
  if (w > MAX_WIDTH) return { ok: false, hint: 'Move back a little', ...at }
  if (Math.abs(cx - 0.5) > MAX_OFFSET_X || Math.abs(cy - 0.47) > MAX_OFFSET_Y) {
    return { ok: false, hint: 'Centre your face in the oval', ...at }
  }

  // Keypoints: 0 right eye, 1 left eye, 2 nose tip (normalised to the frame).
  const [eyeA, eyeB, nose] = d.keypoints
  if (eyeA && eyeB && nose) {
    const dx = eyeB.x - eyeA.x
    const dy = eyeB.y - eyeA.y
    const eyeDist = Math.hypot(dx * vw, dy * vh) || 1
    const tilt = Math.abs((Math.atan2(dy * vh, Math.abs(dx) * vw) * 180) / Math.PI)
    if (tilt > MAX_TILT_DEG) return { ok: false, hint: 'Keep your head level', ...at }
    const mid = (eyeA.x + eyeB.x) / 2
    if (Math.abs(nose.x - mid) * vw / eyeDist > MAX_YAW) {
      return { ok: false, hint: 'Look straight at the camera', ...at }
    }
  }
  return { ok: true, hint: 'Hold still…', ...at }
}
