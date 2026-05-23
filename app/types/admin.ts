// =====================================================
// Admin Types - Shared across admin components
// =====================================================

export interface Offer {
  id: number
  reference: string
  devices: { slug: string; quantity: number }[]
  locations: string[]
  steps_data_json?: string
  first_name: string
  last_name: string
  email: string
  phone: string
  zip: string
  city: string
  message: string
  status: string
  assigned_to: string
  notes: string | null
  completed_at: string | null
  created_at: string
}

export interface Service {
  id: number
  slug: string
  title_de: string
  title_en: string
  summary_de: string
  summary_en: string
  body_de: string
  body_en: string
  icon: string
  image_path: string
  sort_order: number
  published: number
}

export interface WizardOption {
  id: number
  step_id: number
  slug: string
  label_de: string
  label_en: string
  description_de: string
  description_en: string
  icon: string
  sort_order: number
  active: boolean
}

export interface WizardContactField {
  id: number
  step_id: number
  field_name: string
  field_type: string
  label_de: string
  label_en: string
  placeholder_de: string
  placeholder_en: string
  is_required: boolean
  autocomplete: string
  validation_regex: string
  sort_order: number
}

export interface WizardStep {
  id: number
  slug: string
  step_type: string
  title_de: string
  title_en: string
  subtitle_de: string
  subtitle_en: string
  error_message_de: string
  error_message_en: string
  is_required: boolean
  min_selections: number
  max_selections: number
  sort_order: number
  active: boolean
  options?: WizardOption[]
  contact_fields?: WizardContactField[]
}

export interface CompanySettings {
  company_name: string
  street: string
  zip: string
  city: string
  canton: string
  country: string
  phone: string
  email: string
  website: string
  uid_number: string
  owner_name: string
  updated_at: string | null
}

// Status options for offers
export const OFFER_STATUS_OPTIONS = [
  { value: 'new', label: 'Neu eingegangen', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'In Bearbeitung', color: 'bg-amber-100 text-amber-700' },
  { value: 'open_questions', label: 'Offene Fragen', color: 'bg-purple-100 text-purple-700' },
  { value: 'visit_scheduled', label: 'Besuch geplant', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'quote_sent', label: 'Offerte versendet', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'accepted', label: 'Zustande gekommen', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'rejected', label: 'Vom Kunden abgelehnt', color: 'bg-red-100 text-red-700' },
  { value: 'cancelled', label: 'Abgebrochen', color: 'bg-ink-200 text-ink-600' },
] as const

// Date range options for filtering
export const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Heute' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'month', label: 'Dieser Monat' },
  { value: 'quarter', label: 'Dieses Quartal' },
  { value: 'year', label: 'Dieses Jahr' },
  { value: 'all', label: 'Alle' },
] as const

// Wizard step types
export const STEP_TYPES = [
  { value: 'multi_select', label: 'Mehrfachauswahl' },
  { value: 'single_select', label: 'Einfachauswahl' },
  { value: 'quantity_input', label: 'Mengen-Eingabe' },
  { value: 'contact_form', label: 'Kontaktformular' },
  { value: 'free_text', label: 'Freitext' },
] as const

// Helper functions
export function getStatusOption(status: string) {
  return OFFER_STATUS_OPTIONS.find(s => s.value === status) || OFFER_STATUS_OPTIONS[0]
}

export function getDateRangeStart(range: string): Date | null {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  switch (range) {
    case 'today':
      return now
    case 'week':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
      return weekStart
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3
      return new Date(now.getFullYear(), quarterMonth, 1)
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
    case 'all':
    default:
      return null
  }
}

// Parse steps_data_json helper
export function parseStepsData(offer: Offer): Record<string, any> | null {
  if (!offer.steps_data_json) return null
  try {
    return JSON.parse(offer.steps_data_json)
  } catch {
    return null
  }
}
