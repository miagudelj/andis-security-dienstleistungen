<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { Offer, Service, WizardStep, CompanySettings } from '~/types/admin'

definePageMeta({
  layout: 'admin',
})
useSeoMeta({ title: 'PreSecurity – Admin', robots: 'noindex, nofollow' })

// =====================================================
// AUTH STATE
// =====================================================
const checking = ref(true)
const authed = ref(false)
const password = ref('')
const loginError = ref('')
const loginLoading = ref(false)

// Current tab
const activeTab = ref<'offers' | 'services' | 'wizard' | 'settings'>('offers')

// =====================================================
// DATA
// =====================================================
const offers = ref<Offer[]>([])
const services = ref<Service[]>([])
const wizardSteps = ref<WizardStep[]>([])
const companySettings = ref<CompanySettings>({
  company_name: 'PreSecurity',
  street: '',
  zip: '',
  city: '',
  canton: 'Zurich',
  country: 'Schweiz',
  phone: '',
  email: '',
  website: '',
  uid_number: '',
  owner_name: '',
  updated_at: null,
})

// Polling & alerts
let sessionCheckInterval: ReturnType<typeof setInterval> | null = null
let offerPollInterval: ReturnType<typeof setInterval> | null = null
const lastOfferCount = ref(0)
const newOfferAlert = ref(false)

// =====================================================
// AUTH HELPERS
// =====================================================
async function fetchWithAuth<T>(url: string, options?: any): Promise<T> {
  try {
    return await $fetch<T>(url, options)
  } catch (err: any) {
    if (err?.statusCode === 401 || err?.status === 401) {
      handleSessionExpired()
      throw err
    }
    throw err
  }
}

function handleSessionExpired() {
  stopSessionCheck()
  stopOfferPolling()
  authed.value = false
  offers.value = []
  services.value = []
  wizardSteps.value = []
  loginError.value = 'Sitzung abgelaufen. Bitte erneut anmelden.'
}

// =====================================================
// DATA LOADING
// =====================================================
async function loadOffers() {
  try {
    const o = await fetchWithAuth<Offer[]>('/api/admin/offers')
    offers.value = o
    lastOfferCount.value = o.length
  } catch { /* handled */ }
}

async function loadServices() {
  try {
    services.value = await fetchWithAuth<Service[]>('/api/admin/services')
  } catch { /* handled */ }
}

async function loadWizardSteps() {
  try {
    wizardSteps.value = await fetchWithAuth<WizardStep[]>('/api/admin/wizard/steps')
  } catch { /* handled */ }
}

async function loadSettings() {
  try {
    companySettings.value = await fetchWithAuth<CompanySettings>('/api/admin/settings')
  } catch { /* handled */ }
}

async function loadAllData() {
  await Promise.all([
    loadOffers(),
    loadServices(),
    loadWizardSteps(),
    loadSettings(),
  ])
}

// =====================================================
// POLLING
// =====================================================
async function refreshOffers() {
  if (!authed.value) return
  try {
    const newOffers = await fetchWithAuth<Offer[]>('/api/admin/offers')
    if (newOffers) {
      if (lastOfferCount.value > 0 && newOffers.length > lastOfferCount.value) {
        newOfferAlert.value = true
        setTimeout(() => { newOfferAlert.value = false }, 5000)
      }
      lastOfferCount.value = newOffers.length
      offers.value = newOffers
    }
  } catch { /* silent */ }
}

function startOfferPolling() {
  if (offerPollInterval) return
  offerPollInterval = setInterval(refreshOffers, 15000)
}

function stopOfferPolling() {
  if (offerPollInterval) {
    clearInterval(offerPollInterval)
    offerPollInterval = null
  }
}

function startSessionCheck() {
  if (sessionCheckInterval) return
  sessionCheckInterval = setInterval(async () => {
    try {
      const r = await $fetch<{ authenticated: boolean }>('/api/admin/me')
      if (!r.authenticated) handleSessionExpired()
    } catch {
      handleSessionExpired()
    }
  }, 60_000)
}

function stopSessionCheck() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
    sessionCheckInterval = null
  }
}

