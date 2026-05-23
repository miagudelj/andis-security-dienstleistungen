import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { hashIP, logAudit } from '~~/server/utils/auth'
import { rateLimit } from '~~/server/utils/rate-limit'
import { useDB } from '~~/server/utils/db'
import { sendOfferConfirmation } from '~~/server/utils/mail'

// Phone number regex: allows +, digits, spaces, dashes, parentheses, dots
// Examples: +41 79 123 45 67, 079 123 45 67, (079) 123-4567
const PHONE_REGEX = /^[+]?[\d\s\-().]+$/

// Schema for step responses - very lenient validation
// We validate the important fields manually after parsing
const DynamicBody = z.object({
  steps: z.record(z.string(), z.any()).default({}),
  locale: z.enum(['de', 'en']).default('de'),
  website: z.string().max(0).optional(), // Honeypot
})

// Bilingual error messages
function getErrorMessage(key: string, locale: string): string {
  const messages: Record<string, { de: string; en: string }> = {
    'missing_fields': { de: 'Fehlende Felder', en: 'Missing fields' },
    'invalid_phone': { de: 'Ungültige Telefonnummer', en: 'Invalid phone number' },
    'invalid_email': { de: 'Ungültige E-Mail-Adresse', en: 'Invalid email address' },
    'consent_required': { de: 'Datenschutz muss akzeptiert werden', en: 'Privacy policy must be accepted' },
    'validation_error': { de: 'Bitte alle Felder korrekt ausfüllen', en: 'Please fill in all fields correctly' },
  }
  return messages[key]?.[locale === 'en' ? 'en' : 'de'] || messages[key]?.de || key
}

