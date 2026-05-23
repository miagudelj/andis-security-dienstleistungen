<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Offer } from '~/types/admin'
import {
  OFFER_STATUS_OPTIONS,
  DATE_RANGE_OPTIONS,
  getStatusOption,
  getDateRangeStart,
  parseStepsData,
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

// Local state
const offerSearch = ref('')
const offerStatusFilter = ref<string>('all')
const offerDateRange = ref<string>('week')
const offerViewMode = ref<'cards' | 'table'>('cards')

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

// Stats per status
const statsPerStatus = computed(() => {
  const counts: Record<string, number> = {}
  for (const opt of OFFER_STATUS_OPTIONS) {
    counts[opt.value] = dateFilteredOffers.value.filter(o => o.status === opt.value).length
  }
  return counts
})
const statsTotalOffers = computed(() => dateFilteredOffers.value.length)

const filteredActiveOffers = computed(() =>
  filteredOffers.value.filter(o => !['accepted', 'rejected', 'cancelled'].includes(o.status))
)
const filteredClosedOffers = computed(() =>
  filteredOffers.value.filter(o => ['accepted', 'rejected', 'cancelled'].includes(o.status))
)

function resetFilters() {
  offerSearch.value = ''
  offerStatusFilter.value = 'all'
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
</script>

<template>
  <div>
    <!-- Stats Cards -->
    <div class="flex flex-wrap gap-3">
      <button
        v-for="opt in OFFER_STATUS_OPTIONS"
        :key="opt.value"
        class="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
        :class="offerStatusFilter === opt.value
          ? 'border-brand-500 bg-brand-50'
          : 'border-ink-200 bg-white hover:border-ink-300'"
        @click="offerStatusFilter = offerStatusFilter === opt.value ? 'all' : opt.value"
      >
        <span :class="opt.color" class="rounded-lg px-2.5 py-1 text-sm font-bold">
          {{ statsPerStatus[opt.value] }}
        </span>
        <span class="text-sm text-ink-700">{{ opt.label }}</span>
      </button>
      <div class="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
        <span class="text-lg font-bold text-ink-900">{{ statsTotalOffers }}</span>
        <span class="text-sm text-ink-500">Gesamt</span>
      </div>
    </div>

    <!-- New offer alert -->
    <div v-if="newOfferAlert" class="mt-6 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
      <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
      Neue Offerte eingegangen!
      <button class="ml-auto text-green-600 hover:underline" @click="emit('update:newOfferAlert', false)">x</button>
    </div>

    <!-- Filters -->
    <div class="mt-6 flex flex-wrap items-center gap-4">
      <h2 class="text-lg font-semibold">Offerten</h2>

      <!-- Search -->
      <div class="relative flex-1 min-w-[200px] max-w-sm">
        <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="offerSearch"
          type="text"
          placeholder="Suchen..."
          class="w-full rounded-lg border border-ink-200 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2 ml-auto">
        <!-- View mode toggle -->
        <div class="flex rounded-lg border border-ink-200 bg-white p-0.5">
          <button
            class="rounded-md px-2 py-1 text-xs font-medium transition-colors"
            :class="offerViewMode === 'cards' ? 'bg-brand-100 text-brand-700' : 'text-ink-500 hover:text-ink-700'"
            @click="offerViewMode = 'cards'"
            title="Karten-Ansicht"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </button>
          <button
            class="rounded-md px-2 py-1 text-xs font-medium transition-colors"
            :class="offerViewMode === 'table' ? 'bg-brand-100 text-brand-700' : 'text-ink-500 hover:text-ink-700'"
            @click="offerViewMode = 'table'"
            title="Tabellen-Ansicht"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
        <!-- Date range filter -->
        <select
          v-model="offerDateRange"
          class="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option v-for="opt in DATE_RANGE_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Results count -->
    <p class="mt-4 text-sm text-ink-500">
      {{ filteredOffers.length }} Offerten
      <span v-if="offerSearch || offerStatusFilter !== 'all'" class="ml-1">
        <button class="text-brand-600 hover:underline" @click="resetFilters">Filter zurucksetzen</button>
      </span>
    </p>

    <!-- No offers -->
    <div v-if="offers.length === 0" class="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
      Noch keine Offerten eingegangen.
    </div>

    <!-- No results -->
    <div v-else-if="filteredOffers.length === 0" class="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
      Keine Offerten gefunden.
      <button class="ml-2 text-brand-600 hover:underline" @click="resetFilters">Filter zurucksetzen</button>
    </div>

    <!-- TABLE VIEW -->
    <div v-else-if="offerViewMode === 'table'" class="mt-4 overflow-x-auto rounded-xl border border-ink-200 bg-white">
      <table class="w-full text-sm">
        <thead class="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
          <tr>
            <th class="px-4 py-3">Referenz</th>
            <th class="px-4 py-3">Kunde</th>
            <th class="px-4 py-3">Ort</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Zustandig</th>
            <th class="px-4 py-3">Erstellt</th>
            <th class="px-4 py-3 text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in filteredOffers" :key="o.id" class="border-t border-ink-100 hover:bg-ink-50/50">
            <td class="px-4 py-3">
              <span class="font-mono text-xs text-ink-600">{{ o.reference }}</span>
              <span v-if="o.notes" class="ml-1 text-ink-400" title="Hat Notizen">*</span>
            </td>
            <td class="px-4 py-3">
              <div class="font-medium text-ink-900">{{ o.first_name }} {{ o.last_name }}</div>
              <div class="text-xs text-ink-500">{{ o.email }}</div>
            </td>
            <td class="px-4 py-3 text-ink-600">{{ o.zip }} {{ o.city }}</td>
            <td class="px-4 py-3">
              <select
                :value="o.status"
                :class="getStatusOption(o.status).color"
                class="rounded-full border-0 px-2 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                @change="handleStatusChange(o, $event)"
              >
                <option v-for="opt in OFFER_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </td>
            <td class="px-4 py-3">
              <input
                type="text"
                :value="o.assigned_to"
                placeholder="-"
                class="w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-ink-600 hover:border-ink-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                @change="handleAssigneeChange(o, $event)"
              />
            </td>
            <td class="px-4 py-3 text-xs text-ink-500">{{ o.created_at }}</td>
            <td class="px-4 py-3 text-right">
              <details class="relative inline-block">
                <summary class="cursor-pointer text-brand-700 hover:underline">Details</summary>
                <div class="absolute right-0 top-6 z-10 w-80 rounded-lg border border-ink-200 bg-white p-4 shadow-lg text-left">
                  <template v-if="o.devices && o.devices.length > 0">
                    <div class="text-xs font-medium text-ink-500 mb-2">Gerate & Standorte</div>
                    <ul class="text-xs text-ink-600 space-y-1">
                      <li v-for="d in o.devices" :key="d.slug">{{ d.slug }} x {{ d.quantity }}</li>
                    </ul>
                    <div class="mt-2">
                      <span v-for="l in o.locations" :key="l" class="mr-1 inline-block rounded bg-ink-100 px-1.5 py-0.5 text-xs">{{ l }}</span>
                    </div>
                  </template>
                  <template v-else-if="parseStepsData(o)">
                    <div v-for="(stepData, stepSlug) in parseStepsData(o)" :key="stepSlug as string" class="mb-2">
                      <div class="text-xs font-medium text-ink-500">{{ stepSlug }}</div>
                      <div v-if="stepData.selections" class="text-xs text-ink-600">
                        <span v-for="sel in stepData.selections" :key="sel.slug" class="mr-1 inline-block rounded bg-ink-100 px-1.5 py-0.5">
                          {{ sel.slug }}<span v-if="sel.quantity"> x {{ sel.quantity }}</span>
                        </span>
                      </div>
                      <div v-else-if="stepData.value" class="text-xs text-ink-600">{{ stepData.value }}</div>
                    </div>
                  </template>
                  <div class="mt-3 pt-3 border-t border-ink-100">
                    <div class="text-xs">
                      <a :href="`tel:${o.phone}`" class="text-brand-600 hover:underline">{{ o.phone }}</a>
                    </div>
                    <div v-if="o.message" class="mt-2 text-xs text-ink-600 italic">"{{ o.message.slice(0, 100) }}{{ o.message.length > 100 ? '...' : '' }}"</div>
                  </div>
                  <textarea
                    :value="o.notes || ''"
                    rows="2"
                    placeholder="Notizen..."
                    class="mt-3 w-full rounded border border-ink-200 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
                    @change="handleNotesChange(o, $event)"
                  />
                </div>
              </details>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CARDS VIEW -->
    <div v-else class="mt-4 space-y-6">
      <!-- Active offers -->
      <div v-if="filteredActiveOffers.length > 0">
        <h3 class="mb-3 flex items-center gap-2 text-sm font-medium text-ink-700">
          <span class="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
          Aktiv ({{ filteredActiveOffers.length }})
        </h3>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <details v-for="o in filteredActiveOffers" :key="o.id" class="group rounded-xl border border-ink-200 bg-white">
            <summary class="flex cursor-pointer flex-col gap-2 px-4 py-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-mono text-ink-500">{{ o.reference }}</span>
                <span class="text-xs text-ink-400">{{ o.created_at }}</span>
              </div>
              <div class="font-medium text-ink-900">{{ o.first_name }} {{ o.last_name }}</div>
              <div class="text-sm text-ink-500">{{ o.zip }} {{ o.city }}</div>
              <div class="flex flex-wrap items-center gap-1.5 mt-1">
                <span :class="getStatusOption(o.status).color" class="rounded-full px-2 py-0.5 text-xs font-medium">
                  {{ getStatusOption(o.status).label }}
                </span>
                <span v-if="o.assigned_to" class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{{ o.assigned_to }}</span>
                <span v-if="o.notes" class="text-ink-400 text-xs" title="Hat Notizen">Notiz</span>
              </div>
            </summary>
            <div class="border-t border-ink-100 px-5 py-4 text-sm">
              <div class="mb-4 grid gap-3 rounded-lg bg-ink-50 p-4 sm:grid-cols-2">
                <div>
                  <label class="text-xs font-medium text-ink-600">Status</label>
                  <select
                    :value="o.status"
                    class="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    @change="handleStatusChange(o, $event)"
                  >
                    <option v-for="opt in OFFER_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-medium text-ink-600">Zustandig</label>
                  <input
                    type="text"
                    :value="o.assigned_to"
                    placeholder="Name eingeben..."
                    class="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    @change="handleAssigneeChange(o, $event)"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="text-xs font-medium text-ink-600">Notizen (intern)</label>
                  <textarea
                    :value="o.notes || ''"
                    rows="3"
                    placeholder="Interne Notizen, Besuchstermine, Ruckrufzeiten..."
                    class="mt-1 w-full rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    @change="handleNotesChange(o, $event)"
                  />
                </div>
              </div>
              <template v-if="o.devices && o.devices.length > 0">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div class="font-semibold text-ink-700">Gerate</div>
                    <ul class="mt-1 list-disc pl-5 text-ink-600">
                      <li v-for="d in o.devices" :key="d.slug">{{ d.slug }} x {{ d.quantity }}</li>
                    </ul>
                  </div>
                  <div>
                    <div class="font-semibold text-ink-700">Standorte</div>
                    <ul class="mt-1 list-disc pl-5 text-ink-600">
                      <li v-for="l in o.locations" :key="l">{{ l }}</li>
                    </ul>
                  </div>
                </div>
              </template>
              <template v-else-if="parseStepsData(o)">
                <div class="space-y-4">
                  <div v-for="(stepData, stepSlug) in parseStepsData(o)" :key="stepSlug as string">
                    <div class="font-semibold text-ink-700">{{ stepSlug }}</div>
                    <div v-if="stepData.selections" class="mt-1">
                      <ul class="list-disc pl-5 text-ink-600">
                        <li v-for="sel in stepData.selections" :key="sel.slug">
                          {{ sel.slug }}<span v-if="sel.quantity"> x {{ sel.quantity }}</span>
                        </li>
                      </ul>
                    </div>
                    <div v-else-if="stepData.value" class="mt-1 text-ink-600">{{ stepData.value }}</div>
                    <div v-else-if="stepData.contact" class="mt-1 text-ink-600">
                      <div v-for="(val, key) in stepData.contact" :key="key as string">
                        <strong>{{ key }}:</strong> {{ val }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <div class="mt-4">
                <div class="font-semibold text-ink-700">Kontakt</div>
                <p class="mt-1 text-ink-600">
                  Tel: <a :href="`tel:${o.phone}`" class="hover:underline">{{ o.phone }}</a><br />
                  E-Mail: <a :href="`mailto:${o.email}`" class="hover:underline">{{ o.email }}</a>
                </p>
              </div>
              <div v-if="o.message" class="mt-4">
                <div class="font-semibold text-ink-700">Nachricht vom Kunden</div>
                <p class="mt-1 whitespace-pre-line text-ink-600">{{ o.message }}</p>
              </div>
            </div>
          </details>
        </div>
      </div>

      <!-- Closed offers -->
      <div v-if="filteredClosedOffers.length > 0">
        <h3 class="mb-3 flex items-center gap-2 text-sm font-medium text-ink-500">
          <span class="inline-block h-2 w-2 rounded-full bg-ink-400"></span>
          Abgeschlossen ({{ filteredClosedOffers.length }})
        </h3>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <details v-for="o in filteredClosedOffers" :key="o.id" class="group rounded-xl border border-ink-100 bg-ink-50/50">
            <summary class="flex cursor-pointer flex-col gap-2 px-4 py-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-mono text-ink-400">{{ o.reference }}</span>
                <span class="text-xs text-ink-400">{{ o.created_at }}</span>
              </div>
              <div class="font-medium text-ink-500">{{ o.first_name }} {{ o.last_name }}</div>
              <div class="text-sm text-ink-400">{{ o.zip }} {{ o.city }}</div>
              <div class="flex flex-wrap items-center gap-1.5 mt-1">
                <span :class="getStatusOption(o.status).color" class="rounded-full px-2 py-0.5 text-xs font-medium">
                  {{ getStatusOption(o.status).label }}
                </span>
                <span v-if="o.assigned_to" class="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">{{ o.assigned_to }}</span>
              </div>
            </summary>
            <div class="border-t border-ink-100 px-5 py-4 text-sm">
              <div class="mb-4 rounded-lg bg-ink-100 p-3">
                <div class="flex items-center gap-3">
                  <label class="text-xs font-medium text-ink-600">Status andern:</label>
                  <select
                    :value="o.status"
                    class="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    @change="handleStatusChange(o, $event)"
                  >
                    <option v-for="opt in OFFER_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>
              <div v-if="o.assigned_to" class="mb-3 text-ink-500">
                <span class="font-medium">Bearbeitet von:</span> {{ o.assigned_to }}
              </div>
              <div v-if="o.notes" class="mb-4 rounded-lg border border-ink-200 bg-white p-3">
                <div class="text-xs font-medium text-ink-500 mb-1">Notizen</div>
                <p class="whitespace-pre-line text-ink-600">{{ o.notes }}</p>
              </div>
              <template v-if="o.devices && o.devices.length > 0">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div class="font-semibold text-ink-700">Gerate</div>
                    <ul class="mt-1 list-disc pl-5 text-ink-600">
                      <li v-for="d in o.devices" :key="d.slug">{{ d.slug }} x {{ d.quantity }}</li>
                    </ul>
                  </div>
                  <div>
                    <div class="font-semibold text-ink-700">Standorte</div>
                    <ul class="mt-1 list-disc pl-5 text-ink-600">
                      <li v-for="l in o.locations" :key="l">{{ l }}</li>
                    </ul>
                  </div>
                </div>
              </template>
              <template v-else-if="parseStepsData(o)">
                <div class="space-y-4">
                  <div v-for="(stepData, stepSlug) in parseStepsData(o)" :key="stepSlug as string">
                    <div class="font-semibold text-ink-700">{{ stepSlug }}</div>
                    <div v-if="stepData.selections" class="mt-1">
                      <ul class="list-disc pl-5 text-ink-600">
                        <li v-for="sel in stepData.selections" :key="sel.slug">
                          {{ sel.slug }}<span v-if="sel.quantity"> x {{ sel.quantity }}</span>
                        </li>
                      </ul>
                    </div>
                    <div v-else-if="stepData.value" class="mt-1 text-ink-600">{{ stepData.value }}</div>
                    <div v-else-if="stepData.contact" class="mt-1 text-ink-600">
                      <div v-for="(val, key) in stepData.contact" :key="key as string">
                        <strong>{{ key }}:</strong> {{ val }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
              <div class="mt-4">
                <div class="font-semibold text-ink-700">Kontakt</div>
                <p class="mt-1 text-ink-600">
                  Tel: <a :href="`tel:${o.phone}`" class="hover:underline">{{ o.phone }}</a><br />
                  E-Mail: <a :href="`mailto:${o.email}`" class="hover:underline">{{ o.email }}</a>
                </p>
              </div>
              <div v-if="o.message" class="mt-4">
                <div class="font-semibold text-ink-700">Nachricht vom Kunden</div>
                <p class="mt-1 whitespace-pre-line text-ink-600">{{ o.message }}</p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>