// =====================================================
// OFFER ACTIONS
// =====================================================
async function updateOfferStatus(offer: Offer, status: string) {
  try {
    await fetchWithAuth(`/api/admin/offers/${offer.id}`, {
      method: 'PUT',
      body: { status },
    })
    offer.status = status
    const finalStates = ['accepted', 'rejected', 'cancelled']
    offer.completed_at = finalStates.includes(status) ? new Date().toISOString() : null
  } catch (e) {
    console.error('Failed to update offer status', e)
  }
}

async function updateOfferAssignee(offer: Offer, assignee: string) {
  try {
    await fetchWithAuth(`/api/admin/offers/${offer.id}`, {
      method: 'PUT',
      body: { assigned_to: assignee },
    })
    offer.assigned_to = assignee
  } catch (e) {
    console.error('Failed to update assignee', e)
  }
}

async function updateOfferNotes(offer: Offer, notes: string) {
  try {
    await fetchWithAuth(`/api/admin/offers/${offer.id}`, {
      method: 'PUT',
      body: { notes: notes || null },
    })
    offer.notes = notes || null
  } catch (e) {
    console.error('Failed to update notes', e)
  }
}

// =====================================================
// SERVICE ACTIONS
// =====================================================
async function saveService(service: Partial<Service>, isNew: boolean) {
  try {
    if (isNew) {
      await fetchWithAuth('/api/admin/services', {
        method: 'POST',
        body: service,
      })
    } else {
      await fetchWithAuth(`/api/admin/services/${service.id}`, {
        method: 'PUT',
        body: service,
      })
    }
    await loadServices()
  } catch (e) {
    console.error('Failed to save service', e)
  }
}

async function deleteService(service: Service) {
  try {
    await fetchWithAuth(`/api/admin/services/${service.id}`, { method: 'DELETE' })
    await loadServices()
  } catch (e) {
    console.error('Failed to delete service', e)
  }
}

// =====================================================
// WIZARD ACTIONS
// =====================================================
async function saveWizardStep(step: Partial<WizardStep>, isNew: boolean) {
  try {
    if (isNew) {
      await fetchWithAuth('/api/admin/wizard/steps', {
        method: 'POST',
        body: step,
      })
    } else {
      await fetchWithAuth(`/api/admin/wizard/steps/${step.id}`, {
        method: 'PUT',
        body: step,
      })
    }
    await loadWizardSteps()
  } catch (e) {
    console.error('Failed to save wizard step', e)
  }
}

async function deleteWizardStep(step: WizardStep) {
  try {
    await fetchWithAuth(`/api/admin/wizard/steps/${step.id}`, { method: 'DELETE' })
    await loadWizardSteps()
  } catch (e) {
    console.error('Failed to delete wizard step', e)
  }
}

async function toggleWizardStepActive(step: WizardStep) {
  try {
    await fetchWithAuth(`/api/admin/wizard/steps/${step.id}`, {
      method: 'PUT',
      body: { active: !step.active },
    })
    step.active = !step.active
  } catch (e) {
    console.error('Failed to toggle step', e)
  }
}

// =====================================================
// SETTINGS ACTIONS
// =====================================================
async function saveSettings(settings: Partial<CompanySettings>) {
  try {
    await fetchWithAuth('/api/admin/settings', {
      method: 'PUT',
      body: settings,
    })
    await loadSettings()
  } catch (e) {
    console.error('Failed to save settings', e)
  }
}

// =====================================================
// AUTH & LIFECYCLE
// =====================================================
async function checkAuth() {
  try {
    const r = await $fetch<{ authenticated: boolean }>('/api/admin/me')
    authed.value = r.authenticated
    if (authed.value) {
      await loadAllData()
      startSessionCheck()
      startOfferPolling()
    }
  } finally {
    checking.value = false
  }
}

async function login() {
  loginError.value = ''
  loginLoading.value = true
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    password.value = ''
    authed.value = true
    await loadAllData()
    startSessionCheck()
    startOfferPolling()
  } catch (e: any) {
    loginError.value = e?.statusMessage || e?.data?.statusMessage || 'Anmeldung fehlgeschlagen.'
  } finally {
    loginLoading.value = false
  }
}

async function logout() {
  stopSessionCheck()
  stopOfferPolling()
  await $fetch('/api/admin/logout', { method: 'POST' })
  authed.value = false
  offers.value = []
  services.value = []
  wizardSteps.value = []
}

watch(authed, (isAuthed) => {
  if (isAuthed) {
    startOfferPolling()
  } else {
    stopOfferPolling()
  }
})

