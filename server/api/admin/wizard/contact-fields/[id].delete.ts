import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige ID' })
  }

  const db = useDB()

  const field = db.prepare('SELECT field_name FROM wizard_contact_fields WHERE id = ?').get(id) as { field_name: string } | undefined
  if (!field) {
    throw createError({ statusCode: 404, statusMessage: 'Feld nicht gefunden' })
  }

  db.prepare('DELETE FROM wizard_contact_fields WHERE id = ?').run(id)

  const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
  logAudit('wizard_contact_field_deleted', field.field_name, '', ipHash)

  return { ok: true }
})
