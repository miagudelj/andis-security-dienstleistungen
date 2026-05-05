<script setup lang="ts">
import { useOfferStore } from '~/stores/offer'
const offer = useOfferStore()

// Strukturierte Daten für lokale Suche (Google).
// Defs werden nur einmal pro Seite eingefügt.
useSchemaOrg([
  defineLocalBusiness({
    name: "Andi's Security Dienstleistungen",
    description: 'Sicherheitsdienstleistungen, Kameras und Videoüberwachung im Kanton Zürich.',
    address: {
      addressCountry: 'CH',
      addressRegion: 'Zürich',
      addressLocality: '[Ort]',
      postalCode: '[PLZ]',
      streetAddress: '[Strasse Nr.]',
    },
    telephone: '+41 00 000 00 00',
    email: 'info@andis-security.ch',
    priceRange: '$$',
    areaServed: 'Kanton Zürich, Schweiz',
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
