<script setup lang="ts">
import { ref, computed } from 'vue'
import type { WizardStep, WizardOption, WizardContactField } from '~/types/admin'
import { STEP_TYPES } from '~/types/admin'

const props = defineProps<{
  wizardSteps: WizardStep[]
}>()

const emit = defineEmits<{
  'save': [step: Partial<WizardStep>, isNew: boolean]
  'delete': [step: WizardStep]
  'toggle-active': [step: WizardStep]
  'reload': []
}>()

// Step editing
const wizardStepEditing = ref<WizardStep | null>(null)
const wizardStepForm = ref<Partial<WizardStep>>({})
const wizardLoading = ref(false)

// Option editing
const optionEditing = ref<{ stepId: number; option: WizardOption | null } | null>(null)
const optionForm = ref<Partial<WizardOption>>({})
const optionLoading = ref(false)

// Contact field editing
const fieldEditing = ref<{ stepId: number; field: WizardContactField | null } | null>(null)
const fieldForm = ref<Partial<WizardContactField>>({})
const fieldLoading = ref(false)

// Expanded steps
const expandedSteps = ref<Set<number>>(new Set())

// Field types for contact form
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'E-Mail' },
  { value: 'tel', label: 'Telefon' },
  { value: 'textarea', label: 'Mehrzeilig' },
  { value: 'checkbox', label: 'Checkbox' },
]

function toggleStepExpanded(stepId: number) {
  if (expandedSteps.value.has(stepId)) {
    expandedSteps.value.delete(stepId)
  } else {
    expandedSteps.value.add(stepId)
  }
}

// =====================================================
// STEP FUNCTIONS
// =====================================================
function startNewWizardStep() {
  wizardStepForm.value = {
    slug: '',
    step_type: 'multi_select',
    title_de: '',
    title_en: '',
    subtitle_de: '',
    subtitle_en: '',
    error_message_de: 'Bitte mindestens eine Option wählen.',
    error_message_en: 'Please select at least one option.',
    is_required: true,
    min_selections: 1,
    max_selections: 0,
    sort_order: props.wizardSteps.length * 10,
    active: true,
  }
  wizardStepEditing.value = {} as WizardStep
}

function editWizardStep(step: WizardStep) {
  wizardStepForm.value = { ...step }
  wizardStepEditing.value = step
}

function cancelWizardStepEdit() {
  wizardStepEditing.value = null
  wizardStepForm.value = {}
}

async function saveWizardStep() {
  wizardLoading.value = true
  try {
    const isNew = !wizardStepEditing.value?.id
    emit('save', { ...wizardStepForm.value, id: wizardStepEditing.value?.id }, isNew)
    cancelWizardStepEdit()
  } finally {
    wizardLoading.value = false
  }
}

function deleteWizardStep(step: WizardStep) {
  if (!confirm(`Schritt "${step.title_de}" wirklich löschen?`)) return
  emit('delete', step)
}

function toggleWizardStepActive(step: WizardStep) {
  emit('toggle-active', step)
}

// =====================================================
// OPTION FUNCTIONS
// =====================================================
function startNewOption(stepId: number) {
  const step = props.wizardSteps.find(s => s.id === stepId)
  optionForm.value = {
    step_id: stepId,
    slug: '',
    label_de: '',
    label_en: '',
    description_de: '',
    description_en: '',
    icon: '',
    sort_order: (step?.options?.length || 0) * 10,
    active: true,
  }
  optionEditing.value = { stepId, option: null }
}

function editOption(stepId: number, option: WizardOption) {
  optionForm.value = { ...option }
  optionEditing.value = { stepId, option }
}

function cancelOptionEdit() {
  optionEditing.value = null
  optionForm.value = {}
}

async function saveOption() {
  if (!optionEditing.value) return
  optionLoading.value = true
  try {
    const isNew = !optionEditing.value.option?.id
    if (isNew) {
      await $fetch('/api/admin/wizard/options', {
        method: 'POST',
        body: optionForm.value,
      })
    } else {
      await $fetch(`/api/admin/wizard/options/${optionEditing.value.option!.id}`, {
        method: 'PUT',
        body: optionForm.value,
      })
    }
    cancelOptionEdit()
    emit('reload')
  } catch (e: any) {
    console.error('Failed to save option', e)
    alert(e?.data?.statusMessage || 'Speichern fehlgeschlagen')
  } finally {
    optionLoading.value = false
  }
}

