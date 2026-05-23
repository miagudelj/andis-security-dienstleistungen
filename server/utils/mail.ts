import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

export function getMailTransporter(): nodemailer.Transporter | null {
  const config = useRuntimeConfig()

  if (!config.mailEnabled || !config.smtpHost) {
    return null
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: Number(config.smtpPort) || 587,
      secure: Number(config.smtpPort) === 465,
      auth: config.smtpUser
        ? {
            user: config.smtpUser,
            pass: config.smtpPassword,
          }
        : undefined,
    })
  }

  return transporter
}

interface OfferConfirmationData {
  reference: string
  firstName: string
  lastName: string
  email: string
  phone: string
  zip: string
  city: string
  message: string
  locale: 'de' | 'en'
}

export async function sendOfferConfirmation(data: OfferConfirmationData): Promise<boolean> {
  const config = useRuntimeConfig()
  const transport = getMailTransporter()

  if (!transport) {
    console.log('[Mail] E-Mail-Versand deaktiviert oder nicht konfiguriert')
    return false
  }

  const isGerman = data.locale === 'de'

  const subject = isGerman
    ? `Ihre Offertanfrage ${data.reference} bei PreSecurity`
    : `Your quote request ${data.reference} at PreSecurity`

  const html = isGerman
    ? generateGermanEmail(data, config.public.siteUrl)
    : generateEnglishEmail(data, config.public.siteUrl)

  const text = isGerman
    ? generateGermanText(data)
    : generateEnglishText(data)

  try {
    await transport.sendMail({
      from: `"PreSecurity" <${config.smtpFrom}>`,
      to: data.email,
      subject,
      text,
      html,
    })
    console.log(`[Mail] Bestätigung gesendet an ${data.email} (${data.reference})`)
    return true
  } catch (error) {
    console.error('[Mail] Fehler beim Senden:', error)
    return false
  }
}

