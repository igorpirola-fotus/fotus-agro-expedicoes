import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase.js'

async function getManagerEmails() {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'gerente'))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data().email).filter(Boolean)
  } catch {
    return []
  }
}

async function getUserEmail(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)))
    if (!snap.empty) return snap.docs[0].data().email
    return null
  } catch {
    return null
  }
}

async function sendEmail(to, subject, html) {
  if (!to || (Array.isArray(to) && to.length === 0)) return
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    })
  } catch (e) {
    console.warn('Falha ao enviar e-mail de notificação:', e.message)
  }
}

export async function notifyExpeditionSubmitted(expedition, submitterName) {
  const emails = await getManagerEmails()
  if (emails.length === 0) return
  await sendEmail(
    emails,
    `[Fotus Agro] Nova expedição para aprovação: ${expedition.title}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#064e3b;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Fotus Agro — Expedições</h1>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <h2 style="color:#1f2937">Nova expedição aguarda aprovação</h2>
        <p style="color:#6b7280">O executivo <strong>${submitterName}</strong> submeteu uma nova expedição para aprovação.</p>
        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:4px 0"><strong>Expedição:</strong> ${expedition.title}</p>
          <p style="margin:4px 0"><strong>Região:</strong> ${expedition.region}</p>
          <p style="margin:4px 0"><strong>Período:</strong> ${expedition.startDate} a ${expedition.endDate}</p>
          <p style="margin:4px 0"><strong>Custo estimado:</strong> R$ ${expedition.totals?.cost?.toFixed(2) || '0,00'}</p>
        </div>
        <p style="color:#6b7280">Acesse o sistema para aprovar ou devolver para ajustes.</p>
      </div>
    </div>`
  )
}

export async function notifyExpeditionApproved(expedition) {
  const email = await getUserEmail(expedition.userId)
  if (!email) return
  await sendEmail(
    email,
    `[Fotus Agro] Expedição aprovada: ${expedition.title}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#064e3b;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Fotus Agro — Expedições</h1>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <h2 style="color:#059669">✅ Expedição Aprovada!</h2>
        <p style="color:#6b7280">Sua expedição foi aprovada e está pronta para execução.</p>
        <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #bbf7d0">
          <p style="margin:4px 0"><strong>Expedição:</strong> ${expedition.title}</p>
          <p style="margin:4px 0"><strong>Região:</strong> ${expedition.region}</p>
          <p style="margin:4px 0"><strong>Período:</strong> ${expedition.startDate} a ${expedition.endDate}</p>
        </div>
        <p style="color:#6b7280">Acesse o sistema e clique em <strong>Iniciar Viagem</strong> quando estiver pronto.</p>
      </div>
    </div>`
  )
}

export async function notifyExpeditionRejected(expedition, reason) {
  const email = await getUserEmail(expedition.userId)
  if (!email) return
  await sendEmail(
    email,
    `[Fotus Agro] Expedição devolvida para ajustes: ${expedition.title}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#064e3b;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Fotus Agro — Expedições</h1>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <h2 style="color:#dc2626">⚠️ Expedição Devolvida para Ajustes</h2>
        <p style="color:#6b7280">Sua expedição foi devolvida com solicitação de ajustes.</p>
        <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #fecaca">
          <p style="margin:4px 0"><strong>Expedição:</strong> ${expedition.title}</p>
          <p style="margin:8px 0 4px 0"><strong>Motivo da devolução:</strong></p>
          <p style="margin:0;color:#dc2626">${reason}</p>
        </div>
        <p style="color:#6b7280">Acesse o sistema, faça os ajustes necessários e reenvie para aprovação.</p>
      </div>
    </div>`
  )
}
