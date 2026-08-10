import { requireAdmin } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  requireAdmin(event)

  const result = useDB().prepare(`
    SELECT id, created_at FROM offers ORDER BY id DESC LIMIT 1
  `).get() as { id: number; created_at: string } | undefined

  return {
    latestId: result?.id ?? 0,
    latestAt: result?.created_at ?? null,
  }
})
