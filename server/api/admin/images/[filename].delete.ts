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

  const inUse = db.prepare('SELECT id FROM services WHERE image_path = ?').get(imagePath)
  if (inUse) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bild wird noch verwendet und kann nicht gelöscht werden.',
    })
  }

  const fullPath = join(process.cwd(), 'public', 'images', body.folder, safeFilename)

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

  const ipHash = hashIP(getRequestIP(event, { xForwardedFor: true }) || '')
  logAudit('image_deleted', safeFilename, `folder=${body.folder}`, ipHash)

  return { success: true, deleted: imagePath }
})
