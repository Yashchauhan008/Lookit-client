// Self-host MediaPipe's WASM runtime so the selfie camera never depends on a third-party CDN.
// Runs before `dev` and `build`; the output folder is git-ignored.
import { cpSync, existsSync, mkdirSync } from 'node:fs'

const from = 'node_modules/@mediapipe/tasks-vision/wasm'
const to = 'public/mediapipe/wasm'
if (!existsSync(from)) {
  console.warn('[copy-mediapipe] @mediapipe/tasks-vision is not installed, skipping')
  process.exit(0)
}
mkdirSync(to, { recursive: true })
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  cpSync(`${from}/${f}`, `${to}/${f}`)
}
console.log('[copy-mediapipe] copied face detector runtime to', to)
