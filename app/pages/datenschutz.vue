<script setup lang="ts">
const { t } = useI18n()
const { data: settings } = useCompanySettings()
useSeoMeta({ title: () => `${t('site.name')} – ${t('footer.datenschutz')}`, robots: 'noindex' })

const address = computed(() => {
  const parts = []
  if (settings.value?.street) parts.push(settings.value.street)
  if (settings.value?.zip || settings.value?.city) {
    parts.push(`${settings.value?.zip || ''} ${settings.value?.city || ''}`.trim())
  }
  return parts.join(', ')
})
</script>

<template>
  <div class="bg-white">
    <section class="relative overflow-hidden bg-gradient-to-br from-ink-900 via-brand-900 to-brand-800 text-white">
      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 20%, white 1px, transparent 1px); background-size: 32px 32px;" />
      <div class="container relative max-w-3xl py-14 md:py-20">
        <h1 class="text-3xl font-bold tracking-tight text-white md:text-4xl">{{ t('legal.datenschutz.title') }}</h1>
      </div>
    </section>

    <article class="container max-w-3xl py-10 md:py-14">
      <div class="prose prose-slate max-w-none text-ink-700">
        <h2>{{ t('legal.datenschutz.responsible.title') }}</h2>
        <p>
          {{ settings?.company_name }}<br />
          <template v-if="address">{{ address }}, </template>{{ settings?.country || 'Schweiz' }}<br />
          <template v-if="settings?.email">{{ t('footer.contact') }}: {{ settings.email }}</template>
        </p>

        <h2>{{ t('legal.datenschutz.data.title') }}</h2>
        <p>{{ t('legal.datenschutz.data.intro') }}</p>
        <ul>
          <li>{{ t('legal.datenschutz.data.items.name') }}</li>
          <li>{{ t('legal.datenschutz.data.items.email') }}</li>
          <li>{{ t('legal.datenschutz.data.items.phone') }}</li>
          <li>{{ t('legal.datenschutz.data.items.address') }}</li>
          <li>{{ t('legal.datenschutz.data.items.services') }}</li>
          <li>{{ t('legal.datenschutz.data.items.message') }}</li>
        </ul>
        <p>{{ t('legal.datenschutz.data.technical') }}</p>

        <h2>{{ t('legal.datenschutz.purpose.title') }}</h2>
        <p>{{ t('legal.datenschutz.purpose.text') }}</p>

        <h2>{{ t('legal.datenschutz.retention.title') }}</h2>
        <p>{{ t('legal.datenschutz.retention.text') }}</p>

        <h2>{{ t('legal.datenschutz.cookies.title') }}</h2>
        <p>{{ t('legal.datenschutz.cookies.text') }}</p>

        <h2>{{ t('legal.datenschutz.rights.title') }}</h2>
        <p>{{ t('legal.datenschutz.rights.text') }}</p>

        <h2>{{ t('legal.datenschutz.security.title') }}</h2>
        <p>{{ t('legal.datenschutz.security.text') }}</p>

        <h2>{{ t('legal.datenschutz.changes.title') }}</h2>
        <p>{{ t('legal.datenschutz.changes.text') }}</p>

        <p class="text-sm text-ink-500 mt-8">{{ t('legal.datenschutz.updated') }}</p>
      </div>
    </article>
  </div>
</template>
