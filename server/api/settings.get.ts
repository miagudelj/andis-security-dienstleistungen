import { useDB } from '~~/server/utils/db'

export default defineEventHandler(() => {
  const db = useDB()
  const settings = db.prepare(`
    SELECT company_name, street, zip, city, canton, country, phone, email, website, uid_number, owner_name
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
  }
})
