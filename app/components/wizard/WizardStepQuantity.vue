<script setup lang="ts">
import { useOfferStore, type WizardStep } from '~/stores/offer'

defineProps<{ step: WizardStep }>()

const { locale } = useI18n()
const offer = useOfferStore()

// Get selections from previous select step
const selections = computed(() => offer.getPreviousSelections())

// Find the previous select step to get option labels
const previousSelectStep = computed(() => {
  if (!offer.config) return null
  for (let i = offer.currentStepIndex - 1; i >= 0; i--) {
    const s = offer.config.steps[i]
    if (s.step_type === 'multi_select' || s.step_type === 'single_select') {
      return s
    }
  }
  return null
})

function getLabel(slug: string): string {
  if (!previousSelectStep.value) return slug
  return offer.getOptionLabel(previousSelectStep.value.slug, slug, locale.value)
}

function updateQuantity(slug: string, delta: number) {
  const selection = selections.value.find(s => s.slug === slug)
  if (selection) {
    const newQty = (selection.quantity ?? 1) + delta
    // Update in the previous step's response
    if (previousSelectStep.value) {
      const response = offer.getResponse(previousSelectStep.value.slug)
      const sel = response.selections?.find(s => s.slug === slug)
      if (sel) {
        sel.quantity = Math.max(1, Math.min(99, newQty))
        offer.setResponse(previousSelectStep.value.slug, response)
      }
    }
  }
}

function setQuantity(slug: string, value: number) {
  if (previousSelectStep.value) {
    const response = offer.getResponse(previousSelectStep.value.slug)
    const sel = response.selections?.find(s => s.slug === slug)
    if (sel) {
      sel.quantity = Math.max(1, Math.min(99, value))
      offer.setResponse(previousSelectStep.value.slug, response)
    }
  }
}
</script>

<template>
  <section>
    <h3 class="text-base font-semibold text-ink-900 sm:text-lg">
      {{ locale === 'en' ? step.title_en : step.title_de }}
    </h3>
    <p v-if="step.subtitle_de || step.subtitle_en" class="mt-1 text-sm text-ink-500">
      {{ locale === 'en' ? step.subtitle_en : step.subtitle_de }}
    </p>

    <div v-if="selections.length === 0" class="mt-5 text-sm text-ink-500">
      {{ locale === 'en' ? 'No items selected in previous step.' : 'Keine Auswahl im vorherigen Schritt.' }}
    </div>

    <div v-else class="mt-5 space-y-3">
      <div
        v-for="sel in selections"
        :key="sel.slug"
        class="flex items-center justify-between gap-4 rounded-lg border border-ink-200 bg-white px-4 py-3"
      >
        <span class="text-sm font-medium text-ink-800">{{ getLabel(sel.slug) }}</span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100"
            @click="updateQuantity(sel.slug, -1)"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
          </button>
          <input
            type="number"
            :value="sel.quantity ?? 1"
            min="1"
            max="99"
            class="w-14 rounded-lg border border-ink-200 px-2 py-1.5 text-center text-sm"
            @input="(e) => setQuantity(sel.slug, parseInt((e.target as HTMLInputElement).value) || 1)"
          />
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600 transition-colors hover:bg-ink-100"
            @click="updateQuantity(sel.slug, 1)"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
