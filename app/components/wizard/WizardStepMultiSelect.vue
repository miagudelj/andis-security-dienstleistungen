<script setup lang="ts">
import { useOfferStore, type WizardStep } from '~/stores/offer'

defineProps<{ step: WizardStep }>()

const { locale } = useI18n()
const offer = useOfferStore()

const label = (opt: { label_de: string; label_en: string }) =>
  locale.value === 'en' ? opt.label_en : opt.label_de
</script>

<template>
  <section>
    <h3 class="text-base font-semibold text-ink-900 sm:text-lg">
      {{ locale === 'en' ? step.title_en : step.title_de }}
    </h3>
    <p v-if="step.subtitle_de || step.subtitle_en" class="mt-1 text-sm text-ink-500">
      {{ locale === 'en' ? step.subtitle_en : step.subtitle_de }}
    </p>

    <div class="mt-5 grid gap-2 sm:grid-cols-2">
      <button
        v-for="opt in step.options"
        :key="opt.slug"
        type="button"
        class="flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors"
        :class="offer.isSelected(opt.slug)
          ? 'border-brand-500 bg-brand-50'
          : 'border-ink-200 bg-white hover:border-brand-300'"
        @click="offer.toggleSelection(opt.slug)"
      >
        <span
          class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2 transition-colors"
          :class="offer.isSelected(opt.slug)
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-ink-300 bg-white'"
        >
          <svg v-if="offer.isSelected(opt.slug)" class="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="text-sm font-medium text-ink-800">{{ label(opt) }}</span>
      </button>
    </div>
  </section>
</template>
