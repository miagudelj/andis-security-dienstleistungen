<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useOfferStore } from '~/stores/offer'

const { t } = useI18n()
const offer = useOfferStore()
const copied = ref(false)

async function copyReference() {
  try {
    await navigator.clipboard.writeText(offer.reference)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea')
    el.value = offer.reference
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

// Load wizard config on mount
onMounted(async () => {
  if (!offer.config) {
    await offer.loadConfig()
  }
})

const { locale } = useI18n()

function next() {
  offer.errorMessage = ''
  const error = offer.validateCurrentStep(locale.value)
  if (error) {
    offer.errorMessage = error
    return
  }
  offer.next()
}

async function submit() {
  offer.errorMessage = ''
  const error = offer.validateCurrentStep(locale.value)
  if (error) {
    offer.errorMessage = error
    return
  }
  await offer.submit(locale.value)
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

      <!-- Loading state -->
      <div v-if="offer.configLoading" class="flex-1 flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p class="mt-3 text-sm text-ink-500">{{ t('common.loading') }}</p>
        </div>
      </div>

      <!-- Success view -->
      <div v-else-if="offer.success" class="flex-1 overflow-y-auto px-6 py-8 text-center">
        <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="mt-5 text-lg font-semibold text-ink-900">{{ t('offer.success.title') }}</h3>
        <p class="mt-2 text-sm text-ink-600">{{ t('offer.success.body') }}</p>
        <div class="mt-4 inline-flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-1.5">
          <span class="text-xs font-mono text-ink-700">{{ offer.reference }}</span>
          <button
            type="button"
            class="rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-700 transition-colors"
            :title="t('common.copy')"
            @click="copyReference"
          >
            <svg v-if="!copied" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="mt-6">
          <button class="btn-primary" @click="offer.closeOverlay()">{{ t('offer.success.close') }}</button>
        </div>
      </div>

      <!-- Dynamic Steps -->
      <template v-else-if="offer.config">
        <!-- Progress -->
        <div class="px-6 pt-4">
          <div class="flex items-center gap-2">
            <div
              v-for="(step, index) in offer.config.steps"
              :key="step.slug"
              class="h-1.5 flex-1 rounded-full"
              :class="index <= offer.currentStepIndex ? 'bg-brand-600' : 'bg-ink-100'"
            />
          </div>
          <p class="mt-2 text-xs text-ink-500">
            {{ t('offer.step', { current: offer.currentStepIndex + 1, total: offer.config.steps.length }) }}
          </p>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-6">
          <!-- Dynamic step rendering based on step_type -->
          <template v-if="offer.currentStep">
            <WizardStepMultiSelect
              v-if="offer.currentStep.step_type === 'multi_select'"
              :step="offer.currentStep"
            />
            <WizardStepSingleSelect
              v-else-if="offer.currentStep.step_type === 'single_select'"
              :step="offer.currentStep"
            />
            <WizardStepQuantity
              v-else-if="offer.currentStep.step_type === 'quantity_input'"
              :step="offer.currentStep"
            />
            <WizardStepContact
              v-else-if="offer.currentStep.step_type === 'contact_form'"
              :step="offer.currentStep"
            />
            <WizardStepFreeText
              v-else-if="offer.currentStep.step_type === 'free_text'"
              :step="offer.currentStep"
            />
          </template>

          <p v-if="offer.errorMessage" class="mt-4 text-sm text-red-600">{{ offer.errorMessage }}</p>
        </div>

        <!-- Footer with navigation -->
        <div class="flex items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/50 px-6 py-4">
          <button
            type="button"
            class="btn-ghost"
            :disabled="offer.currentStepIndex === 0 || offer.submitting"
            :class="{ invisible: offer.currentStepIndex === 0 }"
            @click="offer.back()"
          >
            ← {{ t('offer.back') }}
          </button>
          <button
            v-if="!offer.isLastStep"
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
            :disabled="offer.submitting"
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
