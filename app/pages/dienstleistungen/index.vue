<script setup lang="ts">
import { useOfferStore } from '~/stores/offer'
const { t, locale } = useI18n()
const localePath = useLocalePath()
const offer = useOfferStore()

interface Service {
  id: number; slug: string
  title_de: string; title_en: string
  summary_de: string; summary_en: string
  image_path: string
}
const { data } = await useAsyncData('services-list', () => $fetch<Service[]>('/api/services'))
const services = computed(() => data.value || [])

const titleOf = (s: Service) => locale.value === 'en' ? s.title_en : s.title_de
const summaryOf = (s: Service) => locale.value === 'en' ? s.summary_en : s.summary_de

useSeoMeta({
  title: () => `${t('site.name')} – ${t('services.section_title')}`,
  description: () => t('services.section_subtitle'),
})
</script>

<template>
  <div class="bg-white">
    <section class="border-b border-ink-100 bg-ink-50">
      <div class="container py-14 md:py-20">
        <h1 class="text-3xl font-bold tracking-tight md:text-4xl">{{ t('services.section_title') }}</h1>
        <p class="mt-3 max-w-2xl text-ink-600">{{ t('services.section_subtitle') }}</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div v-if="services.length === 0" class="text-ink-500">{{ t('services.empty') }}</div>
        <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="s in services"
            :key="s.id"
            :to="localePath(`/dienstleistungen/${s.slug}`)"
            class="card group flex flex-col"
          >
            <div class="aspect-[4/3] overflow-hidden rounded-lg bg-ink-100">
              <img v-if="s.image_path" :src="s.image_path" :alt="titleOf(s)" class="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
            </div>
            <h3 class="mt-4 text-lg font-semibold">{{ titleOf(s) }}</h3>
            <p class="mt-2 flex-1 text-sm text-ink-600">{{ summaryOf(s) }}</p>
            <span class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 group-hover:gap-2">
              {{ t('services.details') }} →
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
