<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TeamMember } from '~/types/admin'

interface ImageInfo {
  path: string
  filename: string
  folder: string
  used: boolean
  size: number
}

const props = defineProps<{
  teamMembers: TeamMember[]
}>()

const emit = defineEmits<{
  'save': [member: Partial<TeamMember>, isNew: boolean]
  'delete': [member: TeamMember]
  'toggle-active': [member: TeamMember]
  'reorder': [memberIds: number[]]
  'reload': []
}>()

const memberEditing = ref<TeamMember | null>(null)
const memberForm = ref<Partial<TeamMember>>({})
const memberLoading = ref(false)

// Image management
const images = ref<ImageInfo[]>([])
const imagesLoading = ref(false)
const showImagePicker = ref(false)
const uploadLoading = ref(false)
const isDragging = ref(false)

// Drag & drop reordering
const draggedMember = ref<TeamMember | null>(null)
const dragOverMemberId = ref<number | null>(null)

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

function startNewMember() {
  memberForm.value = {
    first_name: '',
    last_name: '',
    position_de: '',
    position_en: '',
    slogan_de: '',
    slogan_en: '',
    image_path: '',
    sort_order: props.teamMembers.length * 10,
    active: 1,
  }
  memberEditing.value = {} as TeamMember
  loadImages()
}

function editMember(m: TeamMember) {
  memberForm.value = { ...m }
  memberEditing.value = m
  loadImages()
}

function cancelMemberEdit() {
  memberEditing.value = null
  memberForm.value = {}
  showImagePicker.value = false
}

async function saveMember() {
  memberLoading.value = true
  try {
    const isNew = !memberEditing.value?.id
    emit('save', { ...memberForm.value, id: memberEditing.value?.id }, isNew)
    cancelMemberEdit()
  } finally {
    memberLoading.value = false
  }
}

function deleteMember(m: TeamMember) {
  if (!confirm(`Teammitglied "${m.first_name} ${m.last_name}" wirklich löschen?`)) return
  emit('delete', m)
}

// Image picker
function openImagePicker() {
  loadImages()
  showImagePicker.value = true
}

function selectImage(img: ImageInfo) {
  memberForm.value.image_path = img.path
  showImagePicker.value = false
}

function clearImage() {
  memberForm.value.image_path = ''
}

