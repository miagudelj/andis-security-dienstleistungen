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
  `)

  seedIfEmpty(db)
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
