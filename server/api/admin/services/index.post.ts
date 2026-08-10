import { z } from 'zod'
import { requireAdmin, hashIP, logAudit } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

const Body = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestrich').max(100),
  title_de: z.string().min(1).max(200),
  title_en: z.string().max(200).default(''),
  summary_de: z.string().max(500).default(''),
  summary_en: z.string().max(500).default(''),
  body_de: z.string().max(10_000).default(''),
  body_en: z.string().max(10_000).default(''),
  image_path: z.string().max(500).default(''),
  icon: z.string().max(50).default(''),
  sort_order: z.number().int().min(0).max(9999).optional(),
  published: z.union([z.boolean(), z.number()]).default(true),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validierung fehlgeschlagen', data: parsed.error.flatten() })
  }
  const d = parsed.data

  const db = useDB()

  // Auto-calculate sort_order if not provided
  let sortOrder = d.sort_order
  if (sortOrder === undefined) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as max FROM services').get() as { max: number | null }
    sortOrder = (maxSort?.max ?? 0) + 10
  }

  const published = d.published === true || d.published === 1 ? 1 : 0

  try {
    const result = db.prepare(`
      INSERT INTO services (slug, title_de, title_en, summary_de, summary_en, body_de, body_en, image_path, icon, sort_order, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(d.slug, d.title_de, d.title_en, d.summary_de, d.summary_en, d.body_de, d.body_en, d.image_path, d.icon, sortOrder, published)

    const ip = getRequestIP(event, { xForwardedFor: true }) || ''
    logAudit('service_created', String(result.lastInsertRowid), d.slug, hashIP(ip))
    return { id: result.lastInsertRowid, ok: true }
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw createError({ statusCode: 409, statusMessage: 'Slug bereits vergeben' })
    }
    throw e
  }
})
