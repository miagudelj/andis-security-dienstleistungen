import { randomBytes } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { requireAdmin, hashIP, logAudit } from '~~/server/utils/auth'
import { rateLimit } from '~~/server/utils/rate-limit'

const MAX_BYTES = 5 * 1024 * 1024
const UPLOAD_SUBDIR = 'images/uploads'

type Detected = { ext: 'jpg' | 'png' | 'webp' | 'gif' | 'avif'; mime: string } | null

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

// Magic-Bytes-Erkennung — verhindert, dass z.B. ein .exe als image/jpeg deklariert hochgeladen wird.
function detectImage(buf: Buffer): Detected {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' }
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return { ext: 'png', mime: 'image/png' }
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' }
  }
  // GIF87a / GIF89a
  if (buf.length >= 6 && buf.toString('ascii', 0, 4) === 'GIF8' && (buf[4] === 0x37 || buf[4] === 0x39) && buf[5] === 0x61) {
    return { ext: 'gif', mime: 'image/gif' }
  }
  // AVIF: ISO BMFF box "ftypavif" startet bei Offset 4
  if (buf.length >= 12 && buf.toString('ascii', 4, 12) === 'ftypavif') {
    return { ext: 'avif', mime: 'image/avif' }
  }
  return null
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  const ipHash = hashIP(ip)

  const rl = rateLimit({ key: `upload:${ipHash || 'unknown'}`, max: 20, windowMs: 10 * 60 * 1000 })
  if (!rl.ok) {
    throw createError({
      statusCode: 429,
      statusMessage: `Zu viele Uploads. Bitte in ${rl.retryAfterSec}s erneut versuchen.`,
    })
  }

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Keine Datei übermittelt.' })
  }

  const file = parts.find((p) => p.name === 'file' && p.filename)
  if (!file || !file.data || file.data.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Feld "file" fehlt.' })
  }
  if (file.data.length > MAX_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Datei zu gross (max. 5 MB).' })
  }

  // Defense-in-depth: Client-MIME muss in Whitelist (Bonus-Check, eigentlich verlassen wir uns auf Magic-Bytes).
  const clientMime = (file.type || '').toLowerCase()
  if (clientMime && !ALLOWED_MIMES.includes(clientMime)) {
    throw createError({ statusCode: 415, statusMessage: 'Format nicht unterstützt. Erlaubt: JPEG, PNG, WebP, GIF, AVIF.' })
  }

  const detected = detectImage(file.data)
  if (!detected) {
    throw createError({ statusCode: 415, statusMessage: 'Datei wird nicht als gültiges Bild erkannt (JPEG, PNG, WebP, GIF oder AVIF).' })
  }

  // Wenn Client einen MIME-Typ angibt, muss er zum tatsächlichen Format passen.
  if (clientMime && clientMime !== detected.mime) {
    throw createError({
      statusCode: 415,
      statusMessage: `Datei-Inhalt (${detected.mime}) passt nicht zum angegebenen Typ (${clientMime}).`,
    })
  }

  const dir = resolve('public', UPLOAD_SUBDIR)
  await mkdir(dir, { recursive: true })

  // Dateiname zufällig erzeugen — Client-Filename wird verworfen (Path-Traversal-Schutz).
  const filename = `${Date.now()}-${randomBytes(8).toString('hex')}.${detected.ext}`
  await writeFile(join(dir, filename), file.data)

  const publicPath = `/${UPLOAD_SUBDIR}/${filename}`
  logAudit('image_uploaded', publicPath, `${detected.mime}, ${file.data.length}b`, ipHash)

  return { ok: true, path: publicPath, size: file.data.length, mime: detected.mime }
})
