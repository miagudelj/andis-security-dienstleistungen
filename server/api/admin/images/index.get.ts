import { requireAdmin } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const db = useDB()
  const uploadsDir = join(process.cwd(), 'public', 'images', 'uploads')
  const servicesDir = join(process.cwd(), 'public', 'images', 'services')

  // Get all images from uploads folder
  const uploadFiles = await readdir(uploadsDir).catch(() => [])
  const serviceFiles = await readdir(servicesDir).catch(() => [])

  // Get used images from database
  const usedImages = db.prepare('SELECT image_path FROM services WHERE image_path IS NOT NULL').all() as { image_path: string }[]
  const usedPaths = new Set(usedImages.map(i => i.image_path))

  // Build image list with usage info
  const images: { path: string; filename: string; folder: string; used: boolean; size: number }[] = []

  for (const file of uploadFiles) {
    if (file === '.gitkeep') continue
    const filePath = `/images/uploads/${file}`
    const fullPath = join(uploadsDir, file)
    const stats = await stat(fullPath).catch(() => null)
    images.push({
      path: filePath,
      filename: file,
      folder: 'uploads',
      used: usedPaths.has(filePath),
      size: stats?.size || 0,
    })
  }

  for (const file of serviceFiles) {
    if (file === '.gitkeep') continue
    const filePath = `/images/services/${file}`
    const fullPath = join(servicesDir, file)
    const stats = await stat(fullPath).catch(() => null)
    images.push({
      path: filePath,
      filename: file,
      folder: 'services',
      used: usedPaths.has(filePath),
      size: stats?.size || 0,
    })
  }

  return images
})
