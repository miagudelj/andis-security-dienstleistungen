# PreSecurity

Webseite für Sicherheitsdienstleistungen (Kameras, Videoüberwachung) im Kanton Zürich.
Modern, mehrsprachig (DE/EN), mit Multi-Step Offerten-Formular und Admin-GUI für die Pflege der Inhalte.

## Tech-Stack

- **Nuxt 4** (Vue 3 + SSR — gut für Google-SEO)
- **Tailwind CSS** für das Styling
- **Pinia** für State (Offerten-Overlay)
- **@nuxtjs/i18n** für Deutsch/Englisch
- **@nuxtjs/seo** für Meta-Tags, Sitemap, Schema.org (LocalBusiness)
- **nuxt-security** für sichere HTTP-Header (CSP, HSTS, XSS-Schutz)
- **better-sqlite3** als kleine, dateibasierte Datenbank
- **bcryptjs** für sicheres Passwort-Hashing
- **Zod** für Input-Validierung

## Voraussetzungen

- Node.js 20+ (getestet mit 24)
- npm

## Erste Inbetriebnahme

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Environment-Datei erstellen
cp .env.example .env

# 3. Admin-Passwort als bcrypt-Hash generieren
npm run hash-password
# (Passwort eingeben — Eingabe ist versteckt — und den Hash kopieren)

