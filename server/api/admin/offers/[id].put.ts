import { z } from 'zod'
import { requireAdmin, logAudit } from '~~/server/utils/auth'
import { useDB } from '~~/server/utils/db'

// Extended status options for offers
// new = Neu eingegangen
// in_progress = In Bearbeitung
// open_questions = Offene Fragen
// visit_scheduled = Besuch geplant
// quote_sent = Offerte versendet
// accepted = Zustande gekommen
// rejected = Vom Kunden abgelehnt
// cancelled = Abgebrochen
const bodySchema = z.object({
  status: z.enum(['new', 'in_progress', 'open_questions', 'visit_scheduled', 'quote_sent', 'accepted', 'rejected', 'cancelled']).optional(),
  assigned_to: z.string().max(100).optional(),
  notes: z.string().max(5000).nullable().optional(),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige ID' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Daten' })
  }

  const db = useDB()
  const existing = db.prepare('SELECT id, reference FROM offers WHERE id = ?').get(id) as { id: number; reference: string } | undefined
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Offerte nicht gefunden' })
  }

  const updates: string[] = []
  const values: any[] = []

  if (parsed.data.status !== undefined) {
    updates.push('status = ?')
    values.push(parsed.data.status)

    // Set completed_at for final states, clear for non-final states
    const finalStates = ['accepted', 'rejected', 'cancelled']
    if (finalStates.includes(parsed.data.status)) {
      updates.push("completed_at = COALESCE(completed_at, datetime('now'))")
    } else {
      updates.push('completed_at = NULL')
    }
  }

  if (parsed.data.assigned_to !== undefined) {
    updates.push('assigned_to = ?')
    values.push(parsed.data.assigned_to)
  }

  if (parsed.data.notes !== undefined) {
    updates.push('notes = ?')
    values.push(parsed.data.notes)
  }

  if (updates.length === 0) {
    return { ok: true }
  }

  values.push(id)
  db.prepare(`UPDATE offers SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  logAudit('offer.update', existing.reference, JSON.stringify(parsed.data))

  return { ok: true }
})
