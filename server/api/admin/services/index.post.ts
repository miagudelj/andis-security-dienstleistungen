import { z } from 'zod'
import { requireAdmin, hashIP, logAudit } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

const Body = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestrich').max(100),
  title_de: z.string().min(1).max(200),
  title_en: z.string().min(1).max(200),
  summary_de: z.string().min(1).max(500),
  summary_en: z.string().min(1).max(500),
  body_de: z.string().max(10_000).default(''),
  body_en: z.string().max(10_000).default(''),
  image_path: z.string().max(500).default(''),
  icon: z.string().max(50).default(''),
  sort_order: z.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validierung fehlgeschlagen', data: parsed.error.flatten() })
  }
  const d = parsed.data

  try {
    const result = useDB().prepare(`
      INSERT INTO services (slug, title_de, title_en, summary_de, summary_en, body_de, body_en, image_path, icon, sort_order, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(d.slug, d.title_de, d.title_en, d.summary_de, d.summary_en, d.body_de, d.body_en, d.image_path, d.icon, d.sort_order, d.published ? 1 : 0)

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
