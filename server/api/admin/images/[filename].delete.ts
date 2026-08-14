import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'
import { unlink } from 'fs/promises'
import { join, basename } from 'path'
import { z } from 'zod'

const paramsSchema = z.object({
  filename: z.string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Ungültiger Dateiname'),
})

const bodySchema = z.object({
  folder: z.enum(['uploads', 'services']),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const params = paramsSchema.parse(getRouterParams(event))
  const body = bodySchema.parse(await readBody(event))

  const safeFilename = basename(params.filename)
  if (safeFilename !== params.filename || safeFilename.includes('..')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ungültiger Dateiname.',
    })
  }

  const db = useDB()
  const imagePath = `/images/${body.folder}/${safeFilename}`
  const fullPath = join(process.cwd(), 'public', 'images', body.folder, safeFilename)

  // Delete the file
  try {
    await unlink(fullPath)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bild nicht gefunden.',
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Fehler beim Löschen des Bildes.',
    })
  }

  // Remove references from database
  db.prepare("UPDATE services SET image_path = '' WHERE image_path = ?").run(imagePath)
  db.prepare("UPDATE team_members SET image_path = '' WHERE image_path = ?").run(imagePath)

  const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
  logAudit('image_deleted', safeFilename, `folder=${body.folder}`, ipHash)

  return { success: true, deleted: imagePath }
})
