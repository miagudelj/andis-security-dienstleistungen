import { useDB } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug fehlt' })

  const row = useDB().prepare(`
    SELECT id, slug, title_de, title_en, summary_de, summary_en, body_de, body_en, image_path, icon, sort_order
    FROM services
    WHERE slug = ? AND published = 1
  `).get(slug)

  if (!row) throw createError({ statusCode: 404, statusMessage: 'Dienstleistung nicht gefunden' })
  return row
})
