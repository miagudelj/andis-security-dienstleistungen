# PRESECURITY - Andi's Security Dienstleistungen

Swiss security services company website (cameras, video surveillance) for Canton of Zurich.

## Tech Stack

- **Framework:** Nuxt 4.4.2 (Vue 3, SSR)
- **Styling:** Tailwind CSS 3.4
- **State:** Pinia
- **Database:** SQLite (better-sqlite3)
- **Auth:** bcryptjs + HMAC-signed sessions
- **i18n:** German (primary) + English
- **Email:** Nodemailer
- **Validation:** Zod

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run preview      # Preview production build
npm run hash-password # Generate bcrypt hash for admin password
```

## Project Structure

```
app/
├── pages/           # Routes (index, kontakt, admin, dienstleistungen/[slug])
├── components/      # Vue components (wizard/ for multi-step form)
├── layouts/         # default.vue (public), admin.vue
├── stores/          # Pinia stores (offer.ts)
└── composables/     # useHeroVisibility.ts

server/
├── api/
│   ├── services/    # Public service endpoints
│   ├── offers/      # Offer submission
│   ├── wizard/      # Wizard config endpoint
│   └── admin/       # Protected CRUD (services, offers, wizard config)
└── utils/
    ├── db.ts        # SQLite schema & initialization
    ├── auth.ts      # Session management, IP hashing, audit log
    ├── mail.ts      # SMTP email templates
    └── rate-limit.ts

i18n/locales/        # de.json, en.json
data/                # SQLite database (auto-created, gitignored)
```

## Key Patterns

### API Routes
- Naming: `index.{method}.ts`, `[id].{method}.ts`
- All inputs validated with Zod
- Admin routes use `requireAdmin(event)` middleware
- Errors via `createError({ statusCode, statusMessage })`

### Components
- Composition API with `<script setup lang="ts">`
- Translations via `const { t } = useI18n()`
- SEO via `useSeoMeta()`

### Database
- Access via `useDB()` singleton from `/server/utils/db.ts`
- Prepared statements: `db.prepare(sql).run/get/all()`
- Schema auto-created on first run

### Styling
- Tailwind utility classes, mobile-first
- Brand colors: `brand-50` to `brand-950` (blue)
- Ink colors: `ink-50` to `ink-950` (gray)

## Security Features

- Rate limiting (login: 5/15min, offers: 3/10min, global: 150/min)
- Session IP binding (SHA-256 hash)
- HTTP-only, Secure, SameSite=Strict cookies
- Strict CSP headers
- Honeypot field for bot detection
- Audit logging for all admin actions

## Environment Variables

Required in `.env`:
```
ADMIN_PASSWORD_HASH=    # bcrypt hash (use npm run hash-password)
SESSION_SECRET=         # Min 32 chars for HMAC signing
```

Optional:
```
DB_PATH=./data/presecurity.db
NUXT_PUBLIC_SITE_URL=https://presecurity.ch
MAIL_ENABLED=true
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

## Database Tables

- `services` - CMS content (title_de/en, body, image_path, published)
- `offers` - Submitted quotes with reference numbers and status
- `sessions` - Auth sessions with expiry
- `wizard_steps` - Dynamic form step configuration
- `wizard_options` - Step options (labels, icons)
- `wizard_contact_fields` - Contact form field definitions
- `company_settings` - Firmendaten (single row, id=1)
- `audit_log` - Admin action history

## Admin Panel

Located at `/admin`. Features:
- Tab-based interface (Dienstleistungen, Offerten, Wizard, Firmendaten)
- Service CRUD with image upload
- Offer management with status workflow
- Dynamic wizard step builder
- Company settings management (address, contact, UID)

## Composables

- `useHeroVisibility()` - Hero section visibility state
- `useCompanySettings()` - Fetches company settings from `/api/settings`

## Branding

- **Logo files:** `/public/images/presecurity-logo.png` (full), `/public/images/presecurity-icon.png` (icon only)
- **Favicon:** `/public/favicon.png`, `/public/apple-touch-icon.png`
- **Header:** Icon + "PRESECURITY" text + slogan underneath
- **Footer:** Full logo (max-h-36)
- **Colors:** PRE in brand-600, SECURITY in gray

## Dynamic Company Data

Company settings are stored in DB and displayed on:
- `/kontakt` - Address, phone, email
- `/impressum` - Full legal info, owner, UID
- `/datenschutz` - Responsible party info
- `SiteFooter.vue` - Contact column
- `default.vue` - Schema.org LocalBusiness data

## Notes

- Legal pages use dynamic company settings (no more placeholders)
- Default locale is German, English available via language switcher
- Images stored in `/public/images/` and `/public/images/uploads/`
- Database: `data/presecurity.db` (single file, WAL mode)

---

## Session Progress (2026-05-23)

### Completed
1. ✅ Logo integration (transparent PNG, icon + text in header, full in footer)
2. ✅ Renamed "Presecure" → "PreSecurity" across entire codebase
3. ✅ Header: Icon + styled text "PRESECURITY" + slogan
4. ✅ Footer: Logo aligned, text columns with pt-1
5. ✅ Page titles: "PreSecurity – [Page]" format
6. ✅ Company settings system:
   - DB table `company_settings`
   - API endpoints `/api/settings` (public) and `/api/admin/settings` (CRUD)
   - Admin tab "Firmendaten" with form
   - Composable `useCompanySettings()`
   - Dynamic data on kontakt, impressum, datenschutz, footer, Schema.org
7. ✅ Database migration:
   - Transferred offer "Noelle Walter" from andis-security.db
   - Updated service images from old DB
   - Renamed presecure.db → presecurity.db
   - Deleted old DBs (andis-security.db, presecure.db)
8. ✅ Image Management im Admin:
   - API `/api/admin/images` GET - Liste aller Bilder mit Nutzungsstatus
   - API `/api/admin/images/[filename]` DELETE - Unbenutzte Bilder löschen
   - AdminServices: Bildvorschau bei Services
   - AdminServices: Bildgalerie mit Klick-Auswahl
   - AdminServices: Drag & Drop Upload
   - AdminServices: Löschen unbenutzter Bilder

### Current State
- Build: ✅ Passing
- Database: `data/presecurity.db` (single file, all data migrated)
- Services: 2 (with correct image paths)
- Offers: 2 (PRE-20260516-0DCB13, PRE-20260523-858694)
- Company settings: Default values (need to be filled in admin)

### Pending / TODO
- [ ] Fill in actual company data in Admin → Firmendaten
- [ ] Review and finalize legal pages content
- [ ] Set up .env with ADMIN_PASSWORD_HASH and SESSION_SECRET for production
