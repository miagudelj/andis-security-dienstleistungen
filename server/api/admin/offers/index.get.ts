import { requireAdmin } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  requireAdmin(event)
  const rows = useDB().prepare(`
    SELECT id, reference, devices_json, locations_json, first_name, last_name, email, phone, zip, city, message, status, created_at
    FROM offers
    ORDER BY created_at DESC
    LIMIT 500
  `).all() as any[]

  return rows.map(r => ({
    ...r,
    devices: JSON.parse(r.devices_json || '[]'),
    locations: JSON.parse(r.locations_json || '[]'),
  }))
})
