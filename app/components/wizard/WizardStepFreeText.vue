<script setup lang="ts">
import { useOfferStore, type WizardStep } from '~/stores/offer'

defineProps<{ step: WizardStep }>()

const { locale } = useI18n()
const offer = useOfferStore()
</script>

<template>
  <section>
    <h3 class="text-base font-semibold text-ink-900 sm:text-lg">
      {{ locale === 'en' ? step.title_en : step.title_de }}
    </h3>
    <p v-if="step.subtitle_de || step.subtitle_en" class="mt-1 text-sm text-ink-500">
      {{ locale === 'en' ? step.subtitle_en : step.subtitle_de }}
    </p>

    <div class="mt-5">
      <textarea
        :value="offer.getFreeText()"
        rows="5"
        class="input resize-none"
        :placeholder="locale === 'en' ? 'Enter your text here...' : 'Geben Sie Ihren Text hier ein...'"
        @input="(e) => offer.setFreeText((e.target as HTMLTextAreaElement).value)"
      />
    </div>
  </section>
</template>
