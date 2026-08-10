import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

const Body = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const parsed = Body.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Eingabe. Neues Passwort muss mindestens 8 Zeichen haben.' })
  }

  const { currentPassword, newPassword } = parsed.data

  // Get current password hash (DB first, then .env)
  const db = useDB()
  const settings = db.prepare('SELECT admin_password_hash FROM company_settings WHERE id = 1').get() as { admin_password_hash: string } | undefined
  const dbHash = settings?.admin_password_hash || ''

  const config = useRuntimeConfig()
  const currentHash = dbHash || config.adminPasswordHash

  if (!currentHash) {
    throw createError({ statusCode: 500, statusMessage: 'Kein Passwort konfiguriert' })
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, currentHash)
  if (!isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Aktuelles Passwort ist falsch' })
  }

  // Hash new password
  const newHash = await bcrypt.hash(newPassword, 12)

  // Save to database
  db.prepare('UPDATE company_settings SET admin_password_hash = ?, updated_at = datetime(\'now\') WHERE id = 1').run(newHash)

  const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
  logAudit('password_changed', '', '', ipHash)

  return { ok: true }
})
