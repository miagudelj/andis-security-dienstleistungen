<script setup lang="ts">
const { t } = useI18n()
const { data: settings } = useCompanySettings()
useSeoMeta({ title: () => `${t('site.name')} – ${t('footer.impressum')}`, robots: 'noindex' })

const phoneLink = computed(() => settings.value?.phone?.replace(/\s/g, '') || '')
</script>

<template>
  <div class="bg-white">
    <section class="relative overflow-hidden bg-gradient-to-br from-ink-900 via-brand-900 to-brand-800 text-white">
      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 20%, white 1px, transparent 1px); background-size: 32px 32px;" />
      <div class="container relative max-w-3xl py-14 md:py-20">
        <h1 class="text-3xl font-bold tracking-tight text-white md:text-4xl">{{ t('legal.impressum.title') }}</h1>
      </div>
    </section>

    <article class="container max-w-3xl py-10 md:py-14">
      <div class="prose prose-slate max-w-none text-ink-700">
        <h2>{{ t('legal.impressum.info_title') }}</h2>
        <p>
          <strong>{{ settings?.company_name }}</strong><br />
          <template v-if="settings?.owner_name">{{ settings.owner_name }}<br /></template>
          <template v-if="settings?.street">{{ settings.street }}<br /></template>
          <template v-if="settings?.zip || settings?.city">{{ settings?.zip }} {{ settings?.city }}<br /></template>
          {{ settings?.country || 'Schweiz' }}
        </p>

        <h2>{{ t('legal.impressum.contact') }}</h2>
        <p>
          <template v-if="settings?.phone">{{ t('offer.step4.phone') }}: <a :href="`tel:${phoneLink}`">{{ settings.phone }}</a><br /></template>
          <template v-if="settings?.email">{{ t('offer.step4.email') }}: <a :href="`mailto:${settings.email}`">{{ settings.email }}</a></template>
        </p>

        <template v-if="settings?.uid_number">
          <h2>{{ t('legal.impressum.uid_title') }}</h2>
          <p>{{ t('legal.impressum.uid_label') }}: {{ settings.uid_number }}</p>
        </template>

        <h2>{{ t('legal.impressum.disclaimer.title') }}</h2>
        <p>{{ t('legal.impressum.disclaimer.text') }}</p>

        <h2>{{ t('legal.impressum.links.title') }}</h2>
        <p>{{ t('legal.impressum.links.text') }}</p>

        <h2>{{ t('legal.impressum.copyright.title') }}</h2>
        <p>{{ t('legal.impressum.copyright.text', { company: settings?.company_name }) }}</p>
      </div>
    </article>
  </div>
</template>
