<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  layout: 'admin',
})
useSeoMeta({ title: 'Admin — Andi\'s Security', robots: 'noindex, nofollow' })

const checking = ref(true)
const authed = ref(false)
const password = ref('')
const loginError = ref('')
const loginLoading = ref(false)

interface Service {
  id: number; slug: string
  title_de: string; title_en: string
  summary_de: string; summary_en: string
  body_de: string; body_en: string
  image_path: string; icon: string
  sort_order: number; published: number
  created_at: string; updated_at: string
}

interface Offer {
  id: number; reference: string
  devices: { slug: string; quantity: number }[]
  locations: string[]
  first_name: string; last_name: string
  email: string; phone: string
  zip: string; city: string
  message: string; status: string; created_at: string
}

const tab = ref<'services' | 'offers'>('services')
const services = ref<Service[]>([])
const offers = ref<Offer[]>([])

const editing = ref<Partial<Service> | null>(null)
const editError = ref('')
const editLoading = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)
const uploadLoading = ref(false)
const uploadError = ref('')

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function pickImage() {
  uploadError.value = ''
  fileInput.value?.click()
}

async function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !editing.value) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    uploadError.value = 'Nur JPEG, PNG, WebP, GIF oder AVIF.'
    return
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    uploadError.value = 'Datei zu gross (max. 5 MB).'
    return
  }

  uploadError.value = ''
  uploadLoading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const r = await $fetch<{ ok: true; path: string }>('/api/admin/uploads/image', {
      method: 'POST',
      body: fd,
    })
    editing.value.image_path = r.path
  } catch (err: any) {
    uploadError.value = err?.statusMessage || err?.data?.statusMessage || 'Upload fehlgeschlagen.'
  } finally {
    uploadLoading.value = false
  }
}

function clearImage() {
  if (!editing.value) return
  editing.value.image_path = ''
  uploadError.value = ''
}

async function checkAuth() {
  try {
    const r = await $fetch<{ authenticated: boolean }>('/api/admin/me')
    authed.value = r.authenticated
    if (authed.value) await loadAll()
  } finally {
    checking.value = false
  }
}

async function loadAll() {
  const [s, o] = await Promise.all([
    $fetch<Service[]>('/api/admin/services'),
    $fetch<Offer[]>('/api/admin/offers'),
  ])
  services.value = s
  offers.value = o
}

async function login() {
  loginError.value = ''
  loginLoading.value = true
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    password.value = ''
    authed.value = true
    await loadAll()
  } catch (e: any) {
    loginError.value = e?.statusMessage || e?.data?.statusMessage || 'Anmeldung fehlgeschlagen.'
  } finally {
    loginLoading.value = false
  }
}

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  authed.value = false
  services.value = []
  offers.value = []
}

function startNew() {
  editing.value = {
    slug: '', title_de: '', title_en: '', summary_de: '', summary_en: '',
    body_de: '', body_en: '', image_path: '', icon: '', sort_order: 0, published: 1,
  }
  editError.value = ''
}

function startEdit(s: Service) {
  editing.value = { ...s }
  editError.value = ''
}

function cancelEdit() {
  editing.value = null
  editError.value = ''
}

async function saveService() {
  if (!editing.value) return
  editError.value = ''
  editLoading.value = true
  try {
    const body = {
      slug: editing.value.slug,
      title_de: editing.value.title_de,
      title_en: editing.value.title_en,
      summary_de: editing.value.summary_de,
      summary_en: editing.value.summary_en,
      body_de: editing.value.body_de || '',
      body_en: editing.value.body_en || '',
      image_path: editing.value.image_path || '',
      icon: editing.value.icon || '',
      sort_order: Number(editing.value.sort_order || 0),
      published: editing.value.published === 1 || editing.value.published === true,
    }
    if (editing.value.id) {
      await $fetch(`/api/admin/services/${editing.value.id}`, { method: 'PUT', body })
    } else {
      await $fetch(`/api/admin/services`, { method: 'POST', body })
    }
    editing.value = null
    await loadAll()
  } catch (e: any) {
    editError.value = e?.statusMessage || e?.data?.statusMessage || 'Speichern fehlgeschlagen.'
  } finally {
    editLoading.value = false
  }
}

async function deleteService(s: Service) {
  if (!confirm(`Wirklich löschen: "${s.title_de}"?`)) return
  await $fetch(`/api/admin/services/${s.id}`, { method: 'DELETE' })
  await loadAll()
}

const offerCount = computed(() => offers.value.length)
const serviceCount = computed(() => services.value.length)

