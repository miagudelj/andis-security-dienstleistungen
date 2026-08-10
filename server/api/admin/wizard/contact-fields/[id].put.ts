import { z } from 'zod'
import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

const Body = z.object({
  field_name: z.string().regex(/^[a-z_]+$/).max(50).optional(),
  field_type: z.enum(['text', 'email', 'tel', 'textarea', 'checkbox']).optional(),
  label_de: z.string().min(1).max(200).optional(),
  label_en: z.string().max(200).optional(),
  placeholder_de: z.string().max(200).optional(),
  placeholder_en: z.string().max(200).optional(),
  is_required: z.union([z.boolean(), z.number()]).optional(),
  autocomplete: z.string().max(100).optional(),
  validation_regex: z.string().max(200).optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
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

  if (d.field_name !== undefined) { updates.push('field_name = ?'); values.push(d.field_name) }
  if (d.field_type !== undefined) { updates.push('field_type = ?'); values.push(d.field_type) }
  if (d.label_de !== undefined) { updates.push('label_de = ?'); values.push(d.label_de) }
  if (d.label_en !== undefined) { updates.push('label_en = ?'); values.push(d.label_en) }
  if (d.placeholder_de !== undefined) { updates.push('placeholder_de = ?'); values.push(d.placeholder_de) }
  if (d.placeholder_en !== undefined) { updates.push('placeholder_en = ?'); values.push(d.placeholder_en) }
  if (d.is_required !== undefined) {
    const req = d.is_required === true || d.is_required === 1 ? 1 : 0
    updates.push('is_required = ?')
    values.push(req)
  }
  if (d.autocomplete !== undefined) { updates.push('autocomplete = ?'); values.push(d.autocomplete) }
  if (d.validation_regex !== undefined) { updates.push('validation_regex = ?'); values.push(d.validation_regex) }
  if (d.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(d.sort_order) }

  if (updates.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Keine Felder zum Aktualisieren' })
  }

  values.push(id)

  try {
    const result = db.prepare(`UPDATE wizard_contact_fields SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    if (result.changes === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Feld nicht gefunden' })
    }

    const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
    logAudit('wizard_contact_field_updated', d.field_name || String(id), '', ipHash)

    return { ok: true }
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: 'Feldname existiert bereits für diesen Schritt' })
    }
    throw err
  }
})
