import { z } from 'zod'
import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

const Body = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100).optional(),
  step_type: z.enum(['multi_select', 'single_select', 'quantity_input', 'contact_form', 'free_text']).optional(),
  title_de: z.string().min(1).max(200).optional(),
  title_en: z.string().min(1).max(200).optional(),
  subtitle_de: z.string().max(500).optional(),
  subtitle_en: z.string().max(500).optional(),
  error_message_de: z.string().max(200).optional(),
  error_message_en: z.string().max(200).optional(),
  is_required: z.boolean().optional(),
  min_selections: z.number().int().min(0).max(99).optional(),
  max_selections: z.number().int().min(1).max(99).optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
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

  // Build dynamic UPDATE query based on provided fields
  const updates: string[] = []
  const values: any[] = []

  if (data.slug !== undefined) { updates.push('slug = ?'); values.push(data.slug) }
  if (data.step_type !== undefined) { updates.push('step_type = ?'); values.push(data.step_type) }
  if (data.title_de !== undefined) { updates.push('title_de = ?'); values.push(data.title_de) }
  if (data.title_en !== undefined) { updates.push('title_en = ?'); values.push(data.title_en) }
  if (data.subtitle_de !== undefined) { updates.push('subtitle_de = ?'); values.push(data.subtitle_de) }
  if (data.subtitle_en !== undefined) { updates.push('subtitle_en = ?'); values.push(data.subtitle_en) }
  if (data.error_message_de !== undefined) { updates.push('error_message_de = ?'); values.push(data.error_message_de) }
  if (data.error_message_en !== undefined) { updates.push('error_message_en = ?'); values.push(data.error_message_en) }
  if (data.is_required !== undefined) { updates.push('is_required = ?'); values.push(data.is_required ? 1 : 0) }
  if (data.min_selections !== undefined) { updates.push('min_selections = ?'); values.push(data.min_selections) }
  if (data.max_selections !== undefined) { updates.push('max_selections = ?'); values.push(data.max_selections) }
  if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order) }
  if (data.active !== undefined) { updates.push('active = ?'); values.push(data.active ? 1 : 0) }

  if (updates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Keine Felder zum Aktualisieren' })
  }

  updates.push('updated_at = datetime(\'now\')')
  values.push(id)

  try {
    const result = db.prepare(`
      UPDATE wizard_steps SET ${updates.join(', ')} WHERE id = ?
    `).run(...values)

    if (result.changes === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Schritt nicht gefunden' })
    }

    const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
    logAudit('wizard_step_updated', String(id), '', ipHash)

    return { ok: true }
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: 'Slug existiert bereits' })
    }
    throw err
  }
})
