import { z } from 'zod'
import { requireAdmin, hashIP, logAudit } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

const Body = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  position_de: z.string().min(1).max(200),
  position_en: z.string().max(200).default(''),
  slogan_de: z.string().max(500).default(''),
  slogan_en: z.string().max(500).default(''),
  image_path: z.string().max(500).default(''),
  sort_order: z.number().int().min(0).max(9999).optional(),
  active: z.union([z.boolean(), z.number()]).default(true),
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
    const maxSort = db.prepare('SELECT MAX(sort_order) as max FROM team_members').get() as { max: number | null }
    sortOrder = (maxSort?.max ?? 0) + 10
  }

  const active = d.active === true || d.active === 1 ? 1 : 0

  const result = db.prepare(`
    INSERT INTO team_members (first_name, last_name, position_de, position_en, slogan_de, slogan_en, image_path, sort_order, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(d.first_name, d.last_name, d.position_de, d.position_en, d.slogan_de, d.slogan_en, d.image_path, sortOrder, active)

  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  logAudit('team_member_created', String(result.lastInsertRowid), `${d.first_name} ${d.last_name}`, hashIP(ip))
  return { id: result.lastInsertRowid, ok: true }
})
