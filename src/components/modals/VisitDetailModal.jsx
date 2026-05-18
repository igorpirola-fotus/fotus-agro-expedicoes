import React, { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db, colPath, storagePrefixo } from '../../lib/firebase.js'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import FileUpload from '../ui/FileUpload.jsx'
import ActionFormModal from './ActionFormModal.jsx'

export default function VisitDetailModal({ visit, onClose, user, showToast }) {
  const [status, setStatus] = useState(visit.status)
  const [notesPos, setNotesPos] = useState(visit.notesPos || '')
  const [attachments, setAttachments] = useState(visit.attachments || [])
  const [showActionForm, setShowActionForm] = useState(false)

  const handleSave = async () => {
    await updateDoc(doc(db, colPath('visits'), visit.id), { status, notesPos, attachments })
    showToast('Visita atualizada!')
    onClose()
  }

  if (showActionForm) {
    return (
      <ActionFormModal
        onClose={() => setShowActionForm(false)}
        user={user}
        initialData={{ companyId: visit.companyId, companyName: visit.companyName, expeditionId: visit.expeditionId }}
        companies={[]}
        showToast={showToast}
      />
    )
  }

  return (
    <Modal
      title={visit.companyName}
      onClose={onClose}
      footer={<Button onClick={handleSave} className="w-full">Salvar Registros</Button>}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status da Visita</label>
          <div className="flex rounded-lg bg-gray-100 p-1">
            {['planejada', 'realizada', 'nao_ocorreu'].map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all ${status === s ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Relatório / Observações</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg h-32 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Descreva o que foi discutido, acordos firmados..."
            value={notesPos}
            onChange={e => setNotesPos(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Anexos (fotos, documentos)</label>
          <FileUpload
            storagePath={`${storagePrefixo}/visits/${visit.id}`}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <h4 className="font-bold text-blue-800 text-sm mb-2">Gerar Ação Imediata</h4>
          <p className="text-xs text-blue-600 mb-3">Identificou uma oportunidade? Crie uma tarefa agora.</p>
          <Button size="sm" variant="secondary" onClick={() => setShowActionForm(true)} className="w-full text-blue-700 border-blue-200 hover:bg-blue-100">
            + Criar Plano de Ação
          </Button>
        </div>
      </div>
    </Modal>
  )
}
