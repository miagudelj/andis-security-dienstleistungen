<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useOfferStore } from '~/stores/offer'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const offer = useOfferStore()

interface DeviceRow { slug: string; label_de: string; label_en: string }
interface LocationRow { slug: string; label_de: string; label_en: string }

const { data: devicesData } = await useAsyncData('devices', () => $fetch<DeviceRow[]>('/api/devices'))
const { data: locationsData } = await useAsyncData('locations', () => $fetch<LocationRow[]>('/api/locations'))

const devices = computed(() => devicesData.value || [])
const locations = computed(() => locationsData.value || [])

const labelOf = (row: DeviceRow | LocationRow) => locale.value === 'en' ? row.label_en : row.label_de

const stepError = ref('')

function isDeviceSelected(slug: string) {
  return offer.form.devices.some(d => d.slug === slug)
}
function isLocationSelected(slug: string) {
  return offer.form.locations.includes(slug)
}

function next() {
  stepError.value = ''
  if (offer.step === 1 && offer.form.devices.length === 0) {
    stepError.value = t('offer.step1.error'); return
  }
  if (offer.step === 3 && offer.form.locations.length === 0) {
    stepError.value = t('offer.step3.error'); return
  }
  offer.next()
}

const canSubmit = computed(() =>
  offer.form.first_name.trim() &&
  offer.form.last_name.trim() &&
  /\S+@\S+\.\S+/.test(offer.form.email) &&
  offer.form.phone.trim().length >= 5 &&
  offer.form.zip.trim().length >= 4 &&
  offer.form.city.trim() &&
  offer.form.consent === true,
)

