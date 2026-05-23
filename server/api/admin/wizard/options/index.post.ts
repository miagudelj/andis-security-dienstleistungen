import { z } from 'zod'
import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

const Body = z.object({
  step_id: z.number().int().positive(),
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

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Eingabe', data: parsed.error.flatten() })
  }

  const db = useDB()
  const data = parsed.data

  // Check if step exists
  const step = db.prepare('SELECT id FROM wizard_steps WHERE id = ?').get(data.step_id)
  if (!step) {
    throw createError({ statusCode: 404, statusMessage: 'Schritt nicht gefunden' })
  }

  try {
    const result = db.prepare(`
      INSERT INTO wizard_options (step_id, slug, label_de, label_en, description_de, description_en, icon, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.step_id, data.slug, data.label_de, data.label_en, data.description_de, data.description_en,
      data.icon, data.sort_order, data.active ? 1 : 0
    )

    const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
    logAudit('wizard_option_created', data.slug, `step_id=${data.step_id}`, ipHash)

    return { id: result.lastInsertRowid, ok: true }
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: 'Slug existiert bereits für diesen Schritt' })
    }
    throw err
  }
})
