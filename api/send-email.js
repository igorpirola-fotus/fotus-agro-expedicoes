import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'Fotus Agro <noreply@fotusagro.com.br>'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.RESEND_API_KEY) {
    // Silently skip if not configured — app still works
    return res.status(200).json({ skipped: true })
  }

  const { to, subject, html } = req.body
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' })
  }

  try {
    const data = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    return res.status(200).json(data)
  } catch (error) {
    console.error('Email send error:', error)
    return res.status(500).json({ error: error.message })
  }
}
