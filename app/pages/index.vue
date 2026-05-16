<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useOfferStore } from '~/stores/offer'
import { useHeroVisibility } from '~/composables/useHeroVisibility'
const { t, locale } = useI18n()
const localePath = useLocalePath()
const offer = useOfferStore()
const { heroEl, heroPresent, isAtTop, isHeroDominant } = useHeroVisibility()
// Synchron im setup() setzen — gilt schon für SSR + erste Hydration, kein Flash.
heroPresent.value = true

onBeforeUnmount(() => {
  heroPresent.value = false
  heroEl.value = null
})

interface Service {
  id: number; slug: string
  title_de: string; title_en: string
  summary_de: string; summary_en: string
  image_path: string; icon: string
}
const { data } = await useAsyncData('home-services', () => $fetch<Service[]>('/api/services'))
const services = computed(() => data.value || [])

const titleOf = (s: Service) => locale.value === 'en' ? s.title_en : s.title_de
const summaryOf = (s: Service) => locale.value === 'en' ? s.summary_en : s.summary_de

useSeoMeta({
  title: () => `${t('site.name')} — ${t('hero.title')}`,
  description: () => t('hero.subtitle'),
  ogTitle: () => `${t('site.name')} — ${t('hero.title')}`,
  ogDescription: () => t('hero.subtitle'),
  ogType: 'website',
})
</script>

<template>
  <div>
    <!-- HERO -->
    <section ref="heroEl" class="relative overflow-hidden bg-gradient-to-br from-ink-900 via-brand-900 to-brand-800 text-white">
      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 20%, white 1px, transparent 1px); background-size: 32px 32px;" />
      <div class="container relative grid gap-8 py-12 sm:py-16 md:gap-10 md:py-28 lg:grid-cols-12">
        <div class="min-w-0 lg:col-span-7">
          <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {{ t('hero.eyebrow') }}
          </span>
          <h1
            class="mt-4 text-2xl font-bold leading-tight tracking-tight transition-colors duration-300 sm:mt-5 sm:text-3xl md:text-5xl lg:text-6xl"
            :class="isHeroDominant ? 'text-white' : 'text-ink-900'"
          >
            {{ t('hero.title') }}
          </h1>
          <p class="mt-4 text-sm text-ink-100/90 sm:mt-5 sm:text-base md:text-lg md:max-w-xl">
            {{ t('hero.subtitle') }}
          </p>
          <div class="mt-6 inline-flex flex-wrap gap-3 sm:mt-8">
            <button class="btn-primary min-w-[180px] !bg-white !text-brand-700 hover:!bg-ink-100" @click="offer.openOverlay()">
              {{ t('hero.cta_primary') }}
            </button>
            <NuxtLink :to="localePath('/dienstleistungen')" class="btn min-w-[180px] !border !border-white/30 !text-white hover:!bg-white/10">
              {{ t('hero.cta_secondary') }}
            </NuxtLink>
          </div>

          <div class="mt-6 overflow-hidden border-t border-white/10 pt-4 text-xs sm:mt-10 sm:pt-6 sm:text-sm">
            <div class="flex gap-4 whitespace-nowrap animate-marquee sm:gap-6 md:animate-none">
              <div class="flex items-center gap-2"><span class="text-emerald-400">✓</span> {{ t('hero.trust_local') }}</div>
              <div class="flex items-center gap-2"><span class="text-emerald-400">✓</span> {{ t('hero.trust_advice') }}</div>
              <div class="flex items-center gap-2"><span class="text-emerald-400">✓</span> {{ t('hero.trust_quality') }}</div>
            </div>
          </div>
        </div>

        <!-- Quick offer card -->
        <div class="min-w-0 lg:col-span-5">
          <div class="rounded-2xl bg-white p-5 text-ink-900 shadow-2xl sm:p-6">
            <h3 class="text-base font-semibold sm:text-lg">{{ t('offer.title') }}</h3>
            <p class="mt-1 text-xs text-ink-600 sm:text-sm">{{ t('offer.subtitle') }}</p>
            <ul class="mt-3 space-y-2 text-xs text-ink-700 sm:mt-4 sm:text-sm">
              <li class="flex items-start gap-2"><span class="text-brand-600">1.</span> {{ t('offer.step1.title') }}</li>
              <li class="flex items-start gap-2"><span class="text-brand-600">2.</span> {{ t('offer.step2.title') }}</li>
              <li class="flex items-start gap-2"><span class="text-brand-600">3.</span> {{ t('offer.step3.title') }}</li>
              <li class="flex items-start gap-2"><span class="text-brand-600">4.</span> {{ t('offer.step4.title') }}</li>
            </ul>
            <button class="btn-primary mt-4 w-full sm:mt-5" @click="offer.openOverlay()">
              {{ t('hero.cta_primary') }} →
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- SERVICES -->
    <section class="section bg-white">
      <div class="container">
        <div class="max-w-2xl">
          <h2 class="text-3xl font-bold tracking-tight md:text-4xl">{{ t('services.section_title') }}</h2>
          <p class="mt-3 text-ink-600">{{ t('services.section_subtitle') }}</p>
        </div>

        <div v-if="services.length === 0" class="mt-10 text-ink-500">{{ t('services.empty') }}</div>

        <div v-else class="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="s in services"
            :key="s.id"
            :to="localePath(`/dienstleistungen/${s.slug}`)"
            class="card group flex flex-col"
          >
            <div class="aspect-[4/3] overflow-hidden rounded-lg bg-ink-100">
              <img v-if="s.image_path" :src="s.image_path" :alt="titleOf(s)" class="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              <div v-else class="grid h-full place-items-center text-ink-400">
                <svg viewBox="0 0 24 24" class="h-12 w-12" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
            </div>
            <h3 class="mt-4 text-lg font-semibold">{{ titleOf(s) }}</h3>
            <p class="mt-2 flex-1 text-sm text-ink-600">{{ summaryOf(s) }}</p>
            <span class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 group-hover:gap-2">
              {{ t('services.details') }} →
            </span>
          </NuxtLink>
        </div>

        <div class="mt-10 rounded-2xl bg-brand-600 p-5 text-white sm:p-8 md:p-10">
          <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div class="min-w-0">
              <h3 class="text-xl font-semibold sm:text-2xl">{{ t('hero.cta_primary') }}</h3>
              <p class="mt-1 text-sm text-brand-100 sm:text-base">{{ t('offer.subtitle') }}</p>
            </div>
            <button class="btn shrink-0 !bg-white !text-brand-700 hover:!bg-ink-100" @click="offer.openOverlay()">
              {{ t('nav.offer') }} →
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
