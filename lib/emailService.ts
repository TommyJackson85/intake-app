import FormData from 'form-data'
import Mailgun from 'mailgun.js'

const mailgun = new Mailgun(FormData)
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY!,
})

export async function sendWelcomeEmail(email: string, firmName: string) {
  try {
    const result = await mg.messages.create(
      process.env.MAILGUN_DOMAIN!,
      {
        from: process.env.MAILGUN_FROM_EMAIL!,
        to: email,
        subject: `Welcome to LawIntake, ${firmName}`,
        html: `
          <h2>Welcome to LawIntake</h2>
          <p>Hi ${firmName},</p>
          <p>Thanks for signing up. We're excited to help streamline your client intake process.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login">Get Started</a></p>
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

export async function sendIntakeConfirmation(email: string, clientName: string) {
  try {
    const result = await mg.messages.create(
      process.env.MAILGUN_DOMAIN!,
      {
        from: process.env.MAILGUN_FROM_EMAIL!,
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