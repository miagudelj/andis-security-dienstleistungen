<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Offer } from '~/types/admin'
import {
  OFFER_STATUS_OPTIONS,
  DATE_RANGE_OPTIONS,
  getStatusOption,
  getDateRangeStart,
  parseStepsData,
  getConsultationType,
  CONSULTATION_TYPE_LABELS,
} from '~/types/admin'

const props = defineProps<{
  offers: Offer[]
  newOfferAlert: boolean
}>()

const emit = defineEmits<{
  'update:newOfferAlert': [value: boolean]
  'update-status': [offer: Offer, status: string]
  'update-assignee': [offer: Offer, assignee: string]
  'update-notes': [offer: Offer, notes: string]
}>()

// Pagination
const currentPage = ref(1)
const pageSize = ref(25)
const PAGE_SIZE_OPTIONS = [25, 50, 100]

// Swiss date format (DD.MM.YYYY)
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Filters
const offerSearch = ref('')
const offerStatusFilter = ref<string>('all')
const offerDateRange = ref<string>('all')
const viewMode = ref<'table' | 'cards'>('table')

// Detail modal
const selectedOffer = ref<Offer | null>(null)

// Reset page when filters change
watch([offerSearch, offerStatusFilter, offerDateRange], () => {
  currentPage.value = 1
})

// Filter offers by date range first
const dateFilteredOffers = computed(() => {
  const rangeStart = getDateRangeStart(offerDateRange.value)
  if (!rangeStart) return props.offers
  return props.offers.filter(o => new Date(o.created_at) >= rangeStart)
})

// Then apply status and search filters
const filteredOffers = computed(() => {
  let result = dateFilteredOffers.value

  if (offerStatusFilter.value !== 'all') {
    if (offerStatusFilter.value === 'active') {
      result = result.filter(o => !['accepted', 'rejected', 'cancelled'].includes(o.status))
    } else if (offerStatusFilter.value === 'closed') {
      result = result.filter(o => ['accepted', 'rejected', 'cancelled'].includes(o.status))
    } else {
      result = result.filter(o => o.status === offerStatusFilter.value)
    }
  }

  if (offerSearch.value.trim()) {
    const search = offerSearch.value.toLowerCase().trim()
    result = result.filter(o =>
      o.reference.toLowerCase().includes(search) ||
      o.first_name.toLowerCase().includes(search) ||
      o.last_name.toLowerCase().includes(search) ||
      o.email.toLowerCase().includes(search) ||
      o.phone.includes(search) ||
      o.city.toLowerCase().includes(search) ||
      o.zip.includes(search) ||
      (o.assigned_to && o.assigned_to.toLowerCase().includes(search)) ||
      (o.notes && o.notes.toLowerCase().includes(search))
    )
  }

  return result
})

// Paginated offers
const totalPages = computed(() => Math.ceil(filteredOffers.value.length / pageSize.value))
const paginatedOffers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredOffers.value.slice(start, start + pageSize.value)
})

// Stats per status
const statsPerStatus = computed(() => {
  const counts: Record<string, number> = {}
  for (const opt of OFFER_STATUS_OPTIONS) {
    counts[opt.value] = dateFilteredOffers.value.filter(o => o.status === opt.value).length
  }
  return counts
})

function resetFilters() {
  offerSearch.value = ''
  offerStatusFilter.value = 'all'
  currentPage.value = 1
}

function handleStatusChange(offer: Offer, event: Event) {
  const value = (event.target as HTMLSelectElement).value
  emit('update-status', offer, value)
}

function handleAssigneeChange(offer: Offer, event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update-assignee', offer, value)
}

function handleNotesChange(offer: Offer, event: Event) {
  const value = (event.target as HTMLTextAreaElement).value
  emit('update-notes', offer, value)
}

function openDetails(offer: Offer) {
  selectedOffer.value = offer
}

function closeDetails() {
  selectedOffer.value = null
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}
</script>

<template>
  <div>
    <!-- Quick Stats -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="opt in OFFER_STATUS_OPTIONS"
        :key="opt.value"
        class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
        :class="offerStatusFilter === opt.value
          ? 'border-brand-500 bg-brand-50'
          : 'border-ink-200 bg-white hover:border-ink-300'"
        @click="offerStatusFilter = offerStatusFilter === opt.value ? 'all' : opt.value"
      >
        <span :class="opt.color" class="rounded px-1.5 py-0.5 text-xs font-bold tabular-nums">
          {{ statsPerStatus[opt.value] }}
        </span>
        <span class="text-ink-600">{{ opt.label }}</span>
      </button>
    </div>

    <!-- New offer alert -->
    <div v-if="newOfferAlert" class="mt-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-800">
      <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
      Neue Offerte eingegangen!
      <button class="ml-auto text-green-600 hover:underline" @click="emit('update:newOfferAlert', false)">×</button>
    </div>

    <!-- Filters Row -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <!-- Left: Search -->
      <div class="relative min-w-[200px] max-w-xs">
        <svg class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="offerSearch"
          type="text"
          placeholder="Suchen..."
          class="w-full rounded-lg border border-ink-200 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <!-- Right: Controls -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-ink-500">
          {{ filteredOffers.length }} Ergebnisse
          <button v-if="offerSearch || offerStatusFilter !== 'all'" class="ml-1 text-brand-600 hover:underline" @click="resetFilters">(×)</button>
        </span>
        <select
          v-model="offerDateRange"
          class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <select
          v-model="pageSize"
          class="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        >
          <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">{{ size }}/Seite</option>
        </select>
        <div class="flex rounded-lg border border-ink-200 bg-white p-0.5">
          <button
            class="rounded-md px-2 py-1 transition-colors"
            :class="viewMode === 'table' ? 'bg-brand-100 text-brand-700' : 'text-ink-500 hover:text-ink-700'"
            @click="viewMode = 'table'"
            title="Tabelle"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button
            class="rounded-md px-2 py-1 transition-colors"
            :class="viewMode === 'cards' ? 'bg-brand-100 text-brand-700' : 'text-ink-500 hover:text-ink-700'"
            @click="viewMode = 'cards'"
            title="Karten"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-if="viewMode === 'table'" class="mt-4 overflow-x-auto rounded-lg border border-ink-200 bg-white">
      <table class="w-full text-sm">
        <thead class="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500 border-b border-ink-200">
          <tr>
            <th class="px-3 py-2.5 font-medium">Referenz</th>
            <th class="px-3 py-2.5 font-medium">Kunde</th>
            <th class="px-3 py-2.5 font-medium">Ort</th>
            <th class="px-3 py-2.5 font-medium">Beratung</th>
            <th class="px-3 py-2.5 font-medium">Status</th>
            <th class="px-3 py-2.5 font-medium">Zuständig</th>
            <th class="px-3 py-2.5 font-medium">Datum</th>
            <th class="px-3 py-2.5 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody v-if="paginatedOffers.length > 0">
          <tr
            v-for="o in paginatedOffers"
            :key="o.id"
            class="border-b border-ink-100 last:border-0 hover:bg-ink-50/50 cursor-pointer"
            @click="openDetails(o)"
          >
            <td class="px-3 py-2">
              <div class="flex items-center gap-1">
                <span class="font-mono text-xs text-ink-600">{{ o.reference }}</span>
                <span v-if="o.notes" class="text-amber-500 text-xs" title="Hat Notizen">●</span>
              </div>
            </td>
            <td class="px-3 py-2">
              <div class="font-medium text-ink-900">{{ o.first_name }} {{ o.last_name }}</div>
              <div class="text-xs text-ink-400 truncate max-w-[150px]">{{ o.email }}</div>
            </td>
            <td class="px-3 py-2 text-ink-600">{{ o.zip }} {{ o.city }}</td>
            <td class="px-3 py-2">
              <span v-if="getConsultationType(o)" :class="CONSULTATION_TYPE_LABELS[getConsultationType(o)!].color" class="rounded px-1.5 py-0.5 text-xs font-medium">
                {{ CONSULTATION_TYPE_LABELS[getConsultationType(o)!].de }}
              </span>
              <span v-else class="text-ink-300">–</span>
            </td>
            <td class="px-3 py-2">
              <span :class="getStatusOption(o.status).color" class="rounded px-1.5 py-0.5 text-xs font-medium">
                {{ getStatusOption(o.status).label }}
              </span>
            </td>
            <td class="px-3 py-2 text-ink-600">{{ o.assigned_to || '–' }}</td>
            <td class="px-3 py-2 text-xs text-ink-400">{{ formatDate(o.created_at) }}</td>
            <td class="px-3 py-2 text-right">
              <svg class="h-4 w-4 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="8" class="px-3 py-8 text-center text-ink-400">
              Keine Offerten gefunden.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Card View -->
    <div v-else class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="o in paginatedOffers"
        :key="o.id"
        class="rounded-lg border border-ink-200 bg-white p-4 cursor-pointer hover:border-ink-300 hover:shadow-sm transition-all"
        @click="openDetails(o)"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <span class="font-mono text-xs text-ink-500">{{ o.reference }}</span>
          <span v-if="o.notes" class="text-amber-500 text-xs" title="Hat Notizen">●</span>
        </div>
        <div class="font-medium text-ink-900">{{ o.first_name }} {{ o.last_name }}</div>
        <div class="text-sm text-ink-500 mt-0.5">{{ o.zip }} {{ o.city }}</div>
        <div class="flex flex-wrap items-center gap-1.5 mt-3">
          <span :class="getStatusOption(o.status).color" class="rounded px-1.5 py-0.5 text-xs font-medium">
            {{ getStatusOption(o.status).label }}
          </span>
          <span v-if="getConsultationType(o)" :class="CONSULTATION_TYPE_LABELS[getConsultationType(o)!].color" class="rounded px-1.5 py-0.5 text-xs font-medium">
            {{ CONSULTATION_TYPE_LABELS[getConsultationType(o)!].de }}
          </span>
          <span v-if="o.assigned_to" class="rounded bg-ink-100 px-1.5 py-0.5 text-xs text-ink-600">{{ o.assigned_to }}</span>
        </div>
        <div class="text-xs text-ink-400 mt-3">{{ formatDate(o.created_at) }}</div>
      </div>
      <div v-if="paginatedOffers.length === 0" class="sm:col-span-2 lg:col-span-3 rounded-lg border border-dashed border-ink-300 p-8 text-center text-ink-400">
        Keine Offerten gefunden.
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
      <span class="text-sm text-ink-500">
        Seite {{ currentPage }} von {{ totalPages }}
      </span>
      <div class="flex items-center gap-1">
        <button
          class="rounded px-2 py-1 text-sm hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="goToPage(1)"
        >««</button>
        <button
          class="rounded px-2 py-1 text-sm hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >«</button>
        <template v-for="page in Math.min(5, totalPages)" :key="page">
          <button
            v-if="page + Math.max(0, currentPage - 3) <= totalPages"
            class="rounded px-2.5 py-1 text-sm"
            :class="currentPage === page + Math.max(0, currentPage - 3)
              ? 'bg-brand-600 text-white'
              : 'hover:bg-ink-100'"
            @click="goToPage(page + Math.max(0, currentPage - 3))"
          >
            {{ page + Math.max(0, currentPage - 3) }}
          </button>
        </template>
        <button
          class="rounded px-2 py-1 text-sm hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >»</button>
        <button
          class="rounded px-2 py-1 text-sm hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages"
          @click="goToPage(totalPages)"
        >»»</button>
      </div>
    </div>

    <!-- Detail Slide-Over -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="selectedOffer" class="fixed inset-0 z-50 bg-black/30" @click="closeDetails">
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-x-0"
            leave-to-class="translate-x-full"
          >
            <div
              v-if="selectedOffer"
              class="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto"
              @click.stop
            >
              <!-- Header -->
              <div class="sticky top-0 z-10 flex items-center justify-between border-b border-ink-200 bg-white px-5 py-4">
                <div>
                  <div class="font-mono text-sm text-ink-500">{{ selectedOffer.reference }}</div>
                  <div class="text-lg font-semibold text-ink-900">{{ selectedOffer.first_name }} {{ selectedOffer.last_name }}</div>
                </div>
                <button class="rounded-lg p-2 hover:bg-ink-100" @click="closeDetails">
                  <svg class="h-5 w-5 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <!-- Content -->
              <div class="p-5 space-y-6">
                <!-- Status & Assignment -->
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="block text-xs font-medium text-ink-500 mb-1">Status</label>
                    <select
                      :value="selectedOffer.status"
                      class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      @change="handleStatusChange(selectedOffer, $event)"
                    >
                      <option v-for="opt in OFFER_STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-ink-500 mb-1">Zuständig</label>
                    <input
                      type="text"
                      :value="selectedOffer.assigned_to"
                      placeholder="Name..."
                      class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      @change="handleAssigneeChange(selectedOffer, $event)"
                    />
                  </div>
                </div>

                <!-- Notes -->
                <div>
                  <label class="block text-xs font-medium text-ink-500 mb-1">Interne Notizen</label>
                  <textarea
                    :value="selectedOffer.notes || ''"
                    rows="3"
                    placeholder="Rückrufzeiten, Termine..."
                    class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    @change="handleNotesChange(selectedOffer, $event)"
                  />
                </div>

                <!-- Contact Info -->
                <div class="rounded-lg border border-ink-200 p-4">
                  <h4 class="text-xs font-medium text-ink-500 mb-3">Kontakt</h4>
                  <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2">
                      <svg class="h-4 w-4 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <a :href="`tel:${selectedOffer.phone}`" class="text-brand-600 hover:underline">{{ selectedOffer.phone }}</a>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg class="h-4 w-4 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <a :href="`mailto:${selectedOffer.email}`" class="text-brand-600 hover:underline">{{ selectedOffer.email }}</a>
                    </div>
                    <div class="flex gap-2">
                      <svg class="h-4 w-4 text-ink-400 shrink-0 mt-[3px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span class="text-ink-700">{{ selectedOffer.street }}<br>{{ selectedOffer.zip }} {{ selectedOffer.city }}</span>
                    </div>
                  </div>
                </div>

                <!-- Consultation Type -->
                <div v-if="getConsultationType(selectedOffer)" class="rounded-lg border border-ink-200 p-4">
                  <h4 class="text-xs font-medium text-ink-500 mb-2">Beratungsart</h4>
                  <span :class="CONSULTATION_TYPE_LABELS[getConsultationType(selectedOffer)!].color" class="rounded px-2 py-1 text-sm font-medium">
                    {{ CONSULTATION_TYPE_LABELS[getConsultationType(selectedOffer)!].de }}
                  </span>
                </div>

                <!-- Wizard Steps Data -->
                <template v-if="selectedOffer.devices && selectedOffer.devices.length > 0">
                  <div class="rounded-lg border border-ink-200 p-4">
                    <h4 class="text-xs font-medium text-ink-500 mb-3">Geräte</h4>
                    <div class="space-y-1">
                      <div v-for="d in selectedOffer.devices" :key="d.slug" class="flex justify-between text-sm">
                        <span class="text-ink-700">{{ d.slug }}</span>
                        <span class="text-ink-500">× {{ d.quantity }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="selectedOffer.locations?.length" class="rounded-lg border border-ink-200 p-4">
                    <h4 class="text-xs font-medium text-ink-500 mb-3">Standorte</h4>
                    <div class="flex flex-wrap gap-1">
                      <span v-for="l in selectedOffer.locations" :key="l" class="rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-700">{{ l }}</span>
                    </div>
                  </div>
                </template>
                <template v-else-if="parseStepsData(selectedOffer)">
                  <div v-for="(stepData, stepSlug) in parseStepsData(selectedOffer)" :key="stepSlug as string" class="rounded-lg border border-ink-200 p-4">
                    <h4 class="text-xs font-medium text-ink-500 mb-3">{{ stepSlug }}</h4>
                    <div v-if="stepData.selections" class="flex flex-wrap gap-1">
                      <span v-for="sel in stepData.selections" :key="sel.slug" class="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">
                        {{ sel.slug }}<span v-if="sel.quantity" class="text-brand-500"> × {{ sel.quantity }}</span>
                      </span>
                    </div>
                    <div v-else-if="stepData.value" class="text-sm text-ink-700">{{ stepData.value }}</div>
                    <div v-else-if="stepData.contact" class="space-y-1 text-sm">
                      <div v-for="(val, key) in stepData.contact" :key="key as string" class="text-ink-700">
                        <span class="text-ink-500">{{ key }}:</span> {{ val }}
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Customer Message -->
                <div v-if="selectedOffer.message" class="rounded-lg border border-ink-200 p-4">
                  <h4 class="text-xs font-medium text-ink-500 mb-2">Nachricht vom Kunden</h4>
                  <p class="text-sm text-ink-700 whitespace-pre-line">{{ selectedOffer.message }}</p>
                </div>

                <!-- Meta -->
                <div class="text-xs text-ink-400 pt-4 border-t border-ink-100">
                  Erstellt am {{ formatDate(selectedOffer.created_at) }}
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
