import { randomBytes, createHmac, createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { useDB } from './db'

const SESSION_COOKIE = 'andis_session'
const SESSION_TTL_HOURS = 8

export function hashIP(ip: string | undefined): string {
  if (!ip) return ''
  return createHash('sha256').update(ip).digest('hex').slice(0, 24)
}

function signSessionId(id: string, secret: string): string {
  return createHmac('sha256', secret).update(id).digest('hex')
}

function buildToken(id: string, secret: string): string {
  return `${id}.${signSessionId(id, secret)}`
}

function parseAndVerifyToken(token: string, secret: string): string | null {
  const dot = token.indexOf('.')
  if (dot < 0) return null
  const id = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = signSessionId(id, secret)
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
    return id
  } catch {
    return null
  }
}

export async function createSession(event: H3Event): Promise<void> {
  const config = useRuntimeConfig()
  if (!config.sessionSecret) {
    throw createError({ statusCode: 500, statusMessage: 'SESSION_SECRET fehlt in .env' })
  }

  const db = useDB()
  const id = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString()
  const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')

  db.prepare('INSERT INTO sessions (id, expires_at, ip_hash) VALUES (?, ?, ?)').run(id, expiresAt, ipHash)

  setCookie(event, SESSION_COOKIE, buildToken(id, config.sessionSecret), {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_HOURS * 3600,
  })
}

export function destroySession(event: H3Event): void {
  const config = useRuntimeConfig()
  const token = getCookie(event, SESSION_COOKIE)
  if (token && config.sessionSecret) {
    const id = parseAndVerifyToken(token, config.sessionSecret)
    if (id) useDB().prepare('DELETE FROM sessions WHERE id = ?').run(id)
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export function isAuthenticated(event: H3Event): boolean {
  const config = useRuntimeConfig()
  const token = getCookie(event, SESSION_COOKIE)
  if (!token || !config.sessionSecret) return false

  const id = parseAndVerifyToken(token, config.sessionSecret)
  if (!id) return false

  const db = useDB()
  const row = db.prepare('SELECT expires_at FROM sessions WHERE id = ?').get(id) as { expires_at: string } | undefined
  if (!row) return false

  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
    return false
  }
  return true
}

export function requireAdmin(event: H3Event): void {
  if (!isAuthenticated(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Nicht angemeldet' })
  }
}

export function logAudit(action: string, target = '', detail = '', ipHash = '') {
  useDB().prepare('INSERT INTO audit_log (action, target, detail, ip_hash) VALUES (?, ?, ?, ?)')
    .run(action, target, detail, ipHash)
}
