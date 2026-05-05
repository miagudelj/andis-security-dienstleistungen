// Sehr einfacher In-Memory Rate-Limiter pro IP+Bucket.
// Reicht für ein-Server-Setup. Für horizontale Skalierung -> Redis.

type Bucket = { count: number; resetAt: number }
const store = new Map<string, Bucket>()

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store) if (v.resetAt < now) store.delete(k)
}, 60_000).unref?.()

export function rateLimit(opts: {
  key: string
  max: number
  windowMs: number
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  const bucket = store.get(opts.key)

  if (!bucket || bucket.resetAt < now) {
    store.set(opts.key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true }
  }
  if (bucket.count >= opts.max) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count++
  return { ok: true }
}
