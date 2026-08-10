import { z } from 'zod'
import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'

const Body = z.object({
  stepIds: z.array(z.number().int().positive()),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Eingabe' })
  }

  const db = useDB()
  const { stepIds } = parsed.data

  const updateStmt = db.prepare('UPDATE wizard_steps SET sort_order = ? WHERE id = ?')

  const tx = db.transaction(() => {
    stepIds.forEach((id, index) => {
      updateStmt.run((index + 1) * 10, id)
    })
  })

  tx()

  const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
  logAudit('wizard_steps_reordered', stepIds.join(','), '', ipHash)

  return { ok: true }
})