// Legacy format (for backward compatibility)
const LegacyBody = z.object({
  devices: z.array(z.object({
    slug: z.string().max(100),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(20),
  locations: z.array(z.string().max(100)).min(1).max(20),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  phone: z.string().min(5).max(50).regex(PHONE_REGEX, 'Ungültige Telefonnummer'),
  zip: z.string().min(4).max(10),
  city: z.string().min(1).max(100),
  message: z.string().max(2000).default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'Datenschutz muss akzeptiert werden' }) }),
  locale: z.enum(['de', 'en']).default('de'),
  website: z.string().max(0).optional(),
})

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const ipHash = hashIP(ip)
  const rawBody = await readBody(event)
  const userAgent = (getHeader(event, 'user-agent') || '').slice(0, 300)

  // Get locale from body for error messages
  const locale = rawBody?.locale === 'en' ? 'en' : 'de'

  // Rate limit: 3 Offerten / 1 min pro IP
  const rl = rateLimit({ key: `offer:${ipHash}`, max: 3, windowMs: 60_000 }) // 1 minute window
  if (!rl.ok) {
    const msg = locale === 'en'
      ? `Please wait ${rl.retryAfterSec}s before submitting another request.`
      : `Bitte ${rl.retryAfterSec}s warten, bevor Sie eine weitere Offerte senden.`
    throw createError({
      statusCode: 429,
      statusMessage: msg,
    })
  }

  // Check if this is the new dynamic format
  if (rawBody.steps !== undefined) {
    const parsed = DynamicBody.safeParse(rawBody)
    if (!parsed.success) {
      console.error('[Offers] Validation error:', JSON.stringify(parsed.error.flatten(), null, 2))
      console.error('[Offers] Received body:', JSON.stringify(rawBody, null, 2))
      throw createError({
        statusCode: 400,
        statusMessage: getErrorMessage('validation_error', locale),
        data: parsed.error.flatten(),
      })
    }
    const d = parsed.data

    // Extract contact info from contact_form step
    let contactData: Record<string, string | boolean> = {}
    for (const [_slug, response] of Object.entries(d.steps)) {
      if (response.type === 'contact_form' && response.contact) {
        contactData = response.contact
        break
      }
    }

    // Validate required contact fields
    const firstName = typeof contactData.first_name === 'string' ? contactData.first_name : ''
    const lastName = typeof contactData.last_name === 'string' ? contactData.last_name : ''
    const email = typeof contactData.email === 'string' ? contactData.email : ''
    const phone = typeof contactData.phone === 'string' ? contactData.phone : ''
    const zip = typeof contactData.zip === 'string' ? contactData.zip : ''
    const city = typeof contactData.city === 'string' ? contactData.city : ''
    const message = typeof contactData.message === 'string' ? contactData.message : ''
    const consent = contactData.consent === true

    // Check which fields are missing (bilingual field names)
    const fieldNames = locale === 'en'
      ? { first_name: 'First name', last_name: 'Last name', email: 'Email', phone: 'Phone', zip: 'ZIP', city: 'City' }
      : { first_name: 'Vorname', last_name: 'Nachname', email: 'E-Mail', phone: 'Telefon', zip: 'PLZ', city: 'Ort' }

    const missingFields: string[] = []
    if (!firstName) missingFields.push(fieldNames.first_name)
    if (!lastName) missingFields.push(fieldNames.last_name)
    if (!email) missingFields.push(fieldNames.email)
    if (!phone) missingFields.push(fieldNames.phone)
    if (!zip) missingFields.push(fieldNames.zip)
    if (!city) missingFields.push(fieldNames.city)

    if (missingFields.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `${getErrorMessage('missing_fields', locale)}: ${missingFields.join(', ')}`,
      })
    }

    // Validate phone format
    if (!PHONE_REGEX.test(phone)) {
      throw createError({ statusCode: 400, statusMessage: getErrorMessage('invalid_phone', locale) })
    }

    // Validate email format
    const emailSchema = z.string().email()
    if (!emailSchema.safeParse(email).success) {
      throw createError({ statusCode: 400, statusMessage: getErrorMessage('invalid_email', locale) })
    }

    if (!consent) {
      throw createError({ statusCode: 400, statusMessage: getErrorMessage('consent_required', locale) })
    }

    const reference = `PRE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`

    useDB().prepare(`
      INSERT INTO offers (reference, devices_json, locations_json, steps_data_json, first_name, last_name, email, phone, zip, city, message, consent, ip_hash, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reference,
      '[]', // Empty for new format
      '[]', // Empty for new format
      JSON.stringify(d.steps),
      firstName, lastName, email, phone, zip, city, message,
      1, ipHash, userAgent,
    )

    logAudit('offer_received', reference, '', ipHash)

    // Send confirmation email (non-blocking)
    sendOfferConfirmation({
      reference,
      firstName,
      lastName,
      email,
      phone,
      zip,
      city,
      message,
      locale: d.locale,
    }).catch(err => console.error('[Mail] Async error:', err))

    return { ok: true, reference }
  }

  // Legacy format handling
  const parsed = LegacyBody.safeParse(rawBody)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: getErrorMessage('validation_error', locale),
      data: parsed.error.flatten(),
    })
  }
  const d = parsed.data

  const reference = `PRE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`

  useDB().prepare(`
    INSERT INTO offers (reference, devices_json, locations_json, first_name, last_name, email, phone, zip, city, message, consent, ip_hash, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reference,
    JSON.stringify(d.devices),
    JSON.stringify(d.locations),
    d.first_name, d.last_name, d.email, d.phone, d.zip, d.city, d.message,
    1, ipHash, userAgent,
  )

  logAudit('offer_received', reference, '', ipHash)

  // Send confirmation email (non-blocking)
  sendOfferConfirmation({
    reference,
    firstName: d.first_name,
    lastName: d.last_name,
    email: d.email,
    phone: d.phone,
    zip: d.zip,
    city: d.city,
    message: d.message,
    locale: d.locale,
  }).catch(err => console.error('[Mail] Async error:', err))

  return { ok: true, reference }
})
