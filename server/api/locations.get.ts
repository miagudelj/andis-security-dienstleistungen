import { useDB } from '~~/server/utils/db'

export default defineEventHandler(() => {
  return useDB().prepare(`
    SELECT slug, label_de, label_en FROM locations WHERE active = 1 ORDER BY sort_order ASC
  `).all()
})
