import React, { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'

export default function RejectExpeditionModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  return (
    <Modal
      title="Reprovar Expedição"
      onClose={onClose}
      footer={
        <Button variant="danger" className="w-full" onClick={() => onConfirm(reason)}>
          Confirmar Reprovação e Notificar
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Informe o motivo da devolução para que o executivo possa ajustar o planejamento.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Motivo da Recusa / Ajustes Necessários
          </label>
          <textarea
            className="w-full p-3 border border-red-300 rounded-lg h-32 text-sm outline-none focus:ring-2 focus:ring-red-500 bg-red-50/30"
            placeholder="Ex: Orçamento acima do limite aprovado para esta região..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
