import { destroySession, hashIP, logAudit } from '~~/server/utils/auth'

export default defineEventHandler((event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  destroySession(event)
  logAudit('logout', '', '', hashIP(ip))
  return { ok: true }
})
