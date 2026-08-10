import { z } from 'zod'
import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

const Body = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100).optional(),
  label_de: z.string().min(1).max(200).optional(),
  label_en: z.string().max(200).optional(),
  description_de: z.string().max(500).optional(),
  description_en: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  active: z.union([z.boolean(), z.number()]).optional(),
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
  const d = parsed.data

  // Build dynamic UPDATE query
  const updates: string[] = []
  const values: any[] = []

  if (d.slug !== undefined) { updates.push('slug = ?'); values.push(d.slug) }
  if (d.label_de !== undefined) { updates.push('label_de = ?'); values.push(d.label_de) }
  if (d.label_en !== undefined) { updates.push('label_en = ?'); values.push(d.label_en) }
  if (d.description_de !== undefined) { updates.push('description_de = ?'); values.push(d.description_de) }
  if (d.description_en !== undefined) { updates.push('description_en = ?'); values.push(d.description_en) }
  if (d.icon !== undefined) { updates.push('icon = ?'); values.push(d.icon) }
  if (d.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(d.sort_order) }
  if (d.active !== undefined) {
    const active = d.active === true || d.active === 1 ? 1 : 0
    updates.push('active = ?')
    values.push(active)
  }

  if (updates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Keine Felder zum Aktualisieren' })
  }

  values.push(id)

  try {
    const result = db.prepare(`UPDATE wizard_options SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    if (result.changes === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Option nicht gefunden' })
    }

    const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
    logAudit('wizard_option_updated', d.slug || String(id), '', ipHash)

    return { ok: true }
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: 'Slug existiert bereits für diesen Schritt' })
    }
    throw err
  }
})
