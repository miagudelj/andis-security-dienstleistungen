<script setup lang="ts">
import { useOfferStore } from '~/stores/offer'
const offer = useOfferStore()
const { data: settings } = useCompanySettings()

// Strukturierte Daten für lokale Suche (Google).
// Defs werden nur einmal pro Seite eingefügt.
useSchemaOrg([
  defineLocalBusiness({
    name: computed(() => settings.value?.company_name || 'PreSecurity'),
    description: 'Sicherheitsdienstleistungen, Kameras und Videoüberwachung im Kanton Zürich.',
    address: {
      addressCountry: 'CH',
      addressRegion: computed(() => settings.value?.canton || 'Zürich'),
      addressLocality: computed(() => settings.value?.city || ''),
      postalCode: computed(() => settings.value?.zip || ''),
      streetAddress: computed(() => settings.value?.street || ''),
    },
    telephone: computed(() => settings.value?.phone || ''),
    email: computed(() => settings.value?.email || ''),
    priceRange: '$$',
    areaServed: computed(() => `Kanton ${settings.value?.canton || 'Zürich'}, ${settings.value?.country || 'Schweiz'}`),
  }),
])
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <StickyOfferButton @click="offer.openOverlay()" />
    <ClientOnly>
      <OfferOverlay v-if="offer.open" />
    </ClientOnly>
  </div>
</template>
