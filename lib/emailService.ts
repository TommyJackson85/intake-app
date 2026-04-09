import FormData from 'form-data'
import Mailgun from 'mailgun.js'

function getMailgunClient() {
  const mailgun = new Mailgun(FormData)

  const mailgunUrl = process.env.MAILGUN_HOST
    ? `https://${process.env.MAILGUN_HOST.replace(/^https?:\/\//, '')}`
    : undefined

  return mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY!,
    ...(mailgunUrl && { url: mailgunUrl }),
  })
}

export async function sendWelcomeEmail(email: string, firmName: string) {
  try {
    const domain = getMailgunDomain()
    const result = await getMailgunClient().messages.create(
      domain,
      {
        from: getMailgunFrom(domain),
        to: email,
        subject: `Welcome to LawIntake, ${firmName}`,
        html: `
          <h2>Welcome to LawIntake</h2>
          <p>Hi ${firmName},</p>
          <p>Thanks for signing up. We're excited to help streamline your client intake process.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/signin">Get Started</a></p>
          <p>Questions? Reply to this email or contact us at hello@lawintake.io</p>
        `,
      }
    )
    return result
  } catch (error) {
    console.error('Mailgun error:', error)
    throw error
  }
}

/** Mailgun sending domain must look like a domain (e.g. sandboxXXX.mailgun.org), not an ID or key. */
function getMailgunDomain(): string {
  const d = process.env.MAILGUN_DOMAIN?.trim()
  if (!d) throw new Error('MAILGUN_DOMAIN is not set')
  if (!d.includes('.') || /^[0-9a-f-]{30,}$/i.test(d)) {
    throw new Error(
      'MAILGUN_DOMAIN must be your Mailgun sending domain (e.g. sandboxXXXX.mailgun.org or mg.yourdomain.com), not an ID or key. Check Mailgun Dashboard → Sending → Domain.'
    )
  }
  return d
}

/** From address: use MAILGUN_FROM_EMAIL or default to postmaster@domain (required for Mailgun sandbox). */
function getMailgunFrom(domain: string): string {
  const from = process.env.MAILGUN_FROM_EMAIL?.trim()
  if (from) return from
  return `postmaster@${domain}`
}

export async function sendIntakeLink(email: string, clientName: string, intakeUrl: string) {
  const domain = getMailgunDomain()
  const fromEmail = getMailgunFrom(domain)
  try {
    const result = await getMailgunClient().messages.create(
      domain,
      {
        from: fromEmail,
        to: email,
        subject: `Your intake form – ${clientName || 'Client'}`,
        html: `
          <h2>Complete your intake form</h2>
          <p>Hi ${clientName || 'there'},</p>
          <p>Your law firm has sent you a secure link to complete your intake form.</p>
          <p><a href="${intakeUrl}">Open intake form</a></p>
          <p>This link is unique and secure. Do not share it with others.</p>
        `,
      }
    )
    return result
  } catch (error) {
    console.error('Mailgun error:', error)
    throw error
  }
}

export async function sendIntakeConfirmation(email: string, clientName: string) {
  try {
    const domain = getMailgunDomain()
    const result = await getMailgunClient().messages.create(
      domain,
      {
        from: getMailgunFrom(domain),
        to: email,
        subject: `Intake form received for ${clientName}`,
        html: `
          <h2>Intake Received</h2>
          <p>We've received the intake form for <strong>${clientName}</strong>.</p>
          <p>Your team will review this shortly.</p>
        `,
      }
    )
    return result
  } catch (error) {
    console.error('Mailgun error:', error)
    throw error
  }
}