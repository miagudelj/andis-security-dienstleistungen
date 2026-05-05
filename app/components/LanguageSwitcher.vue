<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

defineProps<{ inverted?: boolean }>()

const otherLocale = computed(() => (locales.value as Array<{ code: string }>).find(l => l.code !== locale.value)?.code || 'en')
</script>

<template>
  <NuxtLink
    :to="switchLocalePath(otherLocale as any)"
    :class="[
      'rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
      inverted
        ? 'border-white/30 text-white hover:border-white hover:text-white'
        : 'border-ink-200 text-ink-700 hover:border-brand-300 hover:text-brand-700',
    ]"
  >
    {{ otherLocale.toUpperCase() }}
  </NuxtLink>
</template>
