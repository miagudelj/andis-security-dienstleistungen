import { requireAdmin, hashIP, logAudit } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige ID' })
  }

  const result = useDB().prepare('DELETE FROM services WHERE id = ?').run(id)
  if (result.changes === 0) throw createError({ statusCode: 404, statusMessage: 'Nicht gefunden' })

  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  logAudit('service_deleted', String(id), '', hashIP(ip))
  return { ok: true }
})
