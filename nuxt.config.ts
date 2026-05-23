// Nuxt config — PreSecurity
// SSR aktiviert für SEO. Module: Tailwind, i18n, Pinia, SEO, Security.

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: true,

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    'nuxt-schema-org',
    'nuxt-security',
  ],

  css: ['~/assets/css/main.css'],

  // ---- Site-weite SEO-Defaults (von @nuxtjs/seo) ----
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.presecurity.ch',
    name: 'PreSecurity',
    description:
      'Sicherheitslösungen für Privat und Gewerbe im Kanton Zürich. Kameras, Video­überwachung, Beratung und Installation. Jetzt kostenlose Offerte anfordern.',
    defaultLocale: 'de',
    indexable: true,
  },

  // ---- robots.txt (von @nuxt/robots) ----
  robots: {
    disallow: ['/admin'],
    sitemap: '/sitemap.xml',
  },


  // ---- i18n ----
  i18n: {
    defaultLocale: 'de',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'de', language: 'de-CH', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    bundle: { optimizeTranslationDirective: false },
  },

  // ---- Sicherheits-Header (nuxt-security) ----
  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        // In Dev über LAN/IP keinen HTTPS-Zwang erzwingen — sonst lädt das Handy nichts.
        'upgrade-insecure-requests': process.env.NODE_ENV === 'production',
      },
      // HSTS nur in Production — sonst zwingt der Browser auch die LAN-IP auf HTTPS, sobald sie einmal verwendet wurde.
      strictTransportSecurity: process.env.NODE_ENV === 'production'
        ? { maxAge: 60 * 60 * 24 * 365, includeSubdomains: true, preload: true }
        : false,
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
      },
    },
    rateLimiter: {
      tokensPerInterval: 150,
      interval: 60_000,
      throwError: true,
    },
    requestSizeLimiter: {
      maxRequestSizeInBytes: 1024 * 200, // 200 KB
      maxUploadFileRequestInBytes: 1024 * 1024 * 5, // 5 MB
    },
    xssValidator: { throwError: false },
    corsHandler: {
      // In production: only allow requests from the configured site URL
      // In development: allow localhost origins for testing
      origin: process.env.NODE_ENV === 'production'
        ? process.env.NUXT_PUBLIC_SITE_URL || 'https://www.presecurity.ch'
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  },

  // ---- Runtime config: Server-only Geheimnisse + öffentliche Werte ----
  runtimeConfig: {
    // Nur serverseitig sichtbar
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    dbPath: process.env.DB_PATH || './data/presecurity.db',
    cookieSecure: process.env.NODE_ENV === 'production',

    // SMTP Konfiguration für E-Mail-Versand
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    smtpFrom: process.env.SMTP_FROM || 'noreply@presecurity.ch',
    mailEnabled: process.env.MAIL_ENABLED === 'true',

    // Öffentlich (Client-Bundle)
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.presecurity.ch',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },
})
