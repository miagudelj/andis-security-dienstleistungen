import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

let _db: Database.Database | null = null

export function useDB(): Database.Database {
  if (_db) return _db

  const config = useRuntimeConfig()
  const dbPath = resolve(config.dbPath)
  mkdirSync(dirname(dbPath), { recursive: true })

  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      title_de    TEXT NOT NULL,
      title_en    TEXT NOT NULL,
      summary_de  TEXT NOT NULL,
      summary_en  TEXT NOT NULL,
      body_de     TEXT NOT NULL DEFAULT '',
      body_en     TEXT NOT NULL DEFAULT '',
      image_path  TEXT NOT NULL DEFAULT '',
      icon        TEXT NOT NULL DEFAULT '',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      published   INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS devices (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      label_de    TEXT NOT NULL,
      label_en    TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      active      INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS locations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT NOT NULL UNIQUE,
      label_de    TEXT NOT NULL,
      label_en    TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      active      INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS offers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      reference     TEXT NOT NULL UNIQUE,
      devices_json  TEXT NOT NULL,
      locations_json TEXT NOT NULL,
      first_name    TEXT NOT NULL,
      last_name     TEXT NOT NULL,
      email         TEXT NOT NULL,
      phone         TEXT NOT NULL,
      zip           TEXT NOT NULL,
      city          TEXT NOT NULL,
      message       TEXT NOT NULL DEFAULT '',
      consent       INTEGER NOT NULL DEFAULT 0,
      ip_hash       TEXT NOT NULL DEFAULT '',
      user_agent    TEXT NOT NULL DEFAULT '',
      status        TEXT NOT NULL DEFAULT 'new',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at  TEXT NOT NULL,
      ip_hash     TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      action      TEXT NOT NULL,
      target      TEXT NOT NULL DEFAULT '',
      detail      TEXT NOT NULL DEFAULT '',
      ip_hash     TEXT NOT NULL DEFAULT '',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_offers_created ON offers(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_services_published ON services(published, sort_order);

    -- Wizard configuration tables
    CREATE TABLE IF NOT EXISTS wizard_steps (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      slug            TEXT NOT NULL UNIQUE,
      step_type       TEXT NOT NULL CHECK(step_type IN ('multi_select', 'single_select', 'quantity_input', 'contact_form', 'free_text')),
      title_de        TEXT NOT NULL,
      title_en        TEXT NOT NULL,
      subtitle_de     TEXT NOT NULL DEFAULT '',
      subtitle_en     TEXT NOT NULL DEFAULT '',
      error_message_de TEXT NOT NULL DEFAULT '',
      error_message_en TEXT NOT NULL DEFAULT '',
      is_required     INTEGER NOT NULL DEFAULT 1,
      min_selections  INTEGER NOT NULL DEFAULT 0,
      max_selections  INTEGER NOT NULL DEFAULT 99,
      sort_order      INTEGER NOT NULL DEFAULT 0,
      active          INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wizard_options (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      step_id         INTEGER NOT NULL REFERENCES wizard_steps(id) ON DELETE CASCADE,
      slug            TEXT NOT NULL,
      label_de        TEXT NOT NULL,
      label_en        TEXT NOT NULL,
      description_de  TEXT NOT NULL DEFAULT '',
      description_en  TEXT NOT NULL DEFAULT '',
      icon            TEXT NOT NULL DEFAULT '',
      sort_order      INTEGER NOT NULL DEFAULT 0,
      active          INTEGER NOT NULL DEFAULT 1,
      UNIQUE(step_id, slug)
    );

    CREATE TABLE IF NOT EXISTS wizard_contact_fields (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      step_id         INTEGER NOT NULL REFERENCES wizard_steps(id) ON DELETE CASCADE,
      field_name      TEXT NOT NULL,
      field_type      TEXT NOT NULL CHECK(field_type IN ('text', 'email', 'tel', 'textarea', 'checkbox')),
      label_de        TEXT NOT NULL,
      label_en        TEXT NOT NULL,
      placeholder_de  TEXT NOT NULL DEFAULT '',
      placeholder_en  TEXT NOT NULL DEFAULT '',
      is_required     INTEGER NOT NULL DEFAULT 1,
      validation_regex TEXT NOT NULL DEFAULT '',
      sort_order      INTEGER NOT NULL DEFAULT 0,
      UNIQUE(step_id, field_name)
    );

    CREATE INDEX IF NOT EXISTS idx_wizard_steps_active ON wizard_steps(active, sort_order);
    CREATE INDEX IF NOT EXISTS idx_wizard_options_step ON wizard_options(step_id, active, sort_order);
    CREATE INDEX IF NOT EXISTS idx_wizard_contact_fields_step ON wizard_contact_fields(step_id, sort_order);

    -- Company settings (single row)
    CREATE TABLE IF NOT EXISTS company_settings (
      id              INTEGER PRIMARY KEY CHECK (id = 1),
      company_name    TEXT NOT NULL DEFAULT 'PreSecurity',
      street          TEXT NOT NULL DEFAULT '',
      zip             TEXT NOT NULL DEFAULT '',
      city            TEXT NOT NULL DEFAULT '',
      canton          TEXT NOT NULL DEFAULT 'Zürich',
      country         TEXT NOT NULL DEFAULT 'Schweiz',
      phone           TEXT NOT NULL DEFAULT '',
      email           TEXT NOT NULL DEFAULT '',
      website         TEXT NOT NULL DEFAULT '',
      uid_number      TEXT NOT NULL DEFAULT '',
      owner_name      TEXT NOT NULL DEFAULT '',
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Insert default row if not exists
    INSERT OR IGNORE INTO company_settings (id) VALUES (1);
  `)

  // Add steps_data_json column if not exists
  try {
    db.exec(`ALTER TABLE offers ADD COLUMN steps_data_json TEXT NOT NULL DEFAULT '{}'`)
  } catch {
    // Column already exists
  }

  // Add assigned_to column if not exists
  try {
    db.exec(`ALTER TABLE offers ADD COLUMN assigned_to TEXT NOT NULL DEFAULT ''`)
  } catch {
    // Column already exists
  }

  // Add completed_at column if not exists
  try {
    db.exec(`ALTER TABLE offers ADD COLUMN completed_at TEXT`)
  } catch {
    // Column already exists
  }

  // Add notes column if not exists (nullable)
  try {
    db.exec(`ALTER TABLE offers ADD COLUMN notes TEXT`)
  } catch {
    // Column already exists
  }

  // Add autocomplete column to wizard_contact_fields if not exists
  try {
    db.exec(`ALTER TABLE wizard_contact_fields ADD COLUMN autocomplete TEXT NOT NULL DEFAULT ''`)
  } catch {
    // Column already exists
  }

  seedIfEmpty(db)
  migrateToWizardConfig(db)
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM services').get() as { c: number }
  if (count.c > 0) return

  const insertService = db.prepare(`
    INSERT INTO services (slug, title_de, title_en, summary_de, summary_en, body_de, body_en, image_path, icon, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const services = [
    {
      slug: 'kameraueberwachung',
      title_de: 'Kameraüberwachung',
      title_en: 'Camera Surveillance',
      summary_de: 'IP- und HD-Kamerasysteme für Privathaushalte und Gewerbe im Kanton Zürich.',
      summary_en: 'IP and HD camera systems for homes and businesses in the canton of Zurich.',
      body_de: 'Wir planen, installieren und warten Kameralösungen abgestimmt auf Ihre Räumlichkeiten. Von der Eingangstür bis zum Aussenbereich – diskret, unauffällig und in scharfer Bildqualität.',
      body_en: 'We plan, install and maintain camera solutions tailored to your premises. From the front door to outdoor areas – discreet, unobtrusive and in sharp image quality.',
      image_path: '/images/services/kameraueberwachung.jpg',
      icon: 'camera',
      sort_order: 10,
    },
    {
      slug: 'videoueberwachungssysteme',
      title_de: 'Videoüberwachungssysteme',
      title_en: 'Video Surveillance Systems',
      summary_de: 'Komplette NVR/DVR-Systeme mit Aufzeichnung, Fernzugriff und Bewegungserkennung.',
      summary_en: 'Complete NVR/DVR systems with recording, remote access and motion detection.',
      body_de: 'Wir richten Video­über­wachungs­systeme inklusive sicherer Aufzeichnung, Fernzugriff per App und intelligenter Bewegungs­erkennung ein. Auf Wunsch mit Alarm­benach­richtigung in Echtzeit.',
      body_en: 'We set up video surveillance systems including secure recording, remote app access and intelligent motion detection. Optional real-time alarm notifications.',
      image_path: '/images/services/videoueberwachungssysteme.jpg',
      icon: 'video',
      sort_order: 20,
    },
  ]

  const insertDevice = db.prepare('INSERT INTO devices (slug, label_de, label_en, sort_order) VALUES (?, ?, ?, ?)')
  const devices = [
    ['kamera-aussen', 'Aussenkamera', 'Outdoor camera', 10],
    ['kamera-innen', 'Innenkamera', 'Indoor camera', 20],
    ['ip-kamera', 'IP-Kamera (HD/4K)', 'IP camera (HD/4K)', 30],
    ['kuppel-kamera', 'Kuppel-/Dome-Kamera', 'Dome camera', 40],
    ['nvr-aufzeichnung', 'NVR/DVR-Aufzeichnung', 'NVR/DVR recording', 50],
    ['bewegungssensor', 'Bewegungssensor', 'Motion sensor', 60],
  ]

  const insertLocation = db.prepare('INSERT INTO locations (slug, label_de, label_en, sort_order) VALUES (?, ?, ?, ?)')
  const locations = [
    ['eingang', 'Eingang / Haustür', 'Entrance / front door', 10],
    ['garage', 'Garage / Einfahrt', 'Garage / driveway', 20],
    ['fenster', 'Fenster / Balkon', 'Windows / balcony', 30],
    ['aussenwand', 'Aussenwand / Fassade', 'Outdoor wall / facade', 40],
    ['garten', 'Garten / Aussenbereich', 'Garden / outdoor area', 50],
    ['innenraum', 'Innenraum', 'Indoor space', 60],
    ['gewerbe', 'Gewerbe / Lager', 'Commercial / warehouse', 70],
  ]

  const tx = db.transaction(() => {
    for (const s of services) {
      insertService.run(s.slug, s.title_de, s.title_en, s.summary_de, s.summary_en, s.body_de, s.body_en, s.image_path, s.icon, s.sort_order)
    }
    for (const d of devices) insertDevice.run(...d)
    for (const l of locations) insertLocation.run(...l)
  })
  tx()
}

function migrateToWizardConfig(db: Database.Database) {
  // Check if wizard_steps already has data
  const stepCount = db.prepare('SELECT COUNT(*) as c FROM wizard_steps').get() as { c: number }
  if (stepCount.c > 0) return

  const tx = db.transaction(() => {
    // Step 1: Device selection (from devices table)
    const step1 = db.prepare(`
      INSERT INTO wizard_steps (slug, step_type, title_de, title_en, subtitle_de, subtitle_en, error_message_de, error_message_en, is_required, min_selections, sort_order)
      VALUES ('devices', 'multi_select', 'Welche Geräte interessieren Sie?', 'Which devices are you interested in?',
              'Mehrfachauswahl möglich. Sie können die Anzahl im nächsten Schritt anpassen.',
              'Multiple selection possible. You can adjust quantities in the next step.',
              'Bitte mindestens ein Gerät auswählen.', 'Please select at least one device.',
              1, 1, 10)
    `).run()
    const step1Id = step1.lastInsertRowid

    // Migrate devices to wizard_options
    const devices = db.prepare('SELECT slug, label_de, label_en, sort_order FROM devices WHERE active = 1 ORDER BY sort_order').all() as any[]
    const insertOption = db.prepare('INSERT INTO wizard_options (step_id, slug, label_de, label_en, sort_order) VALUES (?, ?, ?, ?, ?)')
    for (const d of devices) {
      insertOption.run(step1Id, d.slug, d.label_de, d.label_en, d.sort_order)
    }

    // Step 2: Quantity input (linked to step 1 selections)
    db.prepare(`
      INSERT INTO wizard_steps (slug, step_type, title_de, title_en, subtitle_de, subtitle_en, is_required, sort_order)
      VALUES ('quantities', 'quantity_input', 'Anzahl pro Gerät', 'Quantity per device',
              'Wie viele Geräte benötigen Sie ungefähr? Eine Schätzung genügt.',
              'Approximately how many devices do you need? An estimate is sufficient.',
              0, 20)
    `).run()

    // Step 3: Location selection (from locations table)
    const step3 = db.prepare(`
      INSERT INTO wizard_steps (slug, step_type, title_de, title_en, subtitle_de, subtitle_en, error_message_de, error_message_en, is_required, min_selections, sort_order)
      VALUES ('locations', 'multi_select', 'Wo sollen die Geräte installiert werden?', 'Where should the devices be installed?',
              'Mehrfachauswahl möglich.', 'Multiple selection possible.',
              'Bitte mindestens einen Standort wählen.', 'Please select at least one location.',
              1, 1, 30)
    `).run()
    const step3Id = step3.lastInsertRowid

    // Migrate locations to wizard_options
    const locations = db.prepare('SELECT slug, label_de, label_en, sort_order FROM locations WHERE active = 1 ORDER BY sort_order').all() as any[]
    for (const l of locations) {
      insertOption.run(step3Id, l.slug, l.label_de, l.label_en, l.sort_order)
    }

    // Step 4: Contact form
    const step4 = db.prepare(`
      INSERT INTO wizard_steps (slug, step_type, title_de, title_en, subtitle_de, subtitle_en, is_required, sort_order)
      VALUES ('contact', 'contact_form', 'Ihre Kontaktdaten', 'Your contact details',
              'Wir melden uns innerhalb eines Werktags bei Ihnen.',
              'We will contact you within one business day.',
              1, 40)
    `).run()
    const step4Id = step4.lastInsertRowid

    // Insert contact form fields
    const insertField = db.prepare(`
      INSERT INTO wizard_contact_fields (step_id, field_name, field_type, label_de, label_en, placeholder_de, placeholder_en, is_required, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const contactFields = [
      ['first_name', 'text', 'Vorname', 'First name', '', '', 1, 10],
      ['last_name', 'text', 'Nachname', 'Last name', '', '', 1, 20],
      ['email', 'email', 'E-Mail', 'Email', '', '', 1, 30],
      ['phone', 'tel', 'Telefon', 'Phone', '', '', 1, 40],
      ['zip', 'text', 'PLZ', 'ZIP code', '', '', 1, 50],
      ['city', 'text', 'Ort', 'City', '', '', 1, 60],
      ['message', 'textarea', 'Nachricht (optional)', 'Message (optional)', 'Besonderheiten, Wünsche, gewünschter Termin …', 'Special requirements, wishes, preferred date...', 0, 70],
      ['consent', 'checkbox', 'Datenschutzerklärung akzeptieren', 'Accept privacy policy', '', '', 1, 80],
    ]
    for (const f of contactFields) {
      insertField.run(step4Id, ...f)
    }
  })

  tx()
}
