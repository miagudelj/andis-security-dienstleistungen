<script setup lang="ts">
import { useOfferStore } from '~/stores/offer'
const { t } = useI18n()
const offer = useOfferStore()

useSeoMeta({
  title: () => `${t('nav.contact')} — ${t('site.name')}`,
  description: () => t('hero.subtitle'),
})
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
          <h3 class="text-lg font-semibold">Andi's Security Dienstleistungen</h3>
          <ul class="mt-4 space-y-3 text-sm text-ink-700">
            <li class="flex gap-3"><span class="text-brand-600">📍</span><span>[Strasse Nr.]<br />[PLZ Ort], Kanton Zürich</span></li>
            <li class="flex gap-3"><span class="text-brand-600">📞</span><a href="tel:+41000000000" class="hover:underline">+41 00 000 00 00</a></li>
            <li class="flex gap-3"><span class="text-brand-600">✉️</span><a href="mailto:info@andis-security.ch" class="hover:underline">info@andis-security.ch</a></li>
          </ul>
          <p class="mt-6 text-xs text-ink-500">[Kontaktangaben werden vom Inhaber ergänzt]</p>
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