function generateGermanEmail(data: OfferConfirmationData, siteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #2563eb; color: white; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 24px;">🛡</div>
        <h1 style="margin: 16px 0 0; font-size: 24px; color: #18181b;">PreSecurity</h1>
      </div>

      <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Vielen Dank für Ihre Anfrage!</h2>

      <p style="color: #3f3f46;">Guten Tag ${data.firstName} ${data.lastName},</p>

      <p style="color: #3f3f46;">wir haben Ihre Offertanfrage erfolgreich erhalten. Ihre Referenznummer lautet:</p>

      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #0369a1;">${data.reference}</span>
      </div>

      <p style="color: #3f3f46;"><strong>Wir melden uns innerhalb eines Werktages bei Ihnen</strong>, um die Details zu besprechen und einen Termin zu vereinbaren.</p>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

      <h3 style="color: #18181b; font-size: 16px; margin-bottom: 12px;">Ihre Kontaktdaten</h3>
      <p style="color: #52525b; margin: 4px 0;"><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
      <p style="color: #52525b; margin: 4px 0;"><strong>E-Mail:</strong> ${data.email}</p>
      <p style="color: #52525b; margin: 4px 0;"><strong>Telefon:</strong> ${data.phone}</p>
      <p style="color: #52525b; margin: 4px 0;"><strong>Ort:</strong> ${data.zip} ${data.city}</p>

      ${data.message ? `
      <h3 style="color: #18181b; font-size: 16px; margin: 24px 0 12px;">Ihre Nachricht</h3>
      <div style="background: #fafafa; border-radius: 8px; padding: 16px;">
        <p style="color: #52525b; margin: 0; white-space: pre-line;">${escapeHtml(data.message)}</p>
      </div>
      ` : ''}

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

      <p style="color: #71717a; font-size: 14px;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:info@presecurity.ch" style="color: #2563eb;">info@presecurity.ch</a>
      </p>

      <p style="color: #3f3f46;">Mit freundlichen Grüssen,<br><strong>Ihr PreSecurity Team</strong></p>
    </div>

    <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 24px;">
      © ${new Date().getFullYear()} PreSecurity · Sicherheitslösungen für Zürich<br>
      <a href="${siteUrl}" style="color: #a1a1aa;">${siteUrl.replace(/^https?:\/\//, '')}</a>
    </p>
  </div>
</body>
</html>
`
}

function generateEnglishEmail(data: OfferConfirmationData, siteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #2563eb; color: white; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 24px;">🛡</div>
        <h1 style="margin: 16px 0 0; font-size: 24px; color: #18181b;">PreSecurity</h1>
      </div>

      <h2 style="color: #18181b; font-size: 20px; margin-bottom: 16px;">Thank you for your inquiry!</h2>

      <p style="color: #3f3f46;">Dear ${data.firstName} ${data.lastName},</p>

      <p style="color: #3f3f46;">We have successfully received your quote request. Your reference number is:</p>

      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #0369a1;">${data.reference}</span>
      </div>

      <p style="color: #3f3f46;"><strong>We will contact you within one business day</strong> to discuss the details and schedule an appointment.</p>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

      <h3 style="color: #18181b; font-size: 16px; margin-bottom: 12px;">Your Contact Details</h3>
      <p style="color: #52525b; margin: 4px 0;"><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
      <p style="color: #52525b; margin: 4px 0;"><strong>Email:</strong> ${data.email}</p>
      <p style="color: #52525b; margin: 4px 0;"><strong>Phone:</strong> ${data.phone}</p>
      <p style="color: #52525b; margin: 4px 0;"><strong>Location:</strong> ${data.zip} ${data.city}</p>

      ${data.message ? `
      <h3 style="color: #18181b; font-size: 16px; margin: 24px 0 12px;">Your Message</h3>
      <div style="background: #fafafa; border-radius: 8px; padding: 16px;">
        <p style="color: #52525b; margin: 0; white-space: pre-line;">${escapeHtml(data.message)}</p>
      </div>
      ` : ''}

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

      <p style="color: #71717a; font-size: 14px;">
        For questions, you can reach us at <a href="mailto:info@presecurity.ch" style="color: #2563eb;">info@presecurity.ch</a>
      </p>

      <p style="color: #3f3f46;">Best regards,<br><strong>Your PreSecurity Team</strong></p>
    </div>

    <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 24px;">
      © ${new Date().getFullYear()} PreSecurity · Security Solutions for Zurich<br>
      <a href="${siteUrl}" style="color: #a1a1aa;">${siteUrl.replace(/^https?:\/\//, '')}</a>
    </p>
  </div>
</body>
</html>
`
}

function generateGermanText(data: OfferConfirmationData): string {
  return `
Vielen Dank für Ihre Anfrage!

Guten Tag ${data.firstName} ${data.lastName},

wir haben Ihre Offertanfrage erfolgreich erhalten.

Ihre Referenznummer: ${data.reference}

Wir melden uns innerhalb eines Werktages bei Ihnen, um die Details zu besprechen und einen Termin zu vereinbaren.

---

Ihre Kontaktdaten:
Name: ${data.firstName} ${data.lastName}
E-Mail: ${data.email}
Telefon: ${data.phone}
Ort: ${data.zip} ${data.city}

${data.message ? `Ihre Nachricht:\n${data.message}\n` : ''}

---

Bei Fragen erreichen Sie uns unter info@presecurity.ch

Mit freundlichen Grüssen,
Ihr PreSecurity Team

© ${new Date().getFullYear()} PreSecurity · Sicherheitslösungen für Zürich
`.trim()
}

function generateEnglishText(data: OfferConfirmationData): string {
  return `
Thank you for your inquiry!

Dear ${data.firstName} ${data.lastName},

We have successfully received your quote request.

Your reference number: ${data.reference}

We will contact you within one business day to discuss the details and schedule an appointment.

---

Your Contact Details:
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
Phone: ${data.phone}
Location: ${data.zip} ${data.city}

${data.message ? `Your Message:\n${data.message}\n` : ''}

---

For questions, you can reach us at info@presecurity.ch

Best regards,
Your PreSecurity Team

© ${new Date().getFullYear()} PreSecurity · Security Solutions for Zurich
`.trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
