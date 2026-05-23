import { z } from 'zod'
import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

const Body = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  label_de: z.string().min(1).max(200),
  label_en: z.string().min(1).max(200),
  description_de: z.string().max(500).default(''),
  description_en: z.string().max(500).default(''),
  icon: z.string().max(50).default(''),
  sort_order: z.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige ID' })
  }

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Eingabe', data: parsed.error.flatten() })
  }

  const db = useDB()
  const data = parsed.data

  try {
    const result = db.prepare(`
      UPDATE wizard_options SET
        slug = ?, label_de = ?, label_en = ?, description_de = ?, description_en = ?,
        icon = ?, sort_order = ?, active = ?
      WHERE id = ?
    `).run(
      data.slug, data.label_de, data.label_en, data.description_de, data.description_en,
      data.icon, data.sort_order, data.active ? 1 : 0, id
    )

    if (result.changes === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Option nicht gefunden' })
    }

    const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
    logAudit('wizard_option_updated', data.slug, '', ipHash)

    return { ok: true }
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: 'Slug existiert bereits für diesen Schritt' })
    }
    throw err
  }
})
