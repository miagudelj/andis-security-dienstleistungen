import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige ID' })
  }

  const db = useDB()

  const option = db.prepare('SELECT slug FROM wizard_options WHERE id = ?').get(id) as { slug: string } | undefined
  if (!option) {
    throw createError({ statusCode: 404, statusMessage: 'Option nicht gefunden' })
  }

  db.prepare('DELETE FROM wizard_options WHERE id = ?').run(id)

  const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
  logAudit('wizard_option_deleted', option.slug, '', ipHash)

  return { ok: true }
})
