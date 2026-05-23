import { defineStore } from 'pinia'

// Types for wizard configuration
export interface WizardOption {
  slug: string
  label_de: string
  label_en: string
  description_de: string
  description_en: string
  icon: string
}

export interface WizardContactField {
  field_name: string
  field_type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox'
  label_de: string
  label_en: string
  placeholder_de: string
  placeholder_en: string
  is_required: boolean
  validation_regex: string
}

export interface WizardStep {
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

export interface WizardConfig {
  steps: WizardStep[]
}

// Response types for each step
export interface SelectionItem {
  slug: string
  quantity?: number
}

export interface StepResponse {
  selections?: SelectionItem[]
  value?: string
  contact?: Record<string, string | boolean>
}

export const useOfferStore = defineStore('offer', {
  state: () => ({
    open: false,
    currentStepIndex: 0,
    config: null as WizardConfig | null,
    configLoading: false,
    responses: {} as Record<string, StepResponse>,
    submitting: false,
    success: false,
    reference: '' as string,
    errorMessage: '' as string,
    fieldErrors: {} as Record<string, string>, // Field-specific error messages
    honeypot: '', // Hidden field for bot detection
  }),

  getters: {
    totalSteps: (state) => state.config?.steps.length ?? 0,
    currentStep: (state) => state.config?.steps[state.currentStepIndex] ?? null,
    isFirstStep: (state) => state.currentStepIndex === 0,
    isLastStep(): boolean {
      return this.currentStepIndex === this.totalSteps - 1
    },
    currentResponse: (state) => {
      const step = state.config?.steps[state.currentStepIndex]
      if (!step) return null
      return state.responses[step.slug] ?? null
    },
  },

  actions: {
    async loadConfig() {
      if (this.config || this.configLoading) return
      this.configLoading = true
      try {
        const data = await $fetch<WizardConfig>('/api/wizard/config')
        this.config = data
      } finally {
        this.configLoading = false
      }
    },

    async openOverlay(prefilledStepSlug?: string, prefilledValue?: string) {
      await this.loadConfig()
      this.reset()

      // Handle prefilled value
      if (prefilledStepSlug && prefilledValue && this.config) {
        const stepIndex = this.config.steps.findIndex(s => s.slug === prefilledStepSlug)
        if (stepIndex >= 0) {
          this.responses[prefilledStepSlug] = {
            selections: [{ slug: prefilledValue, quantity: 1 }],
          }
          // Skip to next step if there is one
          if (stepIndex < this.config.steps.length - 1) {
            this.currentStepIndex = stepIndex + 1
          }
        }
      }

      this.open = true
      if (import.meta.client) document.body.style.overflow = 'hidden'
    },

    closeOverlay() {
      this.open = false
      if (import.meta.client) document.body.style.overflow = ''
    },

    reset() {
      this.currentStepIndex = 0
      this.success = false
      this.reference = ''
      this.errorMessage = ''
      this.fieldErrors = {}
      this.submitting = false
      this.responses = {}
      this.honeypot = ''
    },

    // Response management
    setResponse(stepSlug: string, response: StepResponse) {
      this.responses[stepSlug] = response
    },

    getResponse(stepSlug: string): StepResponse {
      return this.responses[stepSlug] ?? {}
    },

    // Selection helpers for multi/single select steps
    toggleSelection(slug: string) {
      const step = this.currentStep
      if (!step) return

      const response = this.responses[step.slug] ?? { selections: [] }
      const selections = response.selections ?? []
      const idx = selections.findIndex(s => s.slug === slug)

      if (idx >= 0) {
        selections.splice(idx, 1)
      } else {
        if (step.step_type === 'single_select') {
          // Single select: replace existing
          response.selections = [{ slug, quantity: 1 }]
        } else {
          // Multi select: add to list
          selections.push({ slug, quantity: 1 })
          response.selections = selections
        }
      }

      this.responses[step.slug] = response
    },

    isSelected(slug: string): boolean {
      const step = this.currentStep
      if (!step) return false
      const response = this.responses[step.slug]
      return response?.selections?.some(s => s.slug === slug) ?? false
    },

    setQuantity(slug: string, quantity: number) {
      const step = this.currentStep
      if (!step) return

      const response = this.responses[step.slug] ?? { selections: [] }
      const selection = response.selections?.find(s => s.slug === slug)
      if (selection) {
        selection.quantity = Math.max(1, Math.min(99, quantity))
        this.responses[step.slug] = response
      }
    },

    // Contact form helpers
    setContactField(fieldName: string, value: string | boolean) {
      const step = this.currentStep
      if (!step || step.step_type !== 'contact_form') return

      const response = this.responses[step.slug] ?? { contact: {} }
      if (!response.contact) response.contact = {}
      response.contact[fieldName] = value
      this.responses[step.slug] = response
    },

    getContactField(fieldName: string): string | boolean {
      const step = this.currentStep
      if (!step) return ''
      const response = this.responses[step.slug]
      return response?.contact?.[fieldName] ?? (fieldName === 'consent' ? false : '')
    },

    // Free text helper
    setFreeText(value: string) {
      const step = this.currentStep
      if (!step || step.step_type !== 'free_text') return

      this.responses[step.slug] = { value }
    },

    getFreeText(): string {
      const step = this.currentStep
      if (!step) return ''
      return this.responses[step.slug]?.value ?? ''
    },

    // Clear field error when user types
    clearFieldError(fieldName: string) {
      delete this.fieldErrors[fieldName]
    },

    // Validation
    validateCurrentStep(locale: string = 'de'): string | null {
      const step = this.currentStep
      if (!step) return null

      const response = this.responses[step.slug]
      this.fieldErrors = {} // Clear previous errors
      let hasErrors = false

      if (step.step_type === 'multi_select' || step.step_type === 'single_select') {
        const selections = response?.selections ?? []
        if (step.is_required && selections.length < step.min_selections) {
          return locale === 'en' ? step.error_message_en : step.error_message_de
        }
      }

      if (step.step_type === 'contact_form' && step.contact_fields) {
        for (const field of step.contact_fields) {
          const value = response?.contact?.[field.field_name]
          const fieldLabel = locale === 'en' ? field.label_en : field.label_de

          if (field.is_required) {
            if (field.field_type === 'checkbox') {
              if (value !== true) {
                this.fieldErrors[field.field_name] = locale === 'en'
                  ? 'This field is required'
                  : 'Dieses Feld ist erforderlich'
                hasErrors = true
              }
            } else {
              if (!value || (typeof value === 'string' && value.trim() === '')) {
                this.fieldErrors[field.field_name] = locale === 'en'
                  ? `${fieldLabel} is required`
                  : `${fieldLabel} ist erforderlich`
                hasErrors = true
                continue // Skip format validation if empty
              }
            }
          }

          // Email validation
          if (field.field_type === 'email' && typeof value === 'string' && value.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              this.fieldErrors[field.field_name] = locale === 'en'
                ? 'Please enter a valid email address'
                : 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
              hasErrors = true
            }
          }

          // Phone validation
          if (field.field_type === 'tel' && typeof value === 'string' && value.trim() !== '') {
            const phoneRegex = /^[+]?[\d\s\-().]+$/
            if (!phoneRegex.test(value) || value.length < 5) {
              this.fieldErrors[field.field_name] = locale === 'en'
                ? 'Please enter a valid phone number'
                : 'Bitte geben Sie eine gültige Telefonnummer ein'
              hasErrors = true
            }
          }
        }

        if (hasErrors) {
          const errorCount = Object.keys(this.fieldErrors).length
          return locale === 'en'
            ? `Please correct ${errorCount} field(s) marked in red`
            : `Bitte korrigieren Sie ${errorCount} rot markierte(s) Feld(er)`
        }
      }

      if (step.step_type === 'free_text' && step.is_required) {
        const value = response?.value ?? ''
        if (value.trim() === '') {
          return locale === 'en' ? step.error_message_en : step.error_message_de
        }
      }

      return null
    },

    canProceed(locale: string = 'de'): boolean {
      return this.validateCurrentStep(locale) === null
    },

    // Navigation
    next() {
      if (this.currentStepIndex < this.totalSteps - 1) {
        this.currentStepIndex++
      }
    },

    back() {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--
      }
    },

    // Get selections from a previous step (for quantity_input step)
    getPreviousSelections(): SelectionItem[] {
      if (!this.config) return []

      // Find the most recent multi_select step before current
      for (let i = this.currentStepIndex - 1; i >= 0; i--) {
        const step = this.config.steps[i]
        if (step.step_type === 'multi_select' || step.step_type === 'single_select') {
          return this.responses[step.slug]?.selections ?? []
        }
      }
      return []
    },

    // Get option label by slug from a step
    getOptionLabel(stepSlug: string, optionSlug: string, locale: string = 'de'): string {
      const step = this.config?.steps.find(s => s.slug === stepSlug)
      const option = step?.options?.find(o => o.slug === optionSlug)
      if (!option) return optionSlug
      return locale === 'en' ? option.label_en : option.label_de
    },

    // Submit
    async submit(locale: string = 'de') {
      this.submitting = true
      this.errorMessage = ''

      try {
        // Build submission data
        const stepsData: Record<string, any> = {}

        for (const step of this.config?.steps ?? []) {
          const response = this.responses[step.slug]
          if (response) {
            stepsData[step.slug] = {
              type: step.step_type,
              ...response,
            }
          }
        }

        const res = await $fetch<{ ok: boolean; reference: string }>('/api/offers', {
          method: 'POST',
          body: {
            steps: stepsData,
            locale: locale === 'en' ? 'en' : 'de',
            website: this.honeypot, // honeypot
          },
        })

        this.reference = res.reference
        this.success = true
      } catch (e: any) {
        console.error('[Offer Submit Error]', e)
        console.error('[Offer Submit Error] Data:', e?.data)
        this.errorMessage = e?.data?.statusMessage || e?.statusMessage || (locale === 'en' ? 'Something went wrong.' : 'Etwas ist schiefgelaufen.')
      } finally {
        this.submitting = false
      }
    },
  },
})
