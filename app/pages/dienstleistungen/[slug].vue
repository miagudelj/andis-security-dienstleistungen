<script setup lang="ts">
import { useOfferStore } from '~/stores/offer'
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const offer = useOfferStore()

interface Service {
  id: number; slug: string
  title_de: string; title_en: string
  summary_de: string; summary_en: string
  body_de: string; body_en: string
  image_path: string
}
const slug = route.params.slug as string
const { data: service, error } = await useAsyncData(`service-${slug}`, () => $fetch<Service>(`/api/services/${slug}`))

if (error.value || !service.value) {
  throw createError({ statusCode: 404, statusMessage: 'Dienstleistung nicht gefunden', fatal: true })
}

const title = computed(() => locale.value === 'en' ? service.value!.title_en : service.value!.title_de)
const summary = computed(() => locale.value === 'en' ? service.value!.summary_en : service.value!.summary_de)
const body = computed(() => locale.value === 'en' ? service.value!.body_en : service.value!.body_de)

useSeoMeta({
  title: () => `${t('site.name')} – ${title.value}`,
  description: () => summary.value,
})
</script>

<template>
  <div class="bg-white">
    <section class="border-b border-ink-100 bg-ink-50">
      <div class="container py-12 md:py-16">
        <NuxtLink :to="localePath('/dienstleistungen')" class="text-sm text-brand-700 hover:underline">← {{ t('services.back') }}</NuxtLink>
        <h1 class="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{{ title }}</h1>
        <p class="mt-3 max-w-2xl text-ink-600">{{ summary }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container grid gap-10 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <div v-if="service?.image_path" class="aspect-video overflow-hidden rounded-xl bg-ink-100">
            <img :src="service.image_path" :alt="title" class="h-full w-full object-cover" />
          </div>
          <div class="prose prose-slate mt-8 max-w-none text-ink-700">
            <p v-for="(p, i) in body.split('\n\n')" :key="i">{{ p }}</p>
          </div>
        </div>

        <aside class="lg:col-span-1">
          <div class="sticky top-24 rounded-2xl border border-brand-100 bg-brand-50 p-6">
            <h3 class="text-lg font-semibold text-ink-900">{{ t('services.request_offer') }}</h3>
            <p class="mt-2 text-sm text-ink-600">{{ t('offer.subtitle') }}</p>
            <button class="btn-primary mt-5 w-full" @click="offer.openOverlay()">
              {{ t('nav.offer') }} →
            </button>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>
