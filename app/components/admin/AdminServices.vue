<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Service } from '~/types/admin'

interface ImageInfo {
  path: string
  filename: string
  folder: string
  used: boolean
  size: number
}

const props = defineProps<{
  services: Service[]
}>()

const emit = defineEmits<{
  'save': [service: Partial<Service>, isNew: boolean]
  'delete': [service: Service]
  'reload': []
}>()

const serviceEditing = ref<Service | null>(null)
const serviceForm = ref<Partial<Service>>({})
const serviceLoading = ref(false)

// Image management
const images = ref<ImageInfo[]>([])
const imagesLoading = ref(false)
const showImagePicker = ref(false)
const uploadLoading = ref(false)
const isDragging = ref(false)

async function loadImages() {
  imagesLoading.value = true
  try {
    images.value = await $fetch<ImageInfo[]>('/api/admin/images')
  } catch (e) {
    console.error('Failed to load images', e)
  } finally {
    imagesLoading.value = false
  }
}

function startNewService() {
  serviceForm.value = {
    slug: '',
    title_de: '',
    title_en: '',
    summary_de: '',
    summary_en: '',
    body_de: '',
    body_en: '',
    icon: 'camera',
    image_path: '',
    sort_order: props.services.length * 10,
    published: 1,
  }
  serviceEditing.value = {} as Service
  loadImages()
}

function editService(s: Service) {
  serviceForm.value = { ...s }
  serviceEditing.value = s
  loadImages()
}

function cancelServiceEdit() {
  serviceEditing.value = null
  serviceForm.value = {}
  showImagePicker.value = false
}

async function saveService() {
  serviceLoading.value = true
  try {
    const isNew = !serviceEditing.value?.id
    emit('save', { ...serviceForm.value, id: serviceEditing.value?.id }, isNew)
    cancelServiceEdit()
  } finally {
    serviceLoading.value = false
  }
}

function deleteService(s: Service) {
  if (!confirm(`Dienstleistung "${s.title_de}" wirklich löschen?`)) return
  emit('delete', s)
}

// Image picker
function openImagePicker() {
  loadImages()
  showImagePicker.value = true
}

function selectImage(img: ImageInfo) {
  serviceForm.value.image_path = img.path
  showImagePicker.value = false
}

function clearImage() {
  serviceForm.value.image_path = ''
}

// Image upload
async function uploadImage(file: File) {
  if (!file.type.startsWith('image/')) {
    alert('Bitte nur Bilddateien hochladen.')
    return
  }

  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await $fetch<{ path: string }>('/api/admin/uploads/image', {
      method: 'POST',
      body: formData,
    })
    serviceForm.value.image_path = result.path
    await loadImages()
    showImagePicker.value = false
  } catch (e) {
    console.error('Upload failed', e)
    alert('Upload fehlgeschlagen.')
  } finally {
    uploadLoading.value = false
  }
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    uploadImage(input.files[0])
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    uploadImage(file)
  }
}

