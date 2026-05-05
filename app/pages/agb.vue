<script setup lang="ts">
const { t } = useI18n()
useSeoMeta({ title: () => `${t('footer.agb')} — ${t('site.name')}`, robots: 'noindex' })
</script>

<template>
  <article class="bg-white">
    <div class="container max-w-3xl py-14 md:py-20">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('footer.agb') }}</h1>

      <div class="prose prose-slate mt-8 max-w-none text-ink-700">
        <p class="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-900">
          <strong>Hinweis:</strong> Diese AGB sind eine Mustervorlage und müssen zwingend von einer Fachperson auf Ihre Geschäftstätigkeit angepasst werden, bevor die Webseite live geht.
        </p>

        <h2>1. Geltungsbereich</h2>
        <p>Diese Allgemeinen Geschäftsbedingungen (AGB) regeln das Vertragsverhältnis zwischen Andi's Security Dienstleistungen ("Anbieter") und der Kundschaft im Zusammenhang mit Beratungs-, Planungs-, Installations- und Wartungsleistungen für Sicherheitssysteme.</p>

        <h2>2. Offerte und Vertragsabschluss</h2>
        <p>Alle Offerten sind unverbindlich und freibleibend. Ein Vertrag kommt erst durch die schriftliche Auftragsbestätigung des Anbieters bzw. mit Aufnahme der Arbeiten zustande.</p>

        <h2>3. Preise und Zahlungsbedingungen</h2>
        <p>Es gelten die in der Auftragsbestätigung genannten Preise in Schweizer Franken (CHF), exkl. allfälliger Mehrwertsteuer. Rechnungen sind innerhalb von 30 Tagen netto ab Rechnungsdatum zu begleichen.</p>

        <h2>4. Leistungserbringung</h2>
        <p>Der Anbieter erbringt die vereinbarten Leistungen fachgerecht und nach den anerkannten Regeln der Technik. Termine sind verbindlich, sofern sie schriftlich als solche bezeichnet wurden.</p>

        <h2>5. Gewährleistung</h2>
        <p>Es gelten die gesetzlichen Gewährleistungsbestimmungen sowie die Garantieleistungen der jeweiligen Hersteller der eingebauten Komponenten.</p>

        <h2>6. Haftung</h2>
        <p>Die Haftung des Anbieters für leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig. Für Schäden infolge eines Ausfalls der installierten Systeme wird keine Haftung übernommen.</p>

        <h2>7. Anwendbares Recht und Gerichtsstand</h2>
        <p>Es gilt schweizerisches Recht. Ausschliesslicher Gerichtsstand ist [Ort], Schweiz.</p>

        <p class="text-sm text-ink-500">Stand: [Datum einfügen]</p>
      </div>
    </div>
  </article>
</template>
