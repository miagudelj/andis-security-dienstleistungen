import { z } from 'zod'
import { requireAdmin, hashIP, logAudit } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

const Body = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100).optional(),
  title_de: z.string().min(1).max(200).optional(),
  title_en: z.string().max(200).optional(),
  summary_de: z.string().max(500).optional(),
  summary_en: z.string().max(500).optional(),
  body_de: z.string().max(10_000).optional(),
  body_en: z.string().max(10_000).optional(),
  image_path: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  published: z.union([z.boolean(), z.number()]).optional(),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige ID' })
  }

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validierung fehlgeschlagen', data: parsed.error.flatten() })
  }
  const d = parsed.data

  // Build dynamic UPDATE query
  const updates: string[] = []
  const values: any[] = []

  if (d.slug !== undefined) { updates.push('slug = ?'); values.push(d.slug) }
  if (d.title_de !== undefined) { updates.push('title_de = ?'); values.push(d.title_de) }
  if (d.title_en !== undefined) { updates.push('title_en = ?'); values.push(d.title_en) }
  if (d.summary_de !== undefined) { updates.push('summary_de = ?'); values.push(d.summary_de) }
  if (d.summary_en !== undefined) { updates.push('summary_en = ?'); values.push(d.summary_en) }
  if (d.body_de !== undefined) { updates.push('body_de = ?'); values.push(d.body_de) }
  if (d.body_en !== undefined) { updates.push('body_en = ?'); values.push(d.body_en) }
  if (d.image_path !== undefined) { updates.push('image_path = ?'); values.push(d.image_path) }
  if (d.icon !== undefined) { updates.push('icon = ?'); values.push(d.icon) }
  if (d.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(d.sort_order) }
  if (d.published !== undefined) {
    const pub = d.published === true || d.published === 1 ? 1 : 0
    updates.push('published = ?')
    values.push(pub)
  }

  if (updates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Keine Felder zum Aktualisieren' })
  }

  updates.push("updated_at = datetime('now')")
  values.push(id)

  const db = useDB()

  try {
    const result = db.prepare(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    if (result.changes === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Nicht gefunden' })
    }

    const ip = getRequestIP(event, { xForwardedFor: true }) || ''
    logAudit('service_updated', String(id), d.slug || '', hashIP(ip))
    return { ok: true }
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: 'Slug bereits vergeben' })
    }
    throw e
  }
})
