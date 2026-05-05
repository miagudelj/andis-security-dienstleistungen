<script setup lang="ts">
const { t } = useI18n()
useSeoMeta({ title: () => `${t('footer.datenschutz')} — ${t('site.name')}`, robots: 'noindex' })
</script>

<template>
  <article class="bg-white">
    <div class="container max-w-3xl py-14 md:py-20">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('footer.datenschutz') }}</h1>

      <div class="prose prose-slate mt-8 max-w-none text-ink-700">
        <p class="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-900">
          <strong>Hinweis:</strong> Diese Datenschutzerklärung ist eine Mustervorlage gemäss revidiertem Schweizer Datenschutzgesetz (revDSG) und muss vor dem Live-Gang angepasst und durch eine Fachperson geprüft werden.
        </p>

        <h2>1. Verantwortliche Stelle</h2>
        <p>
          Andi's Security Dienstleistungen<br />
          [Strasse], [PLZ Ort], Schweiz<br />
          E-Mail: info@andis-security.ch
        </p>

        <h2>2. Erfasste Daten</h2>
        <p>Wir erfassen folgende Daten, wenn Sie uns über das Offerten-Formular kontaktieren:</p>
        <ul>
          <li>Vor- und Nachname</li>
          <li>E-Mail-Adresse</li>
          <li>Telefonnummer</li>
          <li>PLZ und Ort</li>
          <li>Angaben zu gewünschten Geräten und Standorten</li>
          <li>Optionale Nachricht</li>
          <li>Technische Daten: IP-Adresse (gehasht), Browser-Information, Zeitstempel</li>
        </ul>

        <h2>3. Zweck der Datenverarbeitung</h2>
        <p>Die erhobenen Daten werden ausschliesslich zur Bearbeitung Ihrer Offerten-Anfrage und zur Kontaktaufnahme verwendet. Es findet keine Weitergabe an Dritte zu Werbezwecken statt.</p>

        <h2>4. Speicherdauer</h2>
        <p>Anfragen werden so lange gespeichert, wie es zur Bearbeitung Ihrer Anfrage und zur Erfüllung allfälliger gesetzlicher Aufbewahrungspflichten notwendig ist (in der Regel 10 Jahre für Geschäftsunterlagen gemäss Schweizer Obligationenrecht).</p>

        <h2>5. Cookies und Tracking</h2>
        <p>Diese Webseite verwendet ausschliesslich technisch notwendige Session-Cookies (z.B. für den Admin-Login). Es findet kein Tracking durch Drittanbieter statt.</p>

        <h2>6. Ihre Rechte</h2>
        <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung sowie Einschränkung der Verarbeitung Ihrer personenbezogenen Daten. Wenden Sie sich dazu an die oben genannte E-Mail-Adresse.</p>

        <h2>7. Sicherheit</h2>
        <p>Wir setzen technische und organisatorische Massnahmen ein, um Ihre Daten zu schützen: HTTPS-Verschlüsselung, Hashing von Zugangsdaten, Schutz gegen Missbrauch (Rate-Limiting, Honeypot, Content Security Policy).</p>

        <p class="text-sm text-ink-500">Stand: [Datum einfügen]</p>
      </div>
    </div>
  </article>
</template>
