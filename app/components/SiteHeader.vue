<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOfferStore } from '~/stores/offer'
import { useHeroVisibility } from '~/composables/useHeroVisibility'
const { t } = useI18n()
const localePath = useLocalePath()
const offer = useOfferStore()
const mobileOpen = ref(false)

const { isHeroDominant } = useHeroVisibility()
// Invertiere Header solange Hero >= 75% sichtbar UND Mobile-Menü zu (offenes Menü braucht weissen Hintergrund).
const inverted = computed(() => isHeroDominant.value && !mobileOpen.value)
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-40 transition-colors duration-300',
      inverted
        ? 'border-b border-white/10 bg-brand-900'
        : 'border-b border-ink-100 bg-white/90 backdrop-blur',
    ]"
  >
    <div class="container flex h-16 items-center justify-between gap-4">
      <NuxtLink
        :to="localePath('/')"
        :class="['flex items-center gap-2 transition-colors', inverted ? 'text-white' : 'text-ink-900']"
      >
        <span class="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z"/></svg>
        </span>
        <span class="text-base font-semibold tracking-tight">{{ t('site.name') }}</span>
      </NuxtLink>

      <nav class="hidden items-center gap-7 md:flex">
        <NuxtLink
          :to="localePath('/')"
          :class="['text-sm font-medium transition-colors', inverted ? 'text-white/90 hover:text-white' : 'text-ink-700 hover:text-brand-700']"
        >{{ t('nav.home') }}</NuxtLink>
        <NuxtLink
          :to="localePath('/dienstleistungen')"
          :class="['text-sm font-medium transition-colors', inverted ? 'text-white/90 hover:text-white' : 'text-ink-700 hover:text-brand-700']"
        >{{ t('nav.services') }}</NuxtLink>
        <NuxtLink
          :to="localePath('/kontakt')"
          :class="['text-sm font-medium transition-colors', inverted ? 'text-white/90 hover:text-white' : 'text-ink-700 hover:text-brand-700']"
        >{{ t('nav.contact') }}</NuxtLink>
      </nav>

      <div class="hidden items-center gap-3 md:flex">
        <LanguageSwitcher :inverted="inverted" />
        <button
          :class="inverted ? 'btn !bg-white !text-brand-700 hover:!bg-ink-100' : 'btn-primary'"
          @click="offer.openOverlay()"
        >{{ t('nav.offer') }}</button>
      </div>

      <button
        :class="['md:hidden p-2 transition-colors', inverted ? 'text-white' : 'text-ink-700']"
        aria-label="Menu"
        @click="mobileOpen = !mobileOpen"
      >
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="!mobileOpen" d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/>
          <path v-else d="M6 6l12 12M18 6l-12 12" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <div v-if="mobileOpen" class="border-t border-ink-100 bg-white md:hidden">
      <div class="container flex flex-col gap-3 py-4">
        <NuxtLink :to="localePath('/')" class="py-2 text-sm font-medium text-ink-800" @click="mobileOpen = false">{{ t('nav.home') }}</NuxtLink>
        <NuxtLink :to="localePath('/dienstleistungen')" class="py-2 text-sm font-medium text-ink-800" @click="mobileOpen = false">{{ t('nav.services') }}</NuxtLink>
        <NuxtLink :to="localePath('/kontakt')" class="py-2 text-sm font-medium text-ink-800" @click="mobileOpen = false">{{ t('nav.contact') }}</NuxtLink>
        <div class="flex items-center justify-between pt-2">
          <LanguageSwitcher />
          <button class="btn-primary" @click="offer.openOverlay(); mobileOpen = false">{{ t('nav.offer') }}</button>
        </div>
      </div>
    </div>
  </header>
</template>
