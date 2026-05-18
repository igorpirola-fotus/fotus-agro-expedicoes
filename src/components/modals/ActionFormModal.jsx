import React, { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, colPath } from '../../lib/firebase.js'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import Select from '../ui/Select.jsx'

export default function ActionFormModal({ onClose, user, initialData = {}, companies = [], showToast }) {
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'media', dueDate: '',
    companyId: initialData?.companyId || '',
    companyName: initialData?.companyName || '',
    ...initialData,
  })

  const handleSubmit = async () => {
    if (!formData.title || !formData.companyId) {
      showToast('Preencha o título e a empresa.', 'error')
      return
    }
    const companyName =
      formData.companyName ||
      companies.find(c => c.id === formData.companyId)?.name ||
      'Geral'
    await addDoc(collection(db, colPath('actions')), {
      ...formData,
      companyName,
      responsibleId: user?.uid || 'user',
      status: 'aberta',
      createdAt: serverTimestamp(),
    })
    showToast('Ação criada com sucesso!')
    onClose()
  }

  return (
    <Modal title="Nova Ação" onClose={onClose} footer={<Button onClick={handleSubmit} className="w-full">Criar Ação</Button>}>
      <div className="space-y-4">
        <Input
          label="O que deve ser feito?"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Enviar proposta comercial"
        />
        {!initialData?.companyId && (
          <Select
            label="Empresa Relacionada"
            value={formData.companyId}
            onChange={e => setFormData({ ...formData, companyId: e.target.value })}
          >
            <option value="">Selecione...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Prioridade"
            value={formData.priority}
            onChange={e => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </Select>
          <Input
            label="Prazo Limite"
            type="date"
            value={formData.dueDate}
            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição Detalhada</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg h-24 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  )
}
