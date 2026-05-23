import { useDB } from '~~/server/utils/db'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'
import { z } from 'zod'

const settingsSchema = z.object({
  company_name: z.string().min(1, 'Firmenname erforderlich'),
  street: z.string().default(''),
  zip: z.string().default(''),
  city: z.string().default(''),
  canton: z.string().default('Zürich'),
  country: z.string().default('Schweiz'),
  phone: z.string().default(''),
  email: z.string().email('Ungültige E-Mail').or(z.literal('')).default(''),
  website: z.string().default(''),
  uid_number: z.string().default(''),
  owner_name: z.string().default(''),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = settingsSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.errors[0].message })
  }

  const data = parsed.data
  const db = useDB()

  db.prepare(`
    UPDATE company_settings SET
      company_name = ?,
      street = ?,
      zip = ?,
      city = ?,
      canton = ?,
      country = ?,
      phone = ?,
      email = ?,
      website = ?,
      uid_number = ?,
      owner_name = ?,
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    data.company_name,
    data.street,
    data.zip,
    data.city,
    data.canton,
    data.country,
    data.phone,
    data.email,
    data.website,
    data.uid_number,
    data.owner_name
  )

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  logAudit(db, 'settings_update', 'company_settings', '', hashIP(ip))

  return { success: true }
})