onMounted(checkAuth)
onBeforeUnmount(() => {
  stopSessionCheck()
  stopOfferPolling()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="checking" class="flex min-h-screen items-center justify-center text-ink-500">
      Wird geladen...
    </div>

    <!-- Login -->
    <div v-else-if="!authed" class="flex min-h-screen items-center justify-center px-4">
      <form class="w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-8 shadow-sm" @submit.prevent="login">
        <div class="flex items-center gap-2">
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z"/></svg>
          </span>
          <span class="text-base font-semibold">Admin-Bereich</span>
        </div>
        <h1 class="mt-5 text-xl font-semibold">Anmelden</h1>
        <p class="mt-1 text-sm text-ink-500">Bitte Passwort eingeben.</p>

        <label class="label mt-5" for="pw">Passwort</label>
        <input id="pw" v-model="password" type="password" class="input" autocomplete="current-password" required />

        <p v-if="loginError" class="mt-3 text-sm text-red-600">{{ loginError }}</p>

        <button type="submit" class="btn-primary mt-5 w-full" :disabled="loginLoading || !password">
          <span v-if="loginLoading">Wird gepruft...</span>
          <span v-else>Anmelden</span>
        </button>

        <NuxtLink to="/" class="mt-4 block text-center text-xs text-ink-500 hover:text-brand-700">Zur Webseite</NuxtLink>
      </form>
    </div>

    <!-- Dashboard -->
    <div v-else>
      <header class="border-b border-ink-200 bg-white">
        <div class="container flex h-16 items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white text-xs font-bold">A</span>
            <span class="font-semibold">Admin</span>
          </div>
          <div class="flex items-center gap-3">
            <NuxtLink to="/" class="text-sm text-ink-600 hover:text-brand-700">Webseite</NuxtLink>
            <button class="btn-ghost" @click="logout">Abmelden</button>
          </div>
        </div>
      </header>

      <main class="container py-8">
        <!-- Tabs -->
        <div class="border-b border-ink-200">
          <nav class="flex gap-6">
            <button
              class="relative pb-3 text-sm font-medium transition-colors"
              :class="activeTab === 'offers' ? 'text-brand-700' : 'text-ink-500 hover:text-ink-700'"
              @click="activeTab = 'offers'"
            >
              Offerten ({{ offers.length }})
              <span v-if="activeTab === 'offers'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"></span>
            </button>
            <button
              class="relative pb-3 text-sm font-medium transition-colors"
              :class="activeTab === 'services' ? 'text-brand-700' : 'text-ink-500 hover:text-ink-700'"
              @click="activeTab = 'services'"
            >
              Dienstleistungen ({{ services.length }})
              <span v-if="activeTab === 'services'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"></span>
            </button>
            <button
              class="relative pb-3 text-sm font-medium transition-colors"
              :class="activeTab === 'wizard' ? 'text-brand-700' : 'text-ink-500 hover:text-ink-700'"
              @click="activeTab = 'wizard'"
            >
              Wizard ({{ wizardSteps.length }})
              <span v-if="activeTab === 'wizard'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"></span>
            </button>
            <button
              class="relative pb-3 text-sm font-medium transition-colors"
              :class="activeTab === 'settings' ? 'text-brand-700' : 'text-ink-500 hover:text-ink-700'"
              @click="activeTab = 'settings'"
            >
              Firmendaten
              <span v-if="activeTab === 'settings'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"></span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="mt-6">
          <AdminOffers
            v-if="activeTab === 'offers'"
            :offers="offers"
            :new-offer-alert="newOfferAlert"
            @update:new-offer-alert="newOfferAlert = $event"
            @update-status="updateOfferStatus"
            @update-assignee="updateOfferAssignee"
            @update-notes="updateOfferNotes"
          />

          <AdminServices
            v-else-if="activeTab === 'services'"
            :services="services"
            @save="saveService"
            @delete="deleteService"
          />

          <AdminWizard
            v-else-if="activeTab === 'wizard'"
            :wizard-steps="wizardSteps"
            @save="saveWizardStep"
            @delete="deleteWizardStep"
            @toggle-active="toggleWizardStepActive"
            @reload="loadWizardSteps"
          />

          <AdminSettings
            v-else-if="activeTab === 'settings'"
            :settings="companySettings"
            @save="saveSettings"
          />
        </div>
      </main>
    </div>
  </div>
</template>
