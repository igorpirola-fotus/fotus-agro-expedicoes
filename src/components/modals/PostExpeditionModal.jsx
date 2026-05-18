import React, { useState, useEffect } from 'react'
import {
  collection, query, where, getDocs, doc, writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db, colPath } from '../../lib/firebase.js'
import { CheckSquare, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import { daysFromNow } from '../../utils/formatDate.js'

export default function PostExpeditionModal({ expedition, onClose, showToast }) {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalFeedback, setGeneralFeedback] = useState({ objectivesMet: true, summary: '' })
  const [visitFeedback, setVisitFeedback] = useState({})

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, colPath('visits')), where('expeditionId', '==', expedition.id))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setVisits(data)
      const init = {}
      data.forEach(v => { init[v.id] = { objectiveMet: true, nextSteps: '', createAction: false, occurred: v.status !== 'nao_ocorreu' } })
      setVisitFeedback(init)
      setLoading(false)
    }
    fetch()
  }, [expedition.id])

  const update = (id, field, value) =>
    setVisitFeedback(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, colPath('expeditions'), expedition.id), {
        status: 'concluida', postReport: generalFeedback, updatedAt: serverTimestamp(),
      })

      for (const visit of visits) {
        const fb = visitFeedback[visit.id]
        const finalStatus = !fb.occurred ? 'nao_ocorreu' : 'realizada'
        batch.update(doc(db, colPath('visits'), visit.id), {
          status: finalStatus, objectiveMet: fb.objectiveMet, notesPos: fb.nextSteps,
        })
        if (visit.companyId) {
          batch.update(doc(db, colPath('companies'), visit.companyId), {
            lastVisitDate: new Date().toISOString().split('T')[0],
            lastVisitOutcome: fb.objectiveMet ? 'Sucesso' : 'Falhou/Parcial',
            lastVisitNextSteps: fb.nextSteps,
            lastVisitUserName: expedition.userName,
          })
        }
        if (fb.createAction && fb.nextSteps.trim()) {
          const actionRef = doc(collection(db, colPath('actions')))
          batch.set(actionRef, {
            expeditionId: expedition.id, companyId: visit.companyId, companyName: visit.companyName,
            title: fb.nextSteps.substring(0, 50) + (fb.nextSteps.length > 50 ? '...' : ''),
            description: fb.nextSteps, priority: 'media', status: 'aberta',
            dueDate: daysFromNow(7), responsibleId: expedition.userId, createdAt: serverTimestamp(),
          })
        }
      }

      await batch.commit()
      showToast('Relatório de Pós-Expedição salvo! Ações e empresas atualizadas.')
      onClose()
    } catch (err) {
      showToast('Erro ao salvar fechamento: ' + err.message, 'error')
    } finally { setIsSubmitting(false) }
  }

  if (loading) return <Modal title="Pós-Expedição" onClose={onClose}><div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-600" /></div></Modal>

  return (
    <Modal
      title={`Fechamento: ${expedition.title}`}
      onClose={onClose}
      footer={
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full font-bold py-3 text-lg shadow-lg">
          {isSubmitting ? <Loader2 className="animate-spin" /> : 'Finalizar Expedição e Gerar Ações'}
        </Button>
      }
    >
      <div className="space-y-8">
        <div>
          <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Resultados por Lead/Empresa ({visits.length})</h4>
          <div className="space-y-4">
            {visits.map((visit, idx) => (
              <div key={visit.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-bold text-gray-800 text-sm">{idx + 1}. {visit.companyName}</h5>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Obj: {visit.notesPre}</span>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
                    <label className="text-xs font-medium text-gray-600 shrink-0">Visita ocorreu?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-sm cursor-pointer">
                        <input type="radio" checked={visitFeedback[visit.id]?.occurred === true} onChange={() => update(visit.id, 'occurred', true)} /> Sim
                      </label>
                      <label className="flex items-center gap-1 text-sm cursor-pointer text-red-600">
                        <input type="radio" checked={visitFeedback[visit.id]?.occurred === false} onChange={() => update(visit.id, 'occurred', false)} /> Não ocorreu
                      </label>
                    </div>
                  </div>
                  {visitFeedback[visit.id]?.occurred !== false && (
                    <div className="flex items-center gap-4">
                      <label className="text-xs font-medium text-gray-600">Objetivo Cumprido?</label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-1 text-sm cursor-pointer"><input type="radio" checked={visitFeedback[visit.id]?.objectiveMet === true} onChange={() => update(visit.id, 'objectiveMet', true)} /> Sim</label>
                        <label className="flex items-center gap-1 text-sm cursor-pointer"><input type="radio" checked={visitFeedback[visit.id]?.objectiveMet === false} onChange={() => update(visit.id, 'objectiveMet', false)} /> Não</label>
                      </div>
                    </div>
                  )}
                  <input
                    className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-emerald-500"
                    placeholder={visitFeedback[visit.id]?.occurred === false ? 'Motivo / observações...' : 'Próximos passos / acordos firmados...'}
                    value={visitFeedback[visit.id]?.nextSteps}
                    onChange={e => update(visit.id, 'nextSteps', e.target.value)}
                  />
                  {visitFeedback[visit.id]?.occurred !== false && (
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id={`act-${visit.id}`} className="rounded text-emerald-600 w-4 h-4 cursor-pointer" checked={visitFeedback[visit.id]?.createAction} onChange={e => update(visit.id, 'createAction', e.target.checked)} />
                      <label htmlFor={`act-${visit.id}`} className="text-xs text-gray-600 font-medium cursor-pointer">Gerar tarefa no Plano de Ação baseada nos próximos passos</label>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {visits.length === 0 && <p className="text-sm text-gray-500 italic">Nenhum lead registrado para esta expedição.</p>}
          </div>
        </div>

        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
          <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2"><CheckSquare size={18} /> Avaliação Geral</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Objetivos macro foram atingidos?</label>
              <div className="flex gap-2">
                <button onClick={() => setGeneralFeedback({ ...generalFeedback, objectivesMet: true })} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${generalFeedback.objectivesMet ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600'}`}>Sim, atingidos</button>
                <button onClick={() => setGeneralFeedback({ ...generalFeedback, objectivesMet: false })} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${!generalFeedback.objectivesMet ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600'}`}>Parcial / Não</button>
              </div>
            </div>
            <Input label="Resumo Executivo (Opcional)" value={generalFeedback.summary} onChange={e => setGeneralFeedback({ ...generalFeedback, summary: e.target.value })} placeholder="Breve resumo da percepção do mercado local..." />
          </div>
        </div>
      </div>
    </Modal>
  )
}
