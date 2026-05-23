import { requireAdmin, logAudit, hashIP } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { z } from 'zod'

const paramsSchema = z.object({
  filename: z.string().min(1),
})

const bodySchema = z.object({
  folder: z.enum(['uploads', 'services']),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const params = paramsSchema.parse(getRouterParams(event))
  const body = bodySchema.parse(await readBody(event))

  const db = useDB()
  const imagePath = `/images/${body.folder}/${params.filename}`

  // Check if image is in use
  const inUse = db.prepare('SELECT id FROM services WHERE image_path = ?').get(imagePath)
  if (inUse) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bild wird noch verwendet und kann nicht gelöscht werden.',
    })
  }

  // Delete the file
  const fullPath = join(process.cwd(), 'public', 'images', body.folder, params.filename)

  try {
    await unlink(fullPath)
  } catch (err: any) {
    if (err.code === 'ENOENT') {
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

  // Log the action
  logAudit(db, {
    action: 'image_deleted',
    entity_type: 'image',
    entity_id: params.filename,
    details: JSON.stringify({ path: imagePath, folder: body.folder }),
    ip_hash: hashIP(getRequestIP(event, { xForwardedFor: true }) || ''),
  })

  return { success: true, deleted: imagePath }
})
