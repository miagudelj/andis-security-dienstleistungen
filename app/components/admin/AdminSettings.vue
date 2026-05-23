<script setup lang="ts">
import { ref } from 'vue'
import type { CompanySettings } from '~/types/admin'

const props = defineProps<{
  settings: CompanySettings
}>()

const emit = defineEmits<{
  'save': [settings: Partial<CompanySettings>]
}>()

const settingsForm = ref<Partial<CompanySettings>>({})
const settingsEditing = ref(false)
const settingsLoading = ref(false)
const settingsSaved = ref(false)

function startEditSettings() {
  settingsForm.value = { ...props.settings }
  settingsEditing.value = true
  settingsSaved.value = false
}

function cancelSettingsEdit() {
  settingsEditing.value = false
  settingsForm.value = {}
}

async function saveSettings() {
  settingsLoading.value = true
  try {
    emit('save', settingsForm.value)
    settingsEditing.value = false
    settingsSaved.value = true
    setTimeout(() => { settingsSaved.value = false }, 3000)
  } finally {
    settingsLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Firmendaten</h2>
      <div class="flex items-center gap-3">
        <span v-if="settingsSaved" class="text-sm text-emerald-600">Gespeichert!</span>
        <button v-if="!settingsEditing" class="btn-primary" @click="startEditSettings">Bearbeiten</button>
      </div>
    </div>

    <!-- Settings View -->
    <div v-if="!settingsEditing" class="mt-6 rounded-xl border border-ink-200 bg-white p-6">
      <dl class="grid gap-4 sm:grid-cols-2">
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">Firmenname</dt>
          <dd class="mt-1 text-ink-900">{{ settings.company_name || '-' }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">Inhaber</dt>
          <dd class="mt-1 text-ink-900">{{ settings.owner_name || '-' }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">Strasse</dt>
          <dd class="mt-1 text-ink-900">{{ settings.street || '-' }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">PLZ / Ort</dt>
          <dd class="mt-1 text-ink-900">{{ settings.zip }} {{ settings.city }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">Kanton</dt>
          <dd class="mt-1 text-ink-900">{{ settings.canton || '-' }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">Land</dt>
          <dd class="mt-1 text-ink-900">{{ settings.country || '-' }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">Telefon</dt>
          <dd class="mt-1 text-ink-900">{{ settings.phone || '-' }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">E-Mail</dt>
          <dd class="mt-1 text-ink-900">{{ settings.email || '-' }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">Webseite</dt>
          <dd class="mt-1 text-ink-900">{{ settings.website || '-' }}</dd>
        </div>
        <div>
          <dt class="text-xs font-medium uppercase tracking-wide text-ink-500">UID-Nummer</dt>
          <dd class="mt-1 text-ink-900">{{ settings.uid_number || '-' }}</dd>
        </div>
      </dl>
      <p v-if="settings.updated_at" class="mt-6 text-xs text-ink-400">
        Zuletzt aktualisiert: {{ settings.updated_at }}
      </p>
    </div>

    <!-- Settings Edit Form -->
    <div v-else class="mt-6 rounded-xl border border-ink-200 bg-white p-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label">Firmenname *</label>
          <input v-model="settingsForm.company_name" type="text" class="input" required />
        </div>
        <div>
          <label class="label">Inhaber</label>
          <input v-model="settingsForm.owner_name" type="text" class="input" />
        </div>
        <div class="sm:col-span-2">
          <label class="label">Strasse</label>
          <input v-model="settingsForm.street" type="text" class="input" />
        </div>
        <div>
          <label class="label">PLZ</label>
          <input v-model="settingsForm.zip" type="text" class="input" />
        </div>
        <div>
          <label class="label">Ort</label>
          <input v-model="settingsForm.city" type="text" class="input" />
        </div>
        <div>
          <label class="label">Kanton</label>
          <input v-model="settingsForm.canton" type="text" class="input" />
        </div>
        <div>
          <label class="label">Land</label>
          <input v-model="settingsForm.country" type="text" class="input" />
        </div>
        <div>
          <label class="label">Telefon</label>
          <input v-model="settingsForm.phone" type="tel" class="input" />
        </div>
        <div>
          <label class="label">E-Mail</label>
          <input v-model="settingsForm.email" type="email" class="input" />
        </div>
        <div>
          <label class="label">Webseite</label>
          <input v-model="settingsForm.website" type="url" class="input" placeholder="https://..." />
        </div>
        <div>
          <label class="label">UID-Nummer</label>
          <input v-model="settingsForm.uid_number" type="text" class="input" placeholder="CHE-..." />
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button class="btn-ghost" @click="cancelSettingsEdit">Abbrechen</button>
        <button class="btn-primary" :disabled="settingsLoading" @click="saveSettings">
          {{ settingsLoading ? 'Speichern...' : 'Speichern' }}
        </button>
      </div>
    </div>
  </div>
</template>
