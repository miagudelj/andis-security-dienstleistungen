<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-12 border-t border-ink-100 bg-ink-900 text-ink-100">
    <div class="container grid gap-8 py-12 md:grid-cols-4">
      <div class="md:col-span-2">
        <div class="flex items-center gap-2">
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z"/></svg>
          </span>
          <span class="text-base font-semibold text-white">{{ t('site.name') }}</span>
        </div>
        <p class="mt-3 max-w-md text-sm text-ink-300">{{ t('footer.tagline') }}</p>
      </div>

      <div>
        <h4 class="text-sm font-semibold text-white">{{ t('footer.legal') }}</h4>
        <ul class="mt-3 space-y-2 text-sm">
          <li><NuxtLink :to="localePath('/impressum')" class="text-ink-300 hover:text-white">{{ t('footer.impressum') }}</NuxtLink></li>
          <li><NuxtLink :to="localePath('/agb')" class="text-ink-300 hover:text-white">{{ t('footer.agb') }}</NuxtLink></li>
          <li><NuxtLink :to="localePath('/datenschutz')" class="text-ink-300 hover:text-white">{{ t('footer.datenschutz') }}</NuxtLink></li>
        </ul>
      </div>

      <div>
        <h4 class="text-sm font-semibold text-white">{{ t('footer.contact') }}</h4>
        <ul class="mt-3 space-y-2 text-sm text-ink-300">
          <li>Andi's Security</li>
          <li>[Adresse], Kanton Zürich</li>
          <li><a href="mailto:info@andis-security.ch" class="hover:text-white">info@andis-security.ch</a></li>
          <li><a href="tel:+41000000000" class="hover:text-white">+41 00 000 00 00</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-ink-800 py-5">
      <div class="container flex flex-col items-center justify-between gap-2 text-xs text-ink-400 md:flex-row">
        <span>{{ t('footer.copyright', { year }) }}</span>
        <NuxtLink :to="localePath('/admin')" class="hover:text-ink-200">Admin</NuxtLink>
      </div>
    </div>
  </footer>
</template>