onMounted(checkAuth)
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="checking" class="flex min-h-screen items-center justify-center text-ink-500">
      Wird geladen…
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
          <span v-if="loginLoading">Wird geprüft…</span>
          <span v-else>Anmelden</span>
        </button>

        <NuxtLink to="/" class="mt-4 block text-center text-xs text-ink-500 hover:text-brand-700">← Zurück zur Webseite</NuxtLink>
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
            <NuxtLink to="/" class="text-sm text-ink-600 hover:text-brand-700">Webseite ansehen ↗</NuxtLink>
            <button class="btn-ghost" @click="logout">Abmelden</button>
          </div>
        </div>
      </header>

      <main class="container py-8">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="rounded-xl border border-ink-200 bg-white p-5">
            <div class="text-xs uppercase tracking-wide text-ink-500">Dienstleistungen</div>
            <div class="mt-1 text-2xl font-bold">{{ serviceCount }}</div>
          </div>
          <div class="rounded-xl border border-ink-200 bg-white p-5">
            <div class="text-xs uppercase tracking-wide text-ink-500">Offerten gesamt</div>
            <div class="mt-1 text-2xl font-bold">{{ offerCount }}</div>
          </div>
        </div>

        <div class="mt-8 flex gap-2 border-b border-ink-200">
          <button
            class="border-b-2 px-4 py-2 text-sm font-medium"
            :class="tab === 'services' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'"
            @click="tab = 'services'"
          >Dienstleistungen</button>
          <button
            class="border-b-2 px-4 py-2 text-sm font-medium"
            :class="tab === 'offers' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'"
            @click="tab = 'offers'"
          >Offerten</button>
        </div>

        <!-- SERVICES TAB -->
        <section v-if="tab === 'services'" class="mt-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Dienstleistungen verwalten</h2>
            <button class="btn-primary" @click="startNew">+ Neue Dienstleistung</button>
          </div>

          <div v-if="services.length === 0" class="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
            Noch keine Dienstleistungen erfasst.
          </div>

          <div v-else class="mt-6 overflow-x-auto rounded-xl border border-ink-200 bg-white">
            <table class="w-full text-sm">
              <thead class="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th class="px-4 py-3">Sort</th>
                  <th class="px-4 py-3">Titel (DE)</th>
                  <th class="px-4 py-3">Slug</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in services" :key="s.id" class="border-t border-ink-100">
                  <td class="px-4 py-3 text-ink-500">{{ s.sort_order }}</td>
                  <td class="px-4 py-3 font-medium text-ink-900">{{ s.title_de }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-ink-500">{{ s.slug }}</td>
                  <td class="px-4 py-3">
                    <span v-if="s.published" class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Live</span>
                    <span v-else class="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">Entwurf</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button class="text-sm text-brand-700 hover:underline" @click="startEdit(s)">Bearbeiten</button>
                    <button class="ml-3 text-sm text-red-600 hover:underline" @click="deleteService(s)">Löschen</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- OFFERS TAB -->
        <section v-else class="mt-6">
          <h2 class="text-lg font-semibold">Eingegangene Offerten</h2>

          <div v-if="offers.length === 0" class="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
            Noch keine Offerten eingegangen.
          </div>

          <div v-else class="mt-6 space-y-4">
            <details v-for="o in offers" :key="o.id" class="group rounded-xl border border-ink-200 bg-white">
              <summary class="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                <div>
                  <div class="text-xs font-mono text-ink-500">{{ o.reference }}</div>
                  <div class="font-medium text-ink-900">{{ o.first_name }} {{ o.last_name }}</div>
                  <div class="text-sm text-ink-500">{{ o.zip }} {{ o.city }} · {{ o.email }}</div>
                </div>
                <div class="text-xs text-ink-500">{{ o.created_at }}</div>
              </summary>
              <div class="border-t border-ink-100 px-5 py-4 text-sm">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div class="font-semibold text-ink-700">Geräte</div>
                    <ul class="mt-1 list-disc pl-5 text-ink-600">
                      <li v-for="d in o.devices" :key="d.slug">{{ d.slug }} × {{ d.quantity }}</li>
                    </ul>
                  </div>
                  <div>
                    <div class="font-semibold text-ink-700">Standorte</div>
                    <ul class="mt-1 list-disc pl-5 text-ink-600">
                      <li v-for="l in o.locations" :key="l">{{ l }}</li>
                    </ul>
                  </div>
                </div>
                <div class="mt-4">
                  <div class="font-semibold text-ink-700">Kontakt</div>
                  <p class="mt-1 text-ink-600">
                    📞 <a :href="`tel:${o.phone}`" class="hover:underline">{{ o.phone }}</a><br />
                    ✉ <a :href="`mailto:${o.email}`" class="hover:underline">{{ o.email }}</a>
                  </p>
                </div>
                <div v-if="o.message" class="mt-4">
                  <div class="font-semibold text-ink-700">Nachricht</div>
                  <p class="mt-1 whitespace-pre-line text-ink-600">{{ o.message }}</p>
                </div>
              </div>
            </details>
          </div>
        </section>
      </main>

      <!-- Edit modal -->
      <div v-if="editing" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4" @click.self="cancelEdit">
        <div class="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
          <div class="flex items-center justify-between border-b border-ink-100 px-6 py-4">
            <h3 class="text-lg font-semibold">{{ editing.id ? 'Dienstleistung bearbeiten' : 'Neue Dienstleistung' }}</h3>
            <button class="text-ink-400 hover:text-ink-700" @click="cancelEdit">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="label">Slug *</label>
                <input v-model="editing.slug" class="input" placeholder="z.B. kameraueberwachung" />
                <p class="mt-1 text-xs text-ink-500">Nur Kleinbuchstaben, Zahlen, Bindestrich. Wird in der URL benutzt.</p>
              </div>
              <div>
                <label class="label">Sortierung</label>
                <input v-model.number="editing.sort_order" type="number" class="input" />
              </div>
              <div>
                <label class="label">Titel DE *</label>
                <input v-model="editing.title_de" class="input" />
              </div>
              <div>
                <label class="label">Titel EN *</label>
                <input v-model="editing.title_en" class="input" />
              </div>
              <div class="sm:col-span-2">
                <label class="label">Kurzbeschrieb DE *</label>
                <textarea v-model="editing.summary_de" rows="2" class="input" />
              </div>
              <div class="sm:col-span-2">
                <label class="label">Kurzbeschrieb EN *</label>
                <textarea v-model="editing.summary_en" rows="2" class="input" />
              </div>
              <div class="sm:col-span-2">
                <label class="label">Volltext DE</label>
                <textarea v-model="editing.body_de" rows="5" class="input" />
              </div>
              <div class="sm:col-span-2">
                <label class="label">Volltext EN</label>
                <textarea v-model="editing.body_en" rows="5" class="input" />
              </div>
              <div class="sm:col-span-2">
                <label class="label">Bild</label>

                <div v-if="editing.image_path" class="mt-1 flex items-start gap-4 rounded-lg border border-ink-200 bg-ink-50 p-3">
                  <img :src="editing.image_path" alt="Vorschau" class="h-24 w-24 rounded-md object-cover ring-1 ring-ink-200" />
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-mono text-xs text-ink-600">{{ editing.image_path }}</div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <button type="button" class="btn-ghost text-sm" :disabled="uploadLoading" @click="pickImage">
                        Anderes Bild hochladen
                      </button>
                      <button type="button" class="text-sm text-red-600 hover:underline" @click="clearImage">
                        Entfernen
                      </button>
                    </div>
                  </div>
                </div>

                <div v-else class="mt-1 flex items-center gap-3">
                  <button type="button" class="btn-primary" :disabled="uploadLoading" @click="pickImage">
                    <span v-if="uploadLoading">Wird hochgeladen…</span>
                    <span v-else>Bild hochladen</span>
                  </button>
                  <span class="text-xs text-ink-500">JPEG, PNG, WebP, GIF, AVIF — max. 5 MB</span>
                </div>

                <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" class="hidden" @change="onImageSelected" />

                <input v-model="editing.image_path" class="input mt-3" placeholder="/images/uploads/xxx.jpg (oder manuell eintragen)" />
                <p v-if="uploadError" class="mt-1 text-xs text-red-600">{{ uploadError }}</p>
                <p v-else class="mt-1 text-xs text-ink-500">Hochgeladen wird nach <code>public/images/uploads/</code>. Manuelle Pfade weiter erlaubt.</p>
              </div>
              <div class="sm:col-span-2">
                <label class="flex items-center gap-2 text-sm">
                  <input v-model="editing.published" type="checkbox" :true-value="1" :false-value="0" class="h-4 w-4 rounded border-ink-300 text-brand-600" />
                  <span>Veröffentlicht (auf der Webseite sichtbar)</span>
                </label>
              </div>
            </div>
            <p v-if="editError" class="mt-4 text-sm text-red-600">{{ editError }}</p>
          </div>
          <div class="flex items-center justify-end gap-3 border-t border-ink-100 bg-ink-50 px-6 py-4">
            <button class="btn-ghost" @click="cancelEdit">Abbrechen</button>
            <button class="btn-primary" :disabled="editLoading" @click="saveService">
              <span v-if="editLoading">Wird gespeichert…</span>
              <span v-else>Speichern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
