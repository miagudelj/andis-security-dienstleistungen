# PRESECURITY - Andi's Security Dienstleistungen

Swiss security services company website (cameras, video surveillance) for Canton of Zurich.

## Tech Stack

- **Framework:** Nuxt 4.4.2 (Vue 3, SSR)
- **Styling:** Tailwind CSS 3.4
- **State:** Pinia
- **Database:** SQLite (better-sqlite3, WAL mode)
- **Auth:** bcryptjs + HMAC-signed sessions
- **i18n:** German (primary) + English
- **Email:** Nodemailer (currently disabled)
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
├── components/      # Vue components (wizard/, admin/)
│   └── admin/       # AdminOffers, AdminServices, AdminWizard, AdminSettings
├── layouts/         # default.vue (public), admin.vue
├── stores/          # Pinia stores (offer.ts)
├── composables/     # useHeroVisibility, useCompanySettings
└── types/           # admin.ts (types, constants, helpers)

server/
├── api/
│   ├── services/    # Public service endpoints
│   ├── offers/      # Offer submission
│   ├── wizard/      # Wizard config endpoint
│   ├── settings.get.ts  # Public company settings
│   └── admin/       # Protected CRUD endpoints
│       ├── services/    # CRUD + image management
│       ├── offers/      # Status/assignee/notes updates
│       ├── wizard/      # steps/, options/, contact-fields/
│       ├── settings/    # Company settings CRUD
│       ├── images/      # Image list & delete
│       ├── uploads/     # Image upload
│       └── password.put.ts  # Admin password change
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
- **PUT endpoints use dynamic UPDATE queries** — only provided fields are updated
- **Boolean fields accept both `true/false` and `1/0`** via `z.union([z.boolean(), z.number()])`
- **English fields are optional** with `.default('')`
- **sort_order auto-calculated** if not provided: `MAX(sort_order) + 10`

### Components
- Composition API with `<script setup lang="ts">`
- Translations via `const { t } = useI18n()`
- SEO via `useSeoMeta()`
- **Date formatting:** Swiss format `DD.MM.YYYY` via `toLocaleDateString('de-CH')`

### Database
- Access via `useDB()` singleton from `/server/utils/db.ts`
- Prepared statements: `db.prepare(sql).run/get/all()`
- Schema auto-created on first run
- WAL mode enabled for better concurrency

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
MAIL_ENABLED=false      # Currently disabled
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

## Database Tables

- `services` - CMS content (title_de/en, summary, body, image_path, published)
- `offers` - Submitted quotes with reference numbers, status, assigned_to, notes
- `sessions` - Auth sessions with expiry
- `wizard_steps` - Dynamic form step configuration (drag & drop sortable)
- `wizard_options` - Step options (labels, icons, descriptions)
- `wizard_contact_fields` - Contact form field definitions
- `company_settings` - Firmendaten (single row, id=1)
- `audit_log` - Admin action history

## Admin Panel

Located at `/admin`. Password: configured via `ADMIN_PASSWORD_HASH` env var.

### Tabs

1. **Dienstleistungen**
   - Service CRUD with slug, titles (DE/EN), summaries, body text
   - Image field with drag & drop upload
   - Image picker modal with gallery of existing images
   - Delete unused images

2. **Offerten**
   - Table view (default) or card view
   - Pagination (25/50/100 per page) for thousands of offers
   - Filters: search, status, date range
   - Click row to open slide-over detail panel
   - Inline status/assignee editing
   - Internal notes field
   - Swiss date format (DD.MM.YYYY)

3. **Wizard**
   - Step management (multi_select, single_select, quantity_input, contact_form, free_text)
   - Drag & drop reordering of steps
   - Options per step with icons
   - Contact form field configuration
   - Active/inactive toggle

4. **Firmendaten**
   - Company name, owner, address
   - Phone, email, website
   - UID (Unternehmens-Identifikationsnummer)
   - Password change functionality

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

## Offer/Consultation Pricing

- **Offerte (Quote):** Kostenlos (free)
- **Telefonische Beratung:** Kostenlos (free)
- **Vor-Ort-Beratung:** CHF 50.– (refunded upon order confirmation)
- Displayed in: Blue CTA banner, Wizard step 4 consultation type selection

## Notes

- Legal pages use dynamic company settings
- Default locale is German, English available via language switcher
- Images stored in `/public/images/` and `/public/images/uploads/`
- Database: `data/presecurity.db` (single file, WAL mode)
- Email sending currently disabled (MAIL_ENABLED=false)
