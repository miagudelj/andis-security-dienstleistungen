import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { hashIP, logAudit } from '~~/server/utils/auth'
import { rateLimit } from '~~/server/utils/rate-limit'
import { useDB } from '~~/server/utils/db'

const Body = z.object({
  devices: z.array(z.object({
    slug: z.string().max(100),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(20),
  locations: z.array(z.string().max(100)).min(1).max(20),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  phone: z.string().min(5).max(50),
  zip: z.string().min(4).max(10),
  city: z.string().min(1).max(100),
  message: z.string().max(2000).default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'Datenschutz muss akzeptiert werden' }) }),
  // Honeypot-Feld – muss leer bleiben (Bot-Schutz)
  website: z.string().max(0).optional(),
})

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const ipHash = hashIP(ip)

  // Rate limit: 3 Offerten / 10 min pro IP
  const rl = rateLimit({ key: `offer:${ipHash}`, max: 3, windowMs: 10 * 60_000 })
  if (!rl.ok) {
    throw createError({
      statusCode: 429,
      statusMessage: `Bitte ${rl.retryAfterSec}s warten, bevor Sie eine weitere Offerte senden.`,
    })
  }

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Bitte alle Felder korrekt ausfüllen', data: parsed.error.flatten() })
  }
  const d = parsed.data

  const reference = `AND-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`
  const userAgent = (getHeader(event, 'user-agent') || '').slice(0, 300)

  useDB().prepare(`
    INSERT INTO offers (reference, devices_json, locations_json, first_name, last_name, email, phone, zip, city, message, consent, ip_hash, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reference,
    JSON.stringify(d.devices),
    JSON.stringify(d.locations),
    d.first_name, d.last_name, d.email, d.phone, d.zip, d.city, d.message,
    1, ipHash, userAgent,
  )

  logAudit('offer_received', reference, '', ipHash)
  return { ok: true, reference }
})
