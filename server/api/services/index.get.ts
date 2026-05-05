import { useDB } from '~~/server/utils/db'

// Public: nur publizierte Services
export default defineEventHandler(() => {
  const rows = useDB().prepare(`
    SELECT id, slug, title_de, title_en, summary_de, summary_en, body_de, body_en, image_path, icon, sort_order
    FROM services
    WHERE published = 1
    ORDER BY sort_order ASC, id ASC
  `).all()
  return rows
})
