<script setup lang="ts">
const { t } = useI18n()
const { data: settings } = useCompanySettings()
useSeoMeta({ title: () => `${t('site.name')} – ${t('footer.impressum')}`, robots: 'noindex' })

const phoneLink = computed(() => settings.value?.phone?.replace(/\s/g, '') || '')
const hasAddress = computed(() => settings.value?.street || settings.value?.zip || settings.value?.city)
const hasContact = computed(() => settings.value?.phone || settings.value?.email)
</script>

<template>
  <article class="bg-white">
    <div class="container max-w-3xl py-14 md:py-20">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('footer.impressum') }}</h1>

      <div class="prose prose-slate mt-8 max-w-none text-ink-700">
        <h2>Angaben gemäss Schweizer Recht</h2>
        <p>
          <strong>{{ settings?.company_name }}</strong><br />
          <template v-if="settings?.street">{{ settings.street }}<br /></template>
          <template v-if="settings?.zip || settings?.city">{{ settings?.zip }} {{ settings?.city }}<template v-if="settings?.canton">, Kanton {{ settings.canton }}</template><br /></template>
          {{ settings?.country || 'Schweiz' }}
        </p>

        <h2>Kontakt</h2>
        <p>
          <template v-if="settings?.phone">Telefon: {{ settings.phone }}<br /></template>
          <template v-if="settings?.email">E-Mail: {{ settings.email }}</template>
        </p>

        <h2>Verantwortlich für den Inhalt</h2>
        <p>{{ settings?.owner_name || '[Wird ergänzt]' }}</p>

        <template v-if="settings?.uid_number">
          <h2>Handelsregister / UID</h2>
          <p>UID-Nummer: {{ settings.uid_number }}</p>
        </template>

        <h2>Haftungsausschluss</h2>
        <p>
          Der Inhaber übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit, Aktualität,
          Zuverlässigkeit und Vollständigkeit der Informationen. Haftungsansprüche gegen den Inhaber wegen Schäden materieller
          oder immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der Informationen entstehen, werden ausgeschlossen.
        </p>

        <h2>Urheberrechte</h2>
        <p>
          Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien auf dieser Website gehören
          ausschliesslich dem Betreiber dieser Website oder den speziell genannten Rechteinhabern.
        </p>
      </div>
    </div>
  </article>
</template>