# 4. In .env eintragen:
#    ADMIN_PASSWORD_HASH=<der generierte Hash>
#    SESSION_SECRET=<langer Zufallsstring, mind. 32 Zeichen>
# Session-Secret erzeugen:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 5. Dev-Server starten
npm run dev
```

Webseite läuft auf http://localhost:3000
Admin-Login: http://localhost:3000/admin

## Ordnerstruktur

```
.
├── app/
│   ├── app.vue                  # Root-Komponente
│   ├── layouts/
│   │   ├── default.vue          # Public-Layout (Header, Footer, sticky Offer-Button)
│   │   └── admin.vue            # Admin-Layout (clean, kein Header)
│   ├── pages/
│   │   ├── index.vue            # Startseite mit Hero + Services
│   │   ├── dienstleistungen/    # Services-Übersicht + Detailseite
│   │   ├── kontakt.vue
│   │   ├── impressum.vue        # Dynamisch aus Firmendaten
│   │   ├── agb.vue              # ⚠ Platzhalter — vor Live-Gang anpassen
│   │   ├── datenschutz.vue      # Dynamisch aus Firmendaten
│   │   └── admin/index.vue      # Admin-GUI (Login + CRUD)
│   ├── components/              # Header, Footer, OfferOverlay, LanguageSwitcher, ...
│   └── stores/                  # Pinia-Stores (offer.ts)
├── server/
│   ├── api/                     # Nitro API-Routen
│   │   ├── services/            # Public: Liste + Detail
│   │   ├── offers/              # Public: Offerte einreichen
│   │   ├── devices.get.ts       # Public: Geräteliste für Offerten-Form
│   │   ├── locations.get.ts     # Public: Standorte für Offerten-Form
│   │   └── admin/               # Geschützt: Login, Logout, CRUD
│   └── utils/                   # db.ts, auth.ts, rate-limit.ts
├── i18n/locales/                # de.json, en.json
├── assets/css/main.css          # Tailwind-Layer + Komponenten-Klassen
├── public/                      # Statische Dateien (favicon, robots.txt, Bilder)
├── docs/images/                 # Bildersourcing-Dokumentation
├── data/                        # SQLite-DB (wird automatisch erstellt, NICHT im Git)
├── scripts/hash-password.mjs    # CLI für Passwort-Hashing
├── nuxt.config.ts
├── tailwind.config.ts
└── .env.example
```

## Sicherheits-Massnahmen (eingebaut)

- ✅ Passwort-Hashing mit bcrypt (cost 12)
- ✅ Sessions über HTTP-only, Secure, SameSite=Strict Cookies (HMAC-signiert)
- ✅ Rate-Limiting: Login (5/15min/IP), Offerten (3/10min/IP), global (150/min/IP)
- ✅ Strict CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff
- ✅ Input-Validierung mit Zod auf allen Endpoints
- ✅ Parameterisierte SQL-Queries (better-sqlite3) — keine SQL-Injection
- ✅ Honeypot-Feld im Offerten-Formular gegen Bots
- ✅ Audit-Log für Login/Logout/CRUD-Aktionen
- ✅ Admin-URL `/admin` ist via `robots.txt` und `noindex` von Suchmaschinen ausgeschlossen
- ✅ IP-Adressen werden nur als SHA-256-Hash gespeichert (DSG-konform)
- ✅ Keine Geheimnisse im Frontend-Bundle

## SEO-Massnahmen

- ✅ Server-Side Rendering (SSR) — perfekt indexierbar
- ✅ Pro-Seite Meta-Tags via `useSeoMeta()`
- ✅ LocalBusiness Schema.org (strukturierte Daten für Google "Local Pack")
- ✅ Automatische sitemap.xml (via @nuxtjs/seo)
- ✅ robots.txt mit Sitemap-Eintrag
- ✅ hreflang-Tags für DE/EN (via @nuxtjs/i18n)
- ✅ Open Graph + Twitter Card (via @nuxtjs/seo)
- ✅ Mobile-first responsive
- ✅ Lazy-loading für Bilder

## Inhaltspflege via Admin-GUI

1. http://localhost:3000/admin öffnen
2. Mit dem konfigurierten Passwort einloggen
3. Tabs:
   - **Offerten**: Eingegangene Offerten ansehen, Status verwalten, Notizen hinzufügen
   - **Dienstleistungen**: Anlegen, Bearbeiten, Löschen mit integrierter Bildverwaltung
   - **Wizard**: Offerten-Formular konfigurieren (Schritte, Optionen, Felder)
   - **Firmendaten**: Kontaktdaten zentral pflegen (erscheinen auf Kontakt, Impressum, Datenschutz, Footer)

## Bildverwaltung

Im Admin unter "Dienstleistungen" beim Bearbeiten:
- **Bildvorschau** des aktuellen Bildes
- **Bildgalerie** mit allen vorhandenen Bildern (Klick zum Auswählen)
- **Drag & Drop Upload** neuer Bilder
- **Löschen** unbenutzter Bilder direkt in der Galerie

Bildordner:
- `/public/images/services/` — Statische Bilder
- `/public/images/uploads/` — Vom Admin hochgeladene Bilder

## Production-Build

```bash
npm run build
npm run preview
```

## Vor dem Live-Gang ⚠

- [ ] AGB von Fachperson prüfen lassen (aktuell Mustertext)
- [ ] Firmendaten im Admin unter "Firmendaten" vollständig ausfüllen
- [ ] Bilder durch echte Aufnahmen oder ausgewählte Stock-Fotos ersetzen
- [ ] `NUXT_PUBLIC_SITE_URL` auf die Production-Domain setzen
- [ ] Starkes, einzigartiges Admin-Passwort setzen (mind. 16 Zeichen, nur in `.env`)
- [ ] HTTPS sicherstellen (Hosting muss Zertifikat liefern; Let's Encrypt oder Cloudflare)
- [ ] Backup-Strategie für `data/presecurity.db` einrichten
- [ ] Google Search Console + Bing Webmaster Tools einrichten
- [ ] Lokale Einträge: Google Business Profile, local.ch, Yelp Schweiz

## E-Mail-Bestätigung einrichten

Nach Eingang einer Offerte kann automatisch eine Bestätigung an den Kunden gesendet werden.

1. SMTP-Server konfigurieren in `.env`:
```env
MAIL_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@presecurity.ch
```

2. Dev-Server neu starten

Die E-Mail enthält:
- Referenznummer der Offerte
- Zusammenfassung der Kontaktdaten
- Die vom Kunden eingegebene Nachricht
- Hinweis, dass sich jemand innerhalb eines Werktags melden wird

## Roadmap (später)

- E-Mail-Benachrichtigung an Admin bei neuen Offerten
- PDF-Export der Offerten im Admin-GUI
- Mehrere Admin-Accounts mit Rollen
- Migration von SQLite zu PostgreSQL bei höherer Last

---

**Lizenz:** Privat, alle Rechte vorbehalten.
