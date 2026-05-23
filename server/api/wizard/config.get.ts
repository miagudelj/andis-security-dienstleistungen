import { useDB } from '~~/server/utils/db'

interface WizardOption {
  slug: string
  label_de: string
  label_en: string
  description_de: string
  description_en: string
  icon: string
}

interface WizardContactField {
  field_name: string
  field_type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox'
  label_de: string
  label_en: string
  placeholder_de: string
  placeholder_en: string
  is_required: boolean
  validation_regex: string
}

interface WizardStep {
  slug: string
  step_type: 'multi_select' | 'single_select' | 'quantity_input' | 'contact_form' | 'free_text'
  title_de: string
  title_en: string
  subtitle_de: string
  subtitle_en: string
  error_message_de: string
  error_message_en: string
  is_required: boolean
  min_selections: number
  max_selections: number
  options?: WizardOption[]
  contact_fields?: WizardContactField[]
}

export default defineEventHandler(async () => {
  const db = useDB()

  // Load active steps
  const steps = db.prepare(`
    SELECT slug, step_type, title_de, title_en, subtitle_de, subtitle_en,
           error_message_de, error_message_en, is_required, min_selections, max_selections, id
    FROM wizard_steps
    WHERE active = 1
    ORDER BY sort_order ASC, id ASC
  `).all() as (WizardStep & { id: number })[]

  // Load options for each step
  const optionsStmt = db.prepare(`
    SELECT slug, label_de, label_en, description_de, description_en, icon
    FROM wizard_options
    WHERE step_id = ? AND active = 1
    ORDER BY sort_order ASC, id ASC
  `)

  // Load contact fields for each step
  const fieldsStmt = db.prepare(`
    SELECT field_name, field_type, label_de, label_en, placeholder_de, placeholder_en, is_required, validation_regex
    FROM wizard_contact_fields
    WHERE step_id = ?
    ORDER BY sort_order ASC, id ASC
  `)

  const result: WizardStep[] = steps.map((step) => {
    const { id, ...stepData } = step

    // Convert integer booleans to actual booleans
    const cleanStep: WizardStep = {
      ...stepData,
      is_required: Boolean(step.is_required),
    }

    if (step.step_type === 'multi_select' || step.step_type === 'single_select') {
      cleanStep.options = optionsStmt.all(id) as WizardOption[]
    }

    if (step.step_type === 'contact_form') {
      const fields = fieldsStmt.all(id) as (WizardContactField & { is_required: number })[]
      cleanStep.contact_fields = fields.map((f) => ({
        ...f,
        is_required: Boolean(f.is_required),
      }))
    }

    return cleanStep
  })

  return { steps: result }
})
