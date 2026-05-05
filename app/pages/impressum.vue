<script setup lang="ts">
const { t } = useI18n()
useSeoMeta({ title: () => `${t('footer.impressum')} — ${t('site.name')}`, robots: 'noindex' })
</script>

<template>
  <article class="bg-white">
    <div class="container max-w-3xl py-14 md:py-20">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('footer.impressum') }}</h1>

      <div class="prose prose-slate mt-8 max-w-none text-ink-700">
        <p class="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-900">
          <strong>Hinweis:</strong> Diese Seite enthält Platzhalter und muss vor dem Live-Gang vollständig durch den Inhaber ergänzt sowie rechtlich geprüft werden.
        </p>

        <h2>Angaben gemäss Schweizer Recht</h2>
        <p>
          <strong>Andi's Security Dienstleistungen</strong><br />
          [Strasse und Hausnummer]<br />
          [PLZ Ort], Kanton Zürich<br />
          Schweiz
        </p>

        <h2>Kontakt</h2>
        <p>
          Telefon: +41 00 000 00 00<br />
          E-Mail: info@andis-security.ch
        </p>

        <h2>Verantwortlich für den Inhalt</h2>
        <p>[Vor- und Nachname Inhaber:in]</p>

        <h2>Handelsregister / UID</h2>
        <p>UID-Nummer: [CHE-000.000.000] (sofern eingetragen)</p>

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