// Image upload
async function uploadImage(file: File) {
  if (!file.type.startsWith('image/')) {
    alert('Bitte nur Bilddateien hochladen (JPG, PNG, WebP).')
    return
  }

  // Check file size before upload (15MB limit)
  const maxSize = 15 * 1024 * 1024
  if (file.size > maxSize) {
    alert(`Das Bild ist zu gross (${(file.size / 1024 / 1024).toFixed(1)} MB).\n\nMaximal erlaubt: 15 MB.\n\nBitte verkleinere das Bild vor dem Hochladen.`)
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
    memberForm.value.image_path = result.path
    await loadImages()
    showImagePicker.value = false
  } catch (e: any) {
    console.error('Upload failed', e)

    // User-friendly error messages
    const status = e?.response?.status || e?.data?.statusCode
    const serverMsg = e?.data?.statusMessage || ''

    let userMsg = 'Das Bild konnte nicht hochgeladen werden.'

    if (status === 413 || serverMsg.includes('gross')) {
      userMsg = 'Das Bild ist zu gross. Bitte verwende ein kleineres Bild (max. 15 MB).'
    } else if (status === 415 || serverMsg.includes('Format') || serverMsg.includes('erkannt')) {
      userMsg = 'Dieses Bildformat wird nicht unterstützt.\n\nErlaubt: JPG, PNG, WebP, GIF'
    } else if (status === 401) {
      userMsg = 'Du bist nicht mehr angemeldet. Bitte lade die Seite neu und melde dich erneut an.'
    } else if (status === 429) {
      userMsg = 'Zu viele Uploads. Bitte warte einen Moment und versuche es erneut.'
    } else if (e?.message?.includes('fetch') || e?.message?.includes('network')) {
      userMsg = 'Verbindungsproblem. Bitte prüfe deine Internetverbindung und versuche es erneut.'
    }

    alert(userMsg)
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

function handleDragOver() {
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

// Drag & drop reordering
function onDragStart(member: TeamMember) {
  draggedMember.value = member
}

function onDragEnd() {
  draggedMember.value = null
  dragOverMemberId.value = null
}

function onDragOverMember(event: DragEvent, member: TeamMember) {
  event.preventDefault()
  if (draggedMember.value && draggedMember.value.id !== member.id) {
    dragOverMemberId.value = member.id
  }
}

function onDropMember(targetMember: TeamMember) {
  if (!draggedMember.value || draggedMember.value.id === targetMember.id) return

  const currentIds = props.teamMembers.map(m => m.id)
  const draggedIndex = currentIds.indexOf(draggedMember.value.id)
  const targetIndex = currentIds.indexOf(targetMember.id)

  // Reorder
  currentIds.splice(draggedIndex, 1)
  currentIds.splice(targetIndex, 0, draggedMember.value.id)

  emit('reorder', currentIds)
  draggedMember.value = null
  dragOverMemberId.value = null
}

// Helpers
function getInitials(member: TeamMember | Partial<TeamMember>): string {
  const first = member.first_name?.charAt(0) || ''
  const last = member.last_name?.charAt(0) || ''
  return `${first}${last}`.toUpperCase() || '?'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const sortedMembers = computed(() => {
  return [...props.teamMembers].sort((a, b) => a.sort_order - b.sort_order)
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Team</h2>
      <button class="btn-primary" @click="startNewMember">+ Neues Teammitglied</button>
    </div>

    <!-- Member Editor Modal -->
    <div v-if="memberEditing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
        <h3 class="text-lg font-semibold">{{ memberEditing.id ? 'Bearbeiten' : 'Neues Teammitglied' }}</h3>

        <!-- Preview -->
        <div class="mt-4 flex items-center gap-4 rounded-xl bg-ink-50 p-4">
          <div class="relative h-16 w-16 overflow-hidden rounded-xl bg-ink-200">
            <img
              v-if="memberForm.image_path"
              :src="memberForm.image_path"
              :alt="memberForm.first_name"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700"
            >
              <span class="text-lg font-bold text-white">{{ getInitials(memberForm) }}</span>
            </div>
          </div>
          <div>
            <div class="font-medium">
              {{ memberForm.first_name || 'Vorname' }} {{ memberForm.last_name || 'Nachname' }}
            </div>
            <div class="text-sm text-brand-600">{{ memberForm.position_de || 'Position' }}</div>
            <div v-if="memberForm.slogan_de" class="text-sm italic text-ink-500">"{{ memberForm.slogan_de }}"</div>
          </div>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Vorname *</label>
            <input v-model="memberForm.first_name" type="text" class="input" placeholder="Max" />
          </div>
          <div>
            <label class="label">Nachname *</label>
            <input v-model="memberForm.last_name" type="text" class="input" placeholder="Muster" />
          </div>
          <div>
            <label class="label">Position (DE) *</label>
            <input v-model="memberForm.position_de" type="text" class="input" placeholder="z.B. Geschäftsleitung" />
          </div>
          <div>
            <label class="label">Position (EN)</label>
            <input v-model="memberForm.position_en" type="text" class="input" placeholder="z.B. Managing Director" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Persönlicher Slogan (DE)</label>
            <input v-model="memberForm.slogan_de" type="text" class="input" placeholder="z.B. Sicherheit ist unsere Leidenschaft" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Persönlicher Slogan (EN)</label>
            <input v-model="memberForm.slogan_en" type="text" class="input" placeholder="z.B. Security is our passion" />
          </div>

          <!-- Image Section -->
          <div class="sm:col-span-2">
            <label class="label">Bild</label>

            <!-- Current Image Preview -->
            <div
              v-if="memberForm.image_path"
              class="mt-2 flex items-start gap-4 rounded-lg border-2 border-dashed p-3 transition-colors"
              :class="isDragging ? 'border-brand-500 bg-brand-50' : 'border-transparent'"
              @drop.prevent="handleDrop"
              @dragover.prevent="handleDragOver"
              @dragleave="handleDragLeave"
            >
              <img :src="memberForm.image_path" :alt="memberForm.first_name" class="h-24 w-24 rounded-xl border border-ink-200 object-cover" />
              <div class="flex flex-col gap-2">
                <span class="text-sm text-ink-500 break-all">{{ memberForm.image_path }}</span>
                <div class="flex gap-2">
                  <button type="button" class="text-sm text-brand-600 hover:underline" @click="openImagePicker">Ändern</button>
                  <button type="button" class="text-sm text-red-600 hover:underline" @click="clearImage">Entfernen</button>
                </div>
                <span v-if="isDragging" class="text-sm text-brand-600">Bild hier ablegen...</span>
                <span v-else class="text-xs text-ink-400">Oder neues Bild hierher ziehen</span>
              </div>
            </div>

            <!-- No Image - Drop Zone -->
            <div
              v-else
              class="mt-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer"
              :class="isDragging ? 'border-brand-500 bg-brand-50' : 'border-ink-300 hover:border-ink-400'"
              @drop.prevent="handleDrop"
              @dragover.prevent="handleDragOver"
              @dragleave="handleDragLeave"
              @click="openImagePicker"
            >
              <div v-if="uploadLoading" class="text-ink-500">Wird hochgeladen...</div>
              <div v-else-if="isDragging" class="text-brand-600">Bild hier ablegen...</div>
              <div v-else>
                <svg class="mx-auto h-10 w-10 text-ink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p class="mt-2 text-sm text-ink-600">Bild hierher ziehen</p>
                <p class="text-xs text-ink-400">oder klicken zum Auswählen (optional)</p>
              </div>
            </div>
          </div>

          <div>
            <label class="label">Sortierung</label>
            <input v-model.number="memberForm.sort_order" type="number" class="input" />
          </div>
          <div class="flex items-center gap-2">
            <input :checked="memberForm.active === 1" @change="memberForm.active = ($event.target as HTMLInputElement).checked ? 1 : 0" type="checkbox" id="member-active" class="h-4 w-4" />
            <label for="member-active" class="text-sm">Aktiv (sichtbar auf der Webseite)</label>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button class="btn-ghost" @click="cancelMemberEdit">Abbrechen</button>
          <button
            class="btn-primary"
            :disabled="memberLoading || !memberForm.first_name || !memberForm.last_name || !memberForm.position_de"
            @click="saveMember"
          >
            {{ memberLoading ? 'Speichern...' : 'Speichern' }}
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
              :class="memberForm.image_path === img.path ? 'border-brand-600 ring-2 ring-brand-300' : 'border-ink-200'"
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

              <!-- Selected checkmark -->
              <div v-if="memberForm.image_path === img.path" class="absolute top-1 right-1 rounded-full bg-brand-600 p-1">
                <svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Team List -->
    <div v-if="teamMembers.length === 0" class="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
      Noch keine Teammitglieder erfasst.
    </div>
    <div v-else class="mt-6">
      <p class="text-sm text-ink-500 mb-3">Reihenfolge per Drag & Drop ändern</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="m in sortedMembers"
          :key="m.id"
          class="rounded-xl border bg-white overflow-hidden transition-all cursor-move"
          :class="[
            dragOverMemberId === m.id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-ink-200',
            draggedMember?.id === m.id ? 'opacity-50' : ''
          ]"
          draggable="true"
          @dragstart="onDragStart(m)"
          @dragend="onDragEnd"
          @dragover="onDragOverMember($event, m)"
          @drop="onDropMember(m)"
        >
          <!-- Image / Initials -->
          <div class="relative aspect-square overflow-hidden bg-ink-100">
            <img
              v-if="m.image_path"
              :src="m.image_path"
              :alt="m.first_name"
              class="h-full w-full object-cover object-top"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700"
            >
              <span class="text-2xl font-bold text-white">{{ getInitials(m) }}</span>
            </div>

            <!-- Inactive badge -->
            <div v-if="!m.active" class="absolute top-2 left-2 rounded bg-ink-800/70 px-2 py-0.5 text-xs text-white">
              Inaktiv
            </div>

            <!-- Drag indicator -->
            <div class="absolute top-2 right-2 rounded bg-white/80 p-1 text-ink-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="p-3">
            <h4 class="font-medium text-sm truncate" :class="m.active ? 'text-ink-900' : 'text-ink-500'">
              {{ m.first_name }} {{ m.last_name }}
            </h4>
            <p class="text-xs text-brand-600 truncate">{{ m.position_de }}</p>

            <!-- Actions -->
            <div class="mt-2 flex items-center gap-1">
              <button
                class="text-xs px-2 py-1 rounded flex-1"
                :class="m.active ? 'bg-ink-100 text-ink-600 hover:bg-ink-200' : 'bg-brand-100 text-brand-700 hover:bg-brand-200'"
                @click="emit('toggle-active', m)"
              >
                {{ m.active ? 'Deaktivieren' : 'Aktivieren' }}
              </button>
              <button
                class="p-1.5 rounded bg-ink-100 text-ink-600 hover:bg-ink-200"
                title="Bearbeiten"
                @click="editMember(m)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                class="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
                title="Löschen"
                @click="deleteMember(m)"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
