import { useDB } from '~~/server/utils/db'
import { requireAdmin } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const db = useDB()

  const steps = db.prepare(`
    SELECT * FROM wizard_steps ORDER BY sort_order ASC, id ASC
  `).all() as any[]

  const optionsStmt = db.prepare(`
    SELECT * FROM wizard_options WHERE step_id = ? ORDER BY sort_order ASC, id ASC
  `)

  const fieldsStmt = db.prepare(`
    SELECT * FROM wizard_contact_fields WHERE step_id = ? ORDER BY sort_order ASC, id ASC
  `)

  return steps.map((step) => ({
    ...step,
    is_required: Boolean(step.is_required),
    active: Boolean(step.active),
    options: optionsStmt.all(step.id).map((o: any) => ({ ...o, active: Boolean(o.active) })),
    contact_fields: fieldsStmt.all(step.id).map((f: any) => ({ ...f, is_required: Boolean(f.is_required) })),
  }))
})
