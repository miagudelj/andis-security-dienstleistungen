import { defineStore } from 'pinia'

export interface DeviceSelection {
  slug: string
  quantity: number
}

interface OfferForm {
  devices: DeviceSelection[]
  locations: string[]
  first_name: string
  last_name: string
  email: string
  phone: string
  zip: string
  city: string
  message: string
  consent: boolean
  website: string // honeypot
}

const emptyForm = (): OfferForm => ({
  devices: [],
  locations: [],
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  zip: '',
  city: '',
  message: '',
  consent: false,
  website: '',
})

export const useOfferStore = defineStore('offer', {
  state: () => ({
    open: false,
    step: 1 as 1 | 2 | 3 | 4,
    submitting: false,
    success: false,
    reference: '' as string,
    errorMessage: '' as string,
    form: emptyForm(),
  }),
  actions: {
    openOverlay(prefilledDeviceSlug?: string) {
      this.reset()
      if (prefilledDeviceSlug) {
        this.form.devices = [{ slug: prefilledDeviceSlug, quantity: 1 }]
        this.step = 2
      }
      this.open = true
      if (import.meta.client) document.body.style.overflow = 'hidden'
    },
    closeOverlay() {
      this.open = false
      if (import.meta.client) document.body.style.overflow = ''
    },
    reset() {
      this.step = 1
      this.success = false
      this.reference = ''
      this.errorMessage = ''
      this.submitting = false
      this.form = emptyForm()
    },
    toggleDevice(slug: string) {
      const idx = this.form.devices.findIndex(d => d.slug === slug)
      if (idx >= 0) this.form.devices.splice(idx, 1)
      else this.form.devices.push({ slug, quantity: 1 })
    },
    setQuantity(slug: string, qty: number) {
      const d = this.form.devices.find(x => x.slug === slug)
      if (d) d.quantity = Math.max(1, Math.min(99, qty))
    },
    toggleLocation(slug: string) {
      const idx = this.form.locations.indexOf(slug)
      if (idx >= 0) this.form.locations.splice(idx, 1)
      else this.form.locations.push(slug)
    },
    next() { if (this.step < 4) this.step = (this.step + 1) as any },
    back() { if (this.step > 1) this.step = (this.step - 1) as any },

    async submit() {
      this.submitting = true
      this.errorMessage = ''
      try {
        const res = await $fetch<{ ok: boolean; reference: string }>('/api/offers', {
          method: 'POST',
          body: this.form,
        })
        this.reference = res.reference
        this.success = true
      } catch (e: any) {
        this.errorMessage = e?.statusMessage || e?.data?.statusMessage || 'Etwas ist schiefgelaufen.'
      } finally {
        this.submitting = false
      }
    },
  },
})