async function submit() {
  if (!canSubmit.value) return
  await offer.submit()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') offer.closeOverlay()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    role="dialog"
    aria-modal="true"
    @click.self="offer.closeOverlay()"
  >
    <div class="relative flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
      <!-- Header -->
      <div class="flex items-start justify-between border-b border-ink-100 px-6 py-5">
        <div>
          <h2 class="text-lg font-semibold text-ink-900">{{ t('offer.title') }}</h2>
          <p v-if="!offer.success" class="mt-1 text-sm text-ink-500">{{ t('offer.subtitle') }}</p>
        </div>
        <button
          class="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          :aria-label="t('offer.close')"
          @click="offer.closeOverlay()"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M18 6l-12 12" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Success view -->
      <div v-if="offer.success" class="flex-1 overflow-y-auto px-6 py-8 text-center">
        <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="mt-5 text-lg font-semibold text-ink-900">{{ t('offer.success.title') }}</h3>
        <p class="mt-2 text-sm text-ink-600">{{ t('offer.success.body') }}</p>
        <p class="mt-4 inline-block rounded-lg bg-ink-50 px-3 py-1.5 text-xs font-mono text-ink-700">
          {{ t('offer.success.reference', { ref: offer.reference }) }}
        </p>
        <div class="mt-6">
          <button class="btn-primary" @click="offer.closeOverlay()">{{ t('offer.success.close') }}</button>
        </div>
      </div>

      <!-- Steps -->
      <template v-else>
        <!-- Progress -->
        <div class="px-6 pt-4">
          <div class="flex items-center gap-2">
            <div v-for="n in 4" :key="n" class="h-1.5 flex-1 rounded-full" :class="n <= offer.step ? 'bg-brand-600' : 'bg-ink-100'" />
          </div>
          <p class="mt-2 text-xs text-ink-500">{{ t('offer.step', { current: offer.step, total: 4 }) }}</p>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6">
          <!-- Step 1: Devices -->
          <section v-if="offer.step === 1">
            <h3 class="text-base font-semibold text-ink-900">{{ t('offer.step1.title') }}</h3>
            <p class="mt-1 text-sm text-ink-500">{{ t('offer.step1.subtitle') }}</p>
            <div class="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                v-for="d in devices"
                :key="d.slug"
                type="button"
                class="flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors"
                :class="isDeviceSelected(d.slug)
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-ink-200 bg-white hover:border-brand-300'"
                @click="offer.toggleDevice(d.slug)"
              >
                <span
                  class="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded border-2"
                  :class="isDeviceSelected(d.slug) ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300'"
                >
                  <svg v-if="isDeviceSelected(d.slug)" viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="text-sm font-medium text-ink-800">{{ labelOf(d) }}</span>
              </button>
            </div>
          </section>

          <!-- Step 2: Quantity -->
          <section v-else-if="offer.step === 2">
            <h3 class="text-base font-semibold text-ink-900">{{ t('offer.step2.title') }}</h3>
            <p class="mt-1 text-sm text-ink-500">{{ t('offer.step2.subtitle') }}</p>
            <div class="mt-5 space-y-3">
              <div
                v-for="sel in offer.form.devices"
                :key="sel.slug"
                class="flex items-center justify-between rounded-lg border border-ink-200 bg-white px-4 py-3"
              >
                <span class="text-sm font-medium text-ink-800">
                  {{ labelOf(devices.find(d => d.slug === sel.slug) || { slug: sel.slug, label_de: sel.slug, label_en: sel.slug }) }}
                </span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-md border border-ink-200 text-ink-700 hover:bg-ink-50"
                    :aria-label="'-'"
                    @click="offer.setQuantity(sel.slug, sel.quantity - 1)"
                  >−</button>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    :value="sel.quantity"
                    class="w-14 rounded-md border border-ink-200 px-2 py-1 text-center text-sm"
                    @input="(e: any) => offer.setQuantity(sel.slug, parseInt(e.target.value || '1'))"
                  />
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-md border border-ink-200 text-ink-700 hover:bg-ink-50"
                    :aria-label="'+'"
                    @click="offer.setQuantity(sel.slug, sel.quantity + 1)"
                  >+</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Step 3: Locations -->
          <section v-else-if="offer.step === 3">
            <h3 class="text-base font-semibold text-ink-900">{{ t('offer.step3.title') }}</h3>
            <p class="mt-1 text-sm text-ink-500">{{ t('offer.step3.subtitle') }}</p>
            <div class="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                v-for="l in locations"
                :key="l.slug"
                type="button"
                class="flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors"
                :class="isLocationSelected(l.slug)
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-ink-200 bg-white hover:border-brand-300'"
                @click="offer.toggleLocation(l.slug)"
              >
                <span
                  class="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded border-2"
                  :class="isLocationSelected(l.slug) ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300'"
                >
                  <svg v-if="isLocationSelected(l.slug)" viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="text-sm font-medium text-ink-800">{{ labelOf(l) }}</span>
              </button>
            </div>
          </section>

          <!-- Step 4: Contact -->
          <section v-else-if="offer.step === 4">
            <h3 class="text-base font-semibold text-ink-900">{{ t('offer.step4.title') }}</h3>
            <p class="mt-1 text-sm text-ink-500">{{ t('offer.step4.subtitle') }}</p>

            <form class="mt-5 grid gap-4 sm:grid-cols-2" @submit.prevent="submit">
              <!-- Honeypot (versteckt für Bots) -->
              <input
                v-model="offer.form.website"
                type="text"
                name="website"
                tabindex="-1"
                autocomplete="off"
                class="absolute h-0 w-0 opacity-0"
                aria-hidden="true"
              />

              <div>
                <label class="label" for="fn">{{ t('offer.step4.first_name') }} *</label>
                <input id="fn" v-model="offer.form.first_name" type="text" autocomplete="given-name" class="input" required />
              </div>
              <div>
                <label class="label" for="ln">{{ t('offer.step4.last_name') }} *</label>
                <input id="ln" v-model="offer.form.last_name" type="text" autocomplete="family-name" class="input" required />
              </div>
              <div>
                <label class="label" for="em">{{ t('offer.step4.email') }} *</label>
                <input id="em" v-model="offer.form.email" type="email" autocomplete="email" class="input" required />
              </div>
              <div>
                <label class="label" for="ph">{{ t('offer.step4.phone') }} *</label>
                <input id="ph" v-model="offer.form.phone" type="tel" autocomplete="tel" class="input" required />
              </div>
              <div>
                <label class="label" for="zp">{{ t('offer.step4.zip') }} *</label>
                <input id="zp" v-model="offer.form.zip" type="text" autocomplete="postal-code" class="input" required />
              </div>
              <div>
                <label class="label" for="ct">{{ t('offer.step4.city') }} *</label>
                <input id="ct" v-model="offer.form.city" type="text" autocomplete="address-level2" class="input" required />
              </div>
              <div class="sm:col-span-2">
                <label class="label" for="msg">{{ t('offer.step4.message') }}</label>
                <textarea id="msg" v-model="offer.form.message" rows="3" class="input" :placeholder="t('offer.step4.message_placeholder')" />
              </div>
              <div class="sm:col-span-2">
                <label class="flex items-start gap-3 text-sm text-ink-700">
                  <input v-model="offer.form.consent" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" required />
                  <span>
                    <i18n-t keypath="offer.step4.consent" tag="span">
                      <template #link>
                        <NuxtLink :to="localePath('/datenschutz')" target="_blank" class="text-brand-700 underline">{{ t('offer.step4.consent_link') }}</NuxtLink>
                      </template>
                    </i18n-t>
                  </span>
                </label>
              </div>
            </form>
          </section>

          <p v-if="stepError" class="mt-4 text-sm text-red-600">{{ stepError }}</p>
          <p v-if="offer.errorMessage" class="mt-4 text-sm text-red-600">{{ offer.errorMessage }}</p>
        </div>

        <!-- Footer with navigation -->
        <div class="flex items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/50 px-6 py-4">
          <button
            type="button"
            class="btn-ghost"
            :disabled="offer.step === 1 || offer.submitting"
            :class="{ invisible: offer.step === 1 }"
            @click="offer.back()"
          >
            ← {{ t('offer.back') }}
          </button>
          <button
            v-if="offer.step < 4"
            type="button"
            class="btn-primary"
            @click="next"
          >
            {{ t('offer.next') }} →
          </button>
          <button
            v-else
            type="button"
            class="btn-primary"
            :disabled="!canSubmit || offer.submitting"
            @click="submit"
          >
            <span v-if="offer.submitting">{{ t('offer.submitting') }}</span>
            <span v-else>{{ t('offer.submit') }}</span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
