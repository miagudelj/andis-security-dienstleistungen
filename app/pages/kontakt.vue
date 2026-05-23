<script setup lang="ts">
import { useOfferStore } from '~/stores/offer'
const { t } = useI18n()
const offer = useOfferStore()
const { data: settings } = useCompanySettings()

useSeoMeta({
  title: () => `${t('site.name')} – ${t('nav.contact')}`,
  description: () => t('hero.subtitle'),
})

const phoneLink = computed(() => settings.value?.phone?.replace(/\s/g, '') || '')
</script>

<template>
  <div class="bg-white">
    <section class="border-b border-ink-100 bg-ink-50">
      <div class="container py-14 md:py-20">
        <h1 class="text-3xl font-bold tracking-tight md:text-4xl">{{ t('nav.contact') }}</h1>
        <p class="mt-3 max-w-2xl text-ink-600">{{ t('site.tagline') }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container grid gap-10 md:grid-cols-2">
        <div class="card">
          <h3 class="text-lg font-semibold">{{ settings?.company_name }}</h3>
          <ul class="mt-4 space-y-3 text-sm text-ink-700">
            <li v-if="settings?.street || settings?.zip || settings?.city" class="flex gap-3">
              <span class="text-brand-600">📍</span>
              <span>
                <template v-if="settings?.street">{{ settings.street }}<br /></template>
                {{ settings?.zip }} {{ settings?.city }}<template v-if="settings?.canton">, Kanton {{ settings.canton }}</template>
              </span>
            </li>
            <li v-if="settings?.phone" class="flex gap-3">
              <span class="text-brand-600">📞</span>
              <a :href="`tel:${phoneLink}`" class="hover:underline">{{ settings.phone }}</a>
            </li>
            <li v-if="settings?.email" class="flex gap-3">
              <span class="text-brand-600">✉️</span>
              <a :href="`mailto:${settings.email}`" class="hover:underline">{{ settings.email }}</a>
            </li>
          </ul>
        </div>
        <div class="card bg-brand-50 border-brand-100">
          <h3 class="text-lg font-semibold text-ink-900">{{ t('hero.cta_primary') }}</h3>
          <p class="mt-2 text-sm text-ink-700">{{ t('offer.subtitle') }}</p>
          <button class="btn-primary mt-5" @click="offer.openOverlay()">{{ t('nav.offer') }} →</button>
        </div>
      </div>
    </section>
  </div>
</template>
