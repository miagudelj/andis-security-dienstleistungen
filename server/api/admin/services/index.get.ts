import { requireAdmin } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  requireAdmin(event)
  return useDB().prepare(`SELECT * FROM services ORDER BY sort_order ASC, id ASC`).all()
})
