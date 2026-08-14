import { z } from 'zod'
import { requireAdmin, hashIP, logAudit } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

const Body = z.object({
  memberIds: z.array(z.number().int().positive()),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Validierung fehlgeschlagen', data: parsed.error.flatten() })
  }

  const { memberIds } = parsed.data
  const db = useDB()

  const updateStmt = db.prepare('UPDATE team_members SET sort_order = ? WHERE id = ?')
  const tx = db.transaction(() => {
    memberIds.forEach((id, index) => {
      updateStmt.run((index + 1) * 10, id)
    })
  })
  tx()

  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  logAudit('team_members_reordered', '', memberIds.join(','), hashIP(ip))
  return { ok: true }
})
