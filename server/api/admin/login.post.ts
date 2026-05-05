import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createSession, hashIP, logAudit } from '~~/server/utils/auth'
import { rateLimit } from '~~/server/utils/rate-limit'

const Body = z.object({
  password: z.string().min(1).max(200),
})

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const ipHash = hashIP(ip)

  // Rate limit: 5 Versuche / 15 Minuten pro IP
  const rl = rateLimit({ key: `login:${ipHash}`, max: 5, windowMs: 15 * 60_000 })
  if (!rl.ok) {
    logAudit('login_rate_limited', '', '', ipHash)
    throw createError({
      statusCode: 429,
      statusMessage: `Zu viele Versuche. Erneut versuchen in ${rl.retryAfterSec}s.`,
    })
  }

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Eingabe' })
  }

  const config = useRuntimeConfig()
  if (!config.adminPasswordHash) {
    throw createError({ statusCode: 500, statusMessage: 'ADMIN_PASSWORD_HASH fehlt in .env' })
  }

  // Konstantzeit-Vergleich via bcrypt
  const ok = await bcrypt.compare(parsed.data.password, config.adminPasswordHash)
  if (!ok) {
    logAudit('login_failed', '', '', ipHash)
    // Künstliche Verzögerung gegen Timing-Attacks (zusätzlich zu bcrypt)
    await new Promise((r) => setTimeout(r, 250))
    throw createError({ statusCode: 401, statusMessage: 'Falsches Passwort' })
  }

  await createSession(event)
  logAudit('login_success', '', '', ipHash)
  return { ok: true }
})