async function deleteOption(option: WizardOption) {
  if (!confirm(`Option "${option.label_de}" wirklich löschen?`)) return
  try {
    await $fetch(`/api/admin/wizard/options/${option.id}`, { method: 'DELETE' })
    emit('reload')
  } catch (e: any) {
    console.error('Failed to delete option', e)
    alert(e?.data?.statusMessage || 'Löschen fehlgeschlagen')
  }
}

// =====================================================
// CONTACT FIELD FUNCTIONS
// =====================================================
function startNewField(stepId: number) {
  const step = props.wizardSteps.find(s => s.id === stepId)
  fieldForm.value = {
    step_id: stepId,
    field_name: '',
    field_type: 'text',
    label_de: '',
    label_en: '',
    placeholder_de: '',
    placeholder_en: '',
    is_required: true,
    autocomplete: '',
    validation_regex: '',
    sort_order: (step?.contact_fields?.length || 0) * 10,
  }
  fieldEditing.value = { stepId, field: null }
}

function editField(stepId: number, field: WizardContactField) {
  fieldForm.value = { ...field }
  fieldEditing.value = { stepId, field }
}

function cancelFieldEdit() {
  fieldEditing.value = null
  fieldForm.value = {}
}

async function saveField() {
  if (!fieldEditing.value) return
  fieldLoading.value = true
  try {
    const isNew = !fieldEditing.value.field?.id
    if (isNew) {
      await $fetch('/api/admin/wizard/contact-fields', {
        method: 'POST',
        body: fieldForm.value,
      })
    } else {
      await $fetch(`/api/admin/wizard/contact-fields/${fieldEditing.value.field!.id}`, {
        method: 'PUT',
        body: fieldForm.value,
      })
    }
    cancelFieldEdit()
    emit('reload')
  } catch (e: any) {
    console.error('Failed to save field', e)
    alert(e?.data?.statusMessage || 'Speichern fehlgeschlagen')
  } finally {
    fieldLoading.value = false
  }
}

async function deleteField(field: WizardContactField) {
  if (!confirm(`Feld "${field.label_de}" wirklich löschen?`)) return
  try {
    await $fetch(`/api/admin/wizard/contact-fields/${field.id}`, { method: 'DELETE' })
    emit('reload')
  } catch (e: any) {
    console.error('Failed to delete field', e)
    alert(e?.data?.statusMessage || 'Löschen fehlgeschlagen')
  }
}

// =====================================================
// HELPERS
// =====================================================
function getStepTypeLabel(type: string) {
  return STEP_TYPES.find(t => t.value === type)?.label || type
}

function getFieldTypeLabel(type: string) {
  return FIELD_TYPES.find(t => t.value === type)?.label || type
}

function supportsOptions(stepType: string) {
  return ['multi_select', 'single_select', 'quantity_input'].includes(stepType)
}

function supportsContactFields(stepType: string) {
  return stepType === 'contact_form'
}

function hasExpandableContent(step: WizardStep) {
  return supportsOptions(step.step_type) || supportsContactFields(step.step_type)
}

function getItemCount(step: WizardStep) {
  if (supportsOptions(step.step_type)) return step.options?.length || 0
  if (supportsContactFields(step.step_type)) return step.contact_fields?.length || 0
  return 0
}

