import { z } from 'zod'
import { requireAdmin, hashIP, logAudit } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

const Body = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  position_de: z.string().min(1).max(200).optional(),
  position_en: z.string().max(200).optional(),
  slogan_de: z.string().max(500).optional(),
  slogan_en: z.string().max(500).optional(),
  image_path: z.string().max(500).optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  active: z.union([z.boolean(), z.number()]).optional(),
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

  if (d.first_name !== undefined) { updates.push('first_name = ?'); values.push(d.first_name) }
  if (d.last_name !== undefined) { updates.push('last_name = ?'); values.push(d.last_name) }
  if (d.position_de !== undefined) { updates.push('position_de = ?'); values.push(d.position_de) }
  if (d.position_en !== undefined) { updates.push('position_en = ?'); values.push(d.position_en) }
  if (d.slogan_de !== undefined) { updates.push('slogan_de = ?'); values.push(d.slogan_de) }
  if (d.slogan_en !== undefined) { updates.push('slogan_en = ?'); values.push(d.slogan_en) }
  if (d.image_path !== undefined) { updates.push('image_path = ?'); values.push(d.image_path) }
  if (d.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(d.sort_order) }
  if (d.active !== undefined) {
    const active = d.active === true || d.active === 1 ? 1 : 0
    updates.push('active = ?')
    values.push(active)
  }

  if (updates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Keine Felder zum Aktualisieren' })
  }

  updates.push("updated_at = datetime('now')")
  values.push(id)

  const db = useDB()
  const result = db.prepare(`UPDATE team_members SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  if (result.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Nicht gefunden' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  logAudit('team_member_updated', String(id), '', hashIP(ip))
  return { ok: true }
})
