<script setup lang="ts">
import { useHeroVisibility } from '~/composables/useHeroVisibility'
const { t } = useI18n()
const { isHeroPartiallyVisible } = useHeroVisibility()
defineEmits<{ click: [] }>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-3"
  >
    <button
      v-show="!isHeroPartiallyVisible"
      class="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:bg-brand-700 hover:shadow-xl active:scale-95 md:bottom-8 md:right-8"
      @click="$emit('click')"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12l2 2 4-4M12 22c5.5-1.5 9-6 9-11V5l-9-3-9 3v6c0 5 3.5 9.5 9 11Z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ t('offer_cta.label') }}
    </button>
  </Transition>
</template>
