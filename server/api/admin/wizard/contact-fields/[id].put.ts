import { z } from 'zod'
import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

const Body = z.object({
  field_name: z.string().regex(/^[a-z_]+$/).max(50),
  field_type: z.enum(['text', 'email', 'tel', 'textarea', 'checkbox']),
  label_de: z.string().min(1).max(200),
  label_en: z.string().min(1).max(200),
  placeholder_de: z.string().max(200).default(''),
  placeholder_en: z.string().max(200).default(''),
  is_required: z.boolean().default(true),
  autocomplete: z.string().max(100).default(''),
  validation_regex: z.string().max(200).default(''),
  sort_order: z.number().int().min(0).max(9999).default(0),
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
      UPDATE wizard_contact_fields SET
        field_name = ?, field_type = ?, label_de = ?, label_en = ?,
        placeholder_de = ?, placeholder_en = ?, is_required = ?, autocomplete = ?, validation_regex = ?, sort_order = ?
      WHERE id = ?
    `).run(
      data.field_name, data.field_type, data.label_de, data.label_en,
      data.placeholder_de, data.placeholder_en, data.is_required ? 1 : 0, data.autocomplete, data.validation_regex, data.sort_order, id
    )

    if (result.changes === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Feld nicht gefunden' })
    }

    const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
    logAudit('wizard_contact_field_updated', data.field_name, '', ipHash)

    return { ok: true }
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: 'Feldname existiert bereits für diesen Schritt' })
    }
    throw err
  }
})