function handleDragOver(event: DragEvent) {
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

// Delete unused image
async function deleteImage(img: ImageInfo) {
  if (img.used) {
    alert('Bild wird verwendet und kann nicht gelöscht werden.')
    return
  }
  if (!confirm(`Bild "${img.filename}" wirklich löschen?`)) return

  try {
    await $fetch(`/api/admin/images/${img.filename}`, {
      method: 'DELETE',
      body: { folder: img.folder },
    })
    await loadImages()
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Löschen fehlgeschlagen.')
  }
}

// Computed
const unusedImages = computed(() => images.value.filter(i => !i.used))
const usedImages = computed(() => images.value.filter(i => i.used))

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Dienstleistungen</h2>
      <button class="btn-primary" @click="startNewService">+ Neue Dienstleistung</button>
    </div>

    <!-- Service Editor Modal -->
    <div v-if="serviceEditing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
        <h3 class="text-lg font-semibold">{{ serviceEditing.id ? 'Bearbeiten' : 'Neue Dienstleistung' }}</h3>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Slug</label>
            <input v-model="serviceForm.slug" type="text" class="input" placeholder="z.b. kamerainstallation" />
          </div>
          <div>
            <label class="label">Icon</label>
            <input v-model="serviceForm.icon" type="text" class="input" placeholder="camera" />
          </div>
          <div>
            <label class="label">Titel (DE)</label>
            <input v-model="serviceForm.title_de" type="text" class="input" />
          </div>
          <div>
            <label class="label">Titel (EN)</label>
            <input v-model="serviceForm.title_en" type="text" class="input" />
          </div>
          <div>
            <label class="label">Kurzbeschreibung (DE)</label>
            <textarea v-model="serviceForm.summary_de" rows="2" class="input"></textarea>
          </div>
          <div>
            <label class="label">Kurzbeschreibung (EN)</label>
            <textarea v-model="serviceForm.summary_en" rows="2" class="input"></textarea>
          </div>
          <div class="sm:col-span-2">
            <label class="label">Beschreibung (DE)</label>
            <textarea v-model="serviceForm.body_de" rows="4" class="input"></textarea>
          </div>
          <div class="sm:col-span-2">
            <label class="label">Beschreibung (EN)</label>
            <textarea v-model="serviceForm.body_en" rows="4" class="input"></textarea>
          </div>

          <!-- Image Section -->
          <div class="sm:col-span-2">
            <label class="label">Bild</label>

            <!-- Current Image Preview -->
            <div v-if="serviceForm.image_path" class="mt-2 flex items-start gap-4">
              <img :src="serviceForm.image_path" :alt="serviceForm.title_de" class="h-32 w-48 rounded-lg border border-ink-200 object-cover" />
              <div class="flex flex-col gap-2">
                <span class="text-sm text-ink-500 break-all">{{ serviceForm.image_path }}</span>
                <div class="flex gap-2">
                  <button type="button" class="text-sm text-brand-600 hover:underline" @click="openImagePicker">Ändern</button>
                  <button type="button" class="text-sm text-red-600 hover:underline" @click="clearImage">Entfernen</button>
                </div>
              </div>
            </div>

            <!-- No Image -->
            <div v-else class="mt-2">
              <button type="button" class="btn-ghost border border-dashed border-ink-300 w-full py-8" @click="openImagePicker">
                <span class="text-ink-500">📷 Bild auswählen oder hochladen</span>
              </button>
            </div>
          </div>

          <div>
            <label class="label">Sortierung</label>
            <input v-model.number="serviceForm.sort_order" type="number" class="input" />
          </div>
          <div class="flex items-center gap-2">
            <input :checked="serviceForm.published === 1" @change="serviceForm.published = ($event.target as HTMLInputElement).checked ? 1 : 0" type="checkbox" id="service-published" class="h-4 w-4" />
            <label for="service-published" class="text-sm">Veröffentlicht</label>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button class="btn-ghost" @click="cancelServiceEdit">Abbrechen</button>
          <button class="btn-primary" :disabled="serviceLoading" @click="saveService">
            {{ serviceLoading ? 'Speichern...' : 'Speichern' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image Picker Modal -->
    <div v-if="showImagePicker" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Bild auswählen</h3>
          <button class="text-ink-500 hover:text-ink-700" @click="showImagePicker = false">✕</button>
        </div>

        <!-- Upload Zone -->
        <div
          class="mt-4 rounded-xl border-2 border-dashed p-8 text-center transition-colors"
          :class="isDragging ? 'border-brand-500 bg-brand-50' : 'border-ink-300'"
          @drop.prevent="handleDrop"
          @dragover.prevent="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <div v-if="uploadLoading" class="text-ink-500">
            Wird hochgeladen...
          </div>
          <div v-else>
            <p class="text-ink-600">Bild hierher ziehen oder</p>
            <label class="mt-2 inline-block cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
              Datei auswählen
              <input type="file" accept="image/*" class="hidden" @change="handleFileSelect" />
            </label>
          </div>
        </div>

        <!-- Image Gallery -->
        <div v-if="imagesLoading" class="mt-6 text-center text-ink-500">
          Bilder werden geladen...
        </div>
        <div v-else-if="images.length === 0" class="mt-6 text-center text-ink-500">
          Keine Bilder vorhanden.
        </div>
        <div v-else class="mt-6">
          <h4 class="text-sm font-medium text-ink-700">Vorhandene Bilder ({{ images.length }})</h4>
          <div class="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            <div
              v-for="img in images"
              :key="img.path"
              class="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:border-brand-500"
              :class="serviceForm.image_path === img.path ? 'border-brand-600 ring-2 ring-brand-300' : 'border-ink-200'"
              @click="selectImage(img)"
            >
              <img :src="img.path" :alt="img.filename" class="h-full w-full object-cover" />

              <!-- Overlay with info -->
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                <div class="w-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p class="text-xs text-white truncate">{{ img.filename }}</p>
                  <p class="text-xs text-white/70">{{ formatSize(img.size) }}</p>
                </div>
              </div>

              <!-- Used badge -->
              <span v-if="img.used" class="absolute top-1 right-1 rounded bg-green-600 px-1.5 py-0.5 text-[10px] text-white">
                Verwendet
              </span>

              <!-- Delete button for unused -->
              <button
                v-if="!img.used"
                class="absolute top-1 left-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="deleteImage(img)"
              >
                Löschen
              </button>

              <!-- Selected checkmark -->
              <div v-if="serviceForm.image_path === img.path" class="absolute top-1 right-1 rounded-full bg-brand-600 p-1">
                <svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Unused images info -->
          <p v-if="unusedImages.length > 0" class="mt-4 text-sm text-ink-500">
            {{ unusedImages.length }} unbenutzte Bilder können gelöscht werden (hover → "Löschen")
          </p>
        </div>
      </div>
    </div>

    <!-- Services List -->
    <div v-if="services.length === 0" class="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
      Noch keine Dienstleistungen erfasst.
    </div>
    <div v-else class="mt-6 space-y-3">
      <div v-for="s in services" :key="s.id" class="flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-4">
        <!-- Image thumbnail -->
        <img
          v-if="s.image_path"
          :src="s.image_path"
          :alt="s.title_de"
          class="h-16 w-24 rounded-lg object-cover border border-ink-100"
        />
        <div v-else class="h-16 w-24 rounded-lg bg-ink-100 flex items-center justify-center text-ink-400 text-xs">
          Kein Bild
        </div>

        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ s.title_de }}</span>
            <span v-if="!s.published" class="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-500">Entwurf</span>
          </div>
          <div class="text-sm text-ink-500">{{ s.slug }}</div>
        </div>
        <button class="text-sm text-brand-600 hover:underline" @click="editService(s)">Bearbeiten</button>
        <button class="text-sm text-red-600 hover:underline" @click="deleteService(s)">Löschen</button>
      </div>
    </div>
  </div>
</template>
