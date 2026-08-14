<script setup lang="ts">
import type { TeamMember } from '~/types/admin'

const { t, locale } = useI18n()
useSeoMeta({
  title: () => `${t('site.name')} – ${t('about.title')}`,
  description: () => t('about.meta_description'),
})

const { data: teamMembers, status } = useFetch<TeamMember[]>('/api/team')

// Get initials for placeholder
function getInitials(member: TeamMember): string {
  return `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`.toUpperCase()
}

// Get localized content
function getPosition(member: TeamMember): string {
  return locale.value === 'en' && member.position_en ? member.position_en : member.position_de
}

function getSlogan(member: TeamMember): string {
  return locale.value === 'en' && member.slogan_en ? member.slogan_en : member.slogan_de
}
</script>

<template>
  <div class="bg-white">
    <!-- Team Section with Blue Header -->
    <section class="relative overflow-hidden bg-gradient-to-br from-ink-900 via-brand-900 to-brand-800 text-white">
      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 20%, white 1px, transparent 1px); background-size: 32px 32px;" />
      <div class="container relative py-14 md:py-20">
        <h1 class="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {{ t('about.team_title') }}
        </h1>
        <p class="mt-3 max-w-2xl text-ink-100/90">
          {{ t('about.team_subtitle') }}
        </p>
      </div>
    </section>

    <!-- Team Grid -->
    <section class="section">
      <div class="container">
        <!-- Loading State -->
        <div v-if="status === 'pending'" class="flex justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
        </div>

        <!-- Team Grid - Cards with Hover Effect -->
        <div v-else-if="teamMembers && teamMembers.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <article
            v-for="member in teamMembers"
            :key="member.id"
            class="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all duration-300 hover:shadow-xl"
          >
            <!-- Image Container -->
            <div class="relative aspect-[4/5] overflow-hidden">
              <img
                v-if="member.image_path"
                :src="member.image_path"
                :alt="`${member.first_name} ${member.last_name}`"
                class="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700"
              >
                <span class="text-4xl font-bold text-white/90 md:text-5xl">
                  {{ getInitials(member) }}
                </span>
              </div>

              <!-- Blue overlay on hover (same gradient as headers) -->
              <div class="absolute inset-0 bg-gradient-to-br from-ink-900/90 via-brand-900/90 to-brand-800/90 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center">
                <!-- Name slides up -->
                <h3 class="text-xl font-bold text-white mb-2 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-300">
                  {{ member.first_name }} {{ member.last_name }}
                </h3>
                <!-- Position fades in -->
                <p class="text-sm text-white/90 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                  {{ getPosition(member) }}
                </p>
                <!-- Slogan fades in -->
                <p
                  v-if="getSlogan(member)"
                  class="text-sm text-white/80 italic mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150 line-clamp-3"
                >
                  "{{ getSlogan(member) }}"
                </p>
              </div>

              <!-- Name at bottom (visible when not hovering) -->
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4 transition-opacity duration-300 group-hover:opacity-0">
                <h3 class="text-lg font-semibold text-white">
                  {{ member.first_name }} {{ member.last_name }}
                </h3>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty State -->
        <div v-else class="rounded-xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
          {{ t('about.no_team_members') }}
        </div>
      </div>
    </section>

    <!-- About Section with Blue Header -->
    <section class="relative overflow-hidden bg-gradient-to-br from-ink-900 via-brand-900 to-brand-800 text-white">
      <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 20% 20%, white 1px, transparent 1px); background-size: 32px 32px;" />
      <div class="container relative py-14 md:py-20">
        <h2 class="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {{ t('about.about_us_title') }}
        </h2>
      </div>
    </section>

    <!-- About Text Content -->
    <section class="section">
      <div class="container">
        <article class="max-w-3xl">
          <div class="prose prose-slate max-w-none text-ink-700 prose-headings:text-ink-900 prose-p:leading-relaxed prose-strong:text-ink-900">
            <p>
              Sicherheit ist Vertrauenssache. Genau deshalb haben wir unsere langjährige Erfahrung, unser Fachwissen und unsere Kompetenzen gebündelt, um unseren Kunden professionelle und zuverlässige Sicherheitslösungen aus einer Hand anzubieten.
            </p>

            <h3>Unsere Partner</h3>
            <p>
              Hinter unserem Unternehmen stehen zwei etablierte Firmen aus dem Raum Zürich: die <strong>Presolutions GmbH</strong> unter der Leitung von Patrick Previtali sowie die <strong>Procon IT Security Solutions GmbH</strong> unter der Leitung von Peter Schulthess. Gemeinsam verfügen wir über jahrzehntelange Erfahrung in den Bereichen Videoüberwachung, Alarmanlagen, IT-Infrastruktur und Sicherheitstechnik.
            </p>

            <p>
              Die Procon IT Security Solutions GmbH ist seit über 20 Jahren erfolgreich in der Sicherheitsbranche tätig und durfte in dieser Zeit zahlreiche Projekte für Unternehmen unterschiedlichster Grössen realisieren. Zu den Referenzen zählen unter anderem schweizweite Installationen für namhafte Unternehmen wie McDonald's. Die langjährige Praxiserfahrung und das technische Know-how bilden dabei eine wichtige Grundlage für unsere gemeinsamen Projekte.
            </p>

            <p>
              Die Presolutions GmbH ergänzt diese Erfahrung durch moderne IT-Dienstleistungen, Projektplanung, Kundenberatung und die technische Umsetzung individueller Sicherheitslösungen. Bereits seit mehreren Jahren arbeiten beide Unternehmen eng zusammen und haben zahlreiche Projekte erfolgreich realisiert.
            </p>

            <h3>Unsere Mission</h3>
            <p>
              Mit der Gründung dieses gemeinsamen Portals schaffen wir eine zentrale Anlaufstelle für moderne Videoüberwachung, Alarmanlagen und Sicherheitslösungen. Unser Ziel ist es, Privatpersonen, Unternehmen, Verwaltungen und Organisationen hochwertige Produkte sowie kompetente Beratung und professionelle Installation aus einer Hand anzubieten.
            </p>

            <h3>Unser Netzwerk</h3>
            <p>
              Darüber hinaus verfügen wir über ein erweitertes Netzwerk von qualifizierten Fachpartnern und Technikern aus den Bereichen Elektroinstallation und Infrastruktur, wodurch wir auch grössere Projekte effizient und professionell umsetzen können.
            </p>

            <h3>Unsere Philosophie</h3>
            <p>
              Unsere Philosophie ist einfach: <strong>Ehrliche Beratung, hochwertige Produkte, saubere Installationen und langfristige Kundenzufriedenheit.</strong> Wir verkaufen nicht einfach Technik – wir schaffen Sicherheitslösungen, die auf die individuellen Bedürfnisse unserer Kunden abgestimmt sind.
            </p>

            <p class="text-lg font-medium text-ink-900">
              Wir freuen uns darauf, auch Ihr Projekt gemeinsam mit Ihnen zu realisieren.
            </p>
          </div>
        </article>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-brand-600 py-14 md:py-20 text-white">
      <div class="container">
        <div class="max-w-2xl">
          <h2 class="text-2xl font-bold tracking-tight md:text-3xl">
            {{ t('about.cta_title') }}
          </h2>
          <p class="mt-3 text-brand-100">
            {{ t('about.cta_subtitle') }}
          </p>
          <div class="mt-6 flex flex-wrap gap-4">
            <NuxtLink
              to="/kontakt"
              class="btn bg-white text-brand-700 hover:bg-brand-50"
            >
              {{ t('about.cta_contact') }}
            </NuxtLink>
            <NuxtLink
              to="/#wizard"
              class="btn border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50"
            >
              {{ t('about.cta_quote') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
