import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige ID' })
  }

  const db = useDB()

  const step = db.prepare('SELECT slug FROM wizard_steps WHERE id = ?').get(id) as { slug: string } | undefined
  if (!step) {
    throw createError({ statusCode: 404, statusMessage: 'Schritt nicht gefunden' })
  }

  // Delete will cascade to options and contact_fields
  db.prepare('DELETE FROM wizard_steps WHERE id = ?').run(id)

  const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
  logAudit('wizard_step_deleted', step.slug, '', ipHash)

  return { ok: true }
})
