import { z } from 'zod'
import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

const Body = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(100),
  step_type: z.enum(['multi_select', 'single_select', 'quantity_input', 'contact_form', 'free_text']),
  title_de: z.string().min(1).max(200),
  title_en: z.string().max(200).default(''),
  subtitle_de: z.string().max(500).default(''),
  subtitle_en: z.string().max(500).default(''),
  error_message_de: z.string().max(200).default(''),
  error_message_en: z.string().max(200).default(''),
  is_required: z.union([z.boolean(), z.number()]).default(true),
  min_selections: z.number().int().min(0).max(99).default(0),
  max_selections: z.number().int().min(1).max(99).default(99),
  sort_order: z.number().int().min(0).max(9999).optional(),
  active: z.union([z.boolean(), z.number()]).default(true),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Eingabe', data: parsed.error.flatten() })
  }

  const db = useDB()
  const data = parsed.data

  // Auto-calculate sort_order if not provided
  let sortOrder = data.sort_order
  if (sortOrder === undefined) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as max FROM wizard_steps').get() as { max: number | null }
    sortOrder = (maxSort?.max ?? 0) + 10
  }

  try {
    const result = db.prepare(`
      INSERT INTO wizard_steps (slug, step_type, title_de, title_en, subtitle_de, subtitle_en, error_message_de, error_message_en, is_required, min_selections, max_selections, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.slug, data.step_type, data.title_de, data.title_en, data.subtitle_de, data.subtitle_en,
      data.error_message_de, data.error_message_en, data.is_required ? 1 : 0, data.min_selections, data.max_selections,
      sortOrder, data.active ? 1 : 0
    )

    const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
    logAudit('wizard_step_created', data.slug, '', ipHash)

    return { id: result.lastInsertRowid, ok: true }
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: 'Slug existiert bereits' })
    }
    throw err
  }
})