const sortedSteps = computed(() => {
  return [...props.wizardSteps].sort((a, b) => a.sort_order - b.sort_order)
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Wizard-Schritte</h2>
      <button class="btn-primary" @click="startNewWizardStep">+ Neuer Schritt</button>
    </div>

    <!-- Step Editor Modal -->
    <div v-if="wizardStepEditing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
        <h3 class="text-lg font-semibold">{{ wizardStepEditing.id ? 'Schritt bearbeiten' : 'Neuer Schritt' }}</h3>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Slug</label>
            <input v-model="wizardStepForm.slug" type="text" class="input" placeholder="z.B. geraete" />
          </div>
          <div>
            <label class="label">Typ</label>
            <select v-model="wizardStepForm.step_type" class="input">
              <option v-for="t in STEP_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="label">Titel (DE)</label>
            <input v-model="wizardStepForm.title_de" type="text" class="input" />
          </div>
          <div>
            <label class="label">Titel (EN)</label>
            <input v-model="wizardStepForm.title_en" type="text" class="input" />
          </div>
          <div>
            <label class="label">Untertitel (DE)</label>
            <input v-model="wizardStepForm.subtitle_de" type="text" class="input" />
          </div>
          <div>
            <label class="label">Untertitel (EN)</label>
            <input v-model="wizardStepForm.subtitle_en" type="text" class="input" />
          </div>
          <div>
            <label class="label">Fehlermeldung (DE)</label>
            <input v-model="wizardStepForm.error_message_de" type="text" class="input" />
          </div>
          <div>
            <label class="label">Fehlermeldung (EN)</label>
            <input v-model="wizardStepForm.error_message_en" type="text" class="input" />
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <input v-model="wizardStepForm.is_required" type="checkbox" id="step-required" class="h-4 w-4" />
              <label for="step-required" class="text-sm">Pflichtfeld</label>
            </div>
            <div class="flex items-center gap-2">
              <input v-model="wizardStepForm.active" type="checkbox" id="step-active" class="h-4 w-4" />
              <label for="step-active" class="text-sm">Aktiv</label>
            </div>
          </div>
          <div>
            <label class="label">Sortierung</label>
            <input v-model.number="wizardStepForm.sort_order" type="number" class="input" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button class="btn-ghost" @click="cancelWizardStepEdit">Abbrechen</button>
          <button class="btn-primary" :disabled="wizardLoading" @click="saveWizardStep">
            {{ wizardLoading ? 'Speichern...' : 'Speichern' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Option Editor Modal -->
    <div v-if="optionEditing" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
        <h3 class="text-lg font-semibold">{{ optionEditing.option ? 'Option bearbeiten' : 'Neue Option' }}</h3>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Slug</label>
            <input v-model="optionForm.slug" type="text" class="input" placeholder="z.B. kamera-aussen" />
          </div>
          <div>
            <label class="label">Icon (Emoji)</label>
            <input v-model="optionForm.icon" type="text" class="input" placeholder="z.B. 📷" />
          </div>
          <div>
            <label class="label">Label (DE)</label>
            <input v-model="optionForm.label_de" type="text" class="input" />
          </div>
          <div>
            <label class="label">Label (EN)</label>
            <input v-model="optionForm.label_en" type="text" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Beschreibung (DE)</label>
            <textarea v-model="optionForm.description_de" rows="2" class="input"></textarea>
          </div>
          <div class="sm:col-span-2">
            <label class="label">Beschreibung (EN)</label>
            <textarea v-model="optionForm.description_en" rows="2" class="input"></textarea>
          </div>
          <div class="flex items-center gap-2">
            <input v-model="optionForm.active" type="checkbox" id="option-active" class="h-4 w-4" />
            <label for="option-active" class="text-sm">Aktiv</label>
          </div>
          <div>
            <label class="label">Sortierung</label>
            <input v-model.number="optionForm.sort_order" type="number" class="input" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button class="btn-ghost" @click="cancelOptionEdit">Abbrechen</button>
          <button class="btn-primary" :disabled="optionLoading" @click="saveOption">
            {{ optionLoading ? 'Speichern...' : 'Speichern' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Contact Field Editor Modal -->
    <div v-if="fieldEditing" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
        <h3 class="text-lg font-semibold">{{ fieldEditing.field ? 'Feld bearbeiten' : 'Neues Feld' }}</h3>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Feldname</label>
            <input v-model="fieldForm.field_name" type="text" class="input" placeholder="z.B. first_name" />
            <p class="text-xs text-ink-400 mt-1">Nur a-z und _ erlaubt</p>
          </div>
          <div>
            <label class="label">Feldtyp</label>
            <select v-model="fieldForm.field_type" class="input">
              <option v-for="t in FIELD_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="label">Label (DE)</label>
            <input v-model="fieldForm.label_de" type="text" class="input" placeholder="Vorname" />
          </div>
          <div>
            <label class="label">Label (EN)</label>
            <input v-model="fieldForm.label_en" type="text" class="input" placeholder="First name" />
          </div>
          <div>
            <label class="label">Platzhalter (DE)</label>
            <input v-model="fieldForm.placeholder_de" type="text" class="input" />
          </div>
          <div>
            <label class="label">Platzhalter (EN)</label>
            <input v-model="fieldForm.placeholder_en" type="text" class="input" />
          </div>
          <div>
            <label class="label">Autocomplete</label>
            <input v-model="fieldForm.autocomplete" type="text" class="input" placeholder="z.B. given-name" />
          </div>
          <div>
            <label class="label">Validierung (Regex)</label>
            <input v-model="fieldForm.validation_regex" type="text" class="input" />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="fieldForm.is_required" type="checkbox" id="field-required" class="h-4 w-4" />
            <label for="field-required" class="text-sm">Pflichtfeld</label>
          </div>
          <div>
            <label class="label">Sortierung</label>
            <input v-model.number="fieldForm.sort_order" type="number" class="input" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button class="btn-ghost" @click="cancelFieldEdit">Abbrechen</button>
          <button class="btn-primary" :disabled="fieldLoading" @click="saveField">
            {{ fieldLoading ? 'Speichern...' : 'Speichern' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="wizardSteps.length === 0" class="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
      Noch keine Wizard-Schritte erfasst.
    </div>

    <!-- Wizard Steps List -->
    <div v-else class="mt-6 space-y-3">
      <div
        v-for="step in sortedSteps"
        :key="step.id"
        class="rounded-xl border border-ink-200 bg-white overflow-hidden"
        :class="{ 'border-ink-300 bg-ink-50/50': !step.active }"
      >
        <!-- Step Header -->
        <div class="flex items-center gap-3 p-4">
          <!-- Expand Button -->
          <button
            v-if="hasExpandableContent(step)"
            class="w-6 h-6 flex items-center justify-center text-ink-400 hover:text-ink-600 transition-transform"
            :class="{ 'rotate-90': expandedSteps.has(step.id) }"
            @click="toggleStepExpanded(step.id)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div v-else class="w-6"></div>

          <!-- Step Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium" :class="step.active ? 'text-ink-900' : 'text-ink-500'">{{ step.title_de }}</span>
              <span class="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-600">{{ getStepTypeLabel(step.step_type) }}</span>
              <span v-if="!step.active" class="rounded bg-ink-200 px-2 py-0.5 text-xs text-ink-500">Inaktiv</span>
            </div>
            <div class="text-sm text-ink-500 mt-0.5">
              {{ step.slug }}
              <span v-if="hasExpandableContent(step)"> · {{ getItemCount(step) }} {{ supportsOptions(step.step_type) ? 'Optionen' : 'Felder' }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              class="text-sm px-3 py-1 rounded-lg transition-colors"
              :class="step.active ? 'text-ink-600 hover:bg-ink-100' : 'text-brand-600 hover:bg-brand-50'"
              @click="toggleWizardStepActive(step)"
            >
              {{ step.active ? 'Deaktivieren' : 'Aktivieren' }}
            </button>
            <button class="text-sm text-brand-600 hover:underline" @click="editWizardStep(step)">Bearbeiten</button>
            <button class="text-sm text-red-600 hover:underline" @click="deleteWizardStep(step)">Löschen</button>
          </div>
        </div>

        <!-- Collapsed Preview -->
        <div
          v-if="hasExpandableContent(step) && !expandedSteps.has(step.id) && getItemCount(step) > 0"
          class="px-4 pb-3 -mt-1"
        >
          <!-- Options Preview -->
          <div v-if="supportsOptions(step.step_type) && step.options" class="flex flex-wrap gap-1.5">
            <span
              v-for="opt in step.options.slice(0, 5)"
              :key="opt.id"
              class="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-600"
              :class="{ 'opacity-50': !opt.active }"
            >
              {{ opt.icon ? opt.icon + ' ' : '' }}{{ opt.label_de }}
            </span>
            <span v-if="step.options.length > 5" class="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-400">
              +{{ step.options.length - 5 }}
            </span>
          </div>

          <!-- Fields Preview -->
          <div v-else-if="supportsContactFields(step.step_type) && step.contact_fields" class="flex flex-wrap gap-1.5">
            <span
              v-for="field in step.contact_fields.slice(0, 5)"
              :key="field.id"
              class="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-600"
            >
              {{ field.label_de }}{{ field.is_required ? '*' : '' }}
            </span>
            <span v-if="step.contact_fields.length > 5" class="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-400">
              +{{ step.contact_fields.length - 5 }}
            </span>
          </div>
        </div>

        <!-- Expanded: Options Section -->
        <div v-if="supportsOptions(step.step_type) && expandedSteps.has(step.id)" class="border-t border-ink-100 bg-ink-50/50 p-4">
          <!-- Options List -->
          <div v-if="step.options && step.options.length > 0" class="space-y-2 mb-4">
            <div
              v-for="opt in step.options"
              :key="opt.id"
              class="flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-3"
              :class="{ 'opacity-60': !opt.active }"
            >
              <span v-if="opt.icon" class="text-lg w-6 text-center">{{ opt.icon }}</span>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-ink-900">{{ opt.label_de }}</div>
                <div v-if="opt.description_de" class="text-sm text-ink-500 truncate">{{ opt.description_de }}</div>
              </div>
              <span v-if="!opt.active" class="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-500">Inaktiv</span>
              <button class="text-sm text-brand-600 hover:underline" @click="editOption(step.id, opt)">Bearbeiten</button>
              <button class="text-sm text-red-600 hover:underline" @click="deleteOption(opt)">Löschen</button>
            </div>
          </div>
          <div v-else class="text-sm text-ink-400 mb-4">Keine Optionen vorhanden.</div>

          <button
            class="w-full rounded-lg border-2 border-dashed border-ink-300 py-2.5 text-sm text-ink-500 hover:border-brand-400 hover:text-brand-600 hover:bg-white transition-colors"
            @click="startNewOption(step.id)"
          >
            + Option hinzufügen
          </button>
        </div>

        <!-- Expanded: Contact Fields Section -->
        <div v-if="supportsContactFields(step.step_type) && expandedSteps.has(step.id)" class="border-t border-ink-100 bg-ink-50/50 p-4">
          <!-- Fields List -->
          <div v-if="step.contact_fields && step.contact_fields.length > 0" class="space-y-2 mb-4">
            <div
              v-for="field in step.contact_fields"
              :key="field.id"
              class="flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-3"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-ink-900">{{ field.label_de }}</span>
                  <span v-if="field.is_required" class="text-red-500 text-sm">*</span>
                  <code class="text-xs bg-ink-100 px-1.5 py-0.5 rounded text-ink-500">{{ field.field_name }}</code>
                </div>
                <div class="text-sm text-ink-500">
                  {{ getFieldTypeLabel(field.field_type) }}
                  <span v-if="field.placeholder_de"> · "{{ field.placeholder_de }}"</span>
                </div>
              </div>
              <button class="text-sm text-brand-600 hover:underline" @click="editField(step.id, field)">Bearbeiten</button>
              <button class="text-sm text-red-600 hover:underline" @click="deleteField(field)">Löschen</button>
            </div>
          </div>
          <div v-else class="text-sm text-ink-400 mb-4">Keine Felder vorhanden.</div>

          <button
            class="w-full rounded-lg border-2 border-dashed border-ink-300 py-2.5 text-sm text-ink-500 hover:border-brand-400 hover:text-brand-600 hover:bg-white transition-colors"
            @click="startNewField(step.id)"
          >
            + Feld hinzufügen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
