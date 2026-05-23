import { requireAdmin } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

export default defineEventHandler((event) => {
  requireAdmin(event)
  const rows = useDB().prepare(`
    SELECT id, reference, devices_json, locations_json, steps_data_json,
           first_name, last_name, email, phone, zip, city, message,
           status, assigned_to, notes, completed_at, created_at
    FROM offers
    ORDER BY created_at DESC
    LIMIT 500
  `).all() as any[]

  return rows.map(r => ({
    ...r,
    devices: JSON.parse(r.devices_json || '[]'),
    locations: JSON.parse(r.locations_json || '[]'),
    steps_data_json: r.steps_data_json || null,
    assigned_to: r.assigned_to || '',
    notes: r.notes ?? null,
    completed_at: r.completed_at || null,
  }))
})
