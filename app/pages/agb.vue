<script setup lang="ts">
const { t } = useI18n()
const { data: settings } = useCompanySettings()
useSeoMeta({ title: () => `${t('site.name')} – ${t('footer.agb')}`, robots: 'noindex' })
</script>

<template>
  <div class="bg-white">
    <section class="relative overflow-hidden bg-gradient-to-br from-ink-900 via-brand-900 to-brand-800 text-white">
      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 20%, white 1px, transparent 1px); background-size: 32px 32px;" />
      <div class="container relative max-w-3xl py-14 md:py-20">
        <h1 class="text-3xl font-bold tracking-tight text-white md:text-4xl">{{ t('legal.agb.title') }}</h1>
      </div>
    </section>

    <article class="container max-w-3xl py-10 md:py-14">
      <div class="prose prose-slate max-w-none text-ink-700">
        <h2>{{ t('legal.agb.scope.title') }}</h2>
        <p>{{ t('legal.agb.scope.text', { company: settings?.company_name }) }}</p>

        <h2>{{ t('legal.agb.contract.title') }}</h2>
        <p>{{ t('legal.agb.contract.text') }}</p>

        <h2>{{ t('legal.agb.payment.title') }}</h2>
        <p>{{ t('legal.agb.payment.text') }}</p>

        <h2>{{ t('legal.agb.service.title') }}</h2>
        <p>{{ t('legal.agb.service.text') }}</p>

        <h2>{{ t('legal.agb.cooperation.title') }}</h2>
        <p>{{ t('legal.agb.cooperation.text') }}</p>

        <h2>{{ t('legal.agb.warranty.title') }}</h2>
        <p>{{ t('legal.agb.warranty.text') }}</p>

        <h2>{{ t('legal.agb.liability.title') }}</h2>
        <p>{{ t('legal.agb.liability.text') }}</p>

        <h2>{{ t('legal.agb.confidentiality.title') }}</h2>
        <p>{{ t('legal.agb.confidentiality.text') }}</p>

        <h2>{{ t('legal.agb.jurisdiction.title') }}</h2>
        <p>{{ t('legal.agb.jurisdiction.text', { city: settings?.city || 'Zürich' }) }}</p>

        <h2>{{ t('legal.agb.severability.title') }}</h2>
        <p>{{ t('legal.agb.severability.text') }}</p>

        <p class="text-sm text-ink-500 mt-8">{{ t('legal.agb.updated') }}</p>
      </div>
    </article>
  </div>
</template>
