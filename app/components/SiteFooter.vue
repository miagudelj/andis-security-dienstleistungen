<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const year = new Date().getFullYear()
const { data: settings } = useCompanySettings()

const phoneLink = computed(() => settings.value?.phone?.replace(/\s/g, '') || '')
</script>

<template>
  <footer class="mt-12 border-t border-ink-100 bg-ink-900 text-ink-100">
    <div class="container grid items-start gap-8 py-12 md:grid-cols-4">
      <div class="md:col-span-2">
        <img src="/images/presecurity-logo.png" alt="PreSecurity" class="max-h-36 w-auto" />
      </div>

      <div class="pt-1">
        <h4 class="text-sm font-semibold text-white">{{ t('footer.legal') }}</h4>
        <ul class="mt-3 space-y-2 text-sm">
          <li><NuxtLink :to="localePath('/impressum')" class="text-ink-300 hover:text-white">{{ t('footer.impressum') }}</NuxtLink></li>
          <li><NuxtLink :to="localePath('/agb')" class="text-ink-300 hover:text-white">{{ t('footer.agb') }}</NuxtLink></li>
          <li><NuxtLink :to="localePath('/datenschutz')" class="text-ink-300 hover:text-white">{{ t('footer.datenschutz') }}</NuxtLink></li>
        </ul>
      </div>

      <div class="pt-1">
        <h4 class="text-sm font-semibold text-white">{{ t('footer.contact') }}</h4>
        <ul class="mt-3 space-y-2 text-sm text-ink-300">
          <li>{{ settings?.company_name }}</li>
          <li v-if="settings?.street || settings?.zip || settings?.city">
            <template v-if="settings?.street">{{ settings.street }}, </template>{{ settings?.zip }} {{ settings?.city }}<template v-if="settings?.canton">, Kanton {{ settings.canton }}</template>
          </li>
          <li v-if="settings?.email"><a :href="`mailto:${settings.email}`" class="hover:text-white">{{ settings.email }}</a></li>
          <li v-if="settings?.phone"><a :href="`tel:${phoneLink}`" class="hover:text-white">{{ settings.phone }}</a></li>
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
