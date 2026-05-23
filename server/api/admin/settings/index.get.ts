import { useDB } from '~~/server/utils/db'
import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = useDB()
  const settings = db.prepare(`
    SELECT company_name, street, zip, city, canton, country, phone, email, website, uid_number, owner_name, updated_at
    FROM company_settings WHERE id = 1
  `).get()

  return settings || {
    company_name: 'PreSecurity',
    street: '',
    zip: '',
    city: '',
    canton: 'Zürich',
    country: 'Schweiz',
    phone: '',
    email: '',
    website: '',
    uid_number: '',
    owner_name: '',
    updated_at: null,
  }
})
