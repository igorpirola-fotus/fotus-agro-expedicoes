import React, { useState, useEffect } from 'react'
import {
  collection, getDocs, doc, setDoc, deleteDoc, query, orderBy,
} from 'firebase/firestore'
import {
  getAuth, createUserWithEmailAndPassword,
} from 'firebase/auth'
import { db } from '../lib/firebase.js'
import {
  Users, Plus, Trash2, Mail, Shield, User, Loader2, X,
} from 'lucide-react'
import Button from './ui/Button.jsx'
import Input from './ui/Input.jsx'
import Select from './ui/Select.jsx'
import Modal from './ui/Modal.jsx'

const ROLE_LABEL = { gerente: 'Gerente', executivo: 'Executivo' }
const ROLE_COLOR = {
  gerente: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  executivo: 'bg-blue-100 text-blue-700 border-blue-200',
}

export default function Equipe({ userProfile, showToast }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'executivo' })

  const isGerente = userProfile?.role === 'gerente'

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'users'))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setMembers(list)
    } catch (err) {
      showToast('Erro ao carregar equipe.', 'error')
    }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      showToast('Preencha todos os campos.', 'error')
      return
    }
    setSaving(true)
    try {
      // Cria o usuário no Firebase Auth
      const secondaryAuth = getAuth()
      const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.password)
      const uid = cred.user.uid
      // Salva o perfil no Firestore
      await setDoc(doc(db, 'users', uid), {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      })
      showToast(`${form.name} adicionado(a) à equipe!`)
      setForm({ name: '', email: '', password: '', role: 'executivo' })
      setShowForm(false)
      loadMembers()
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'E-mail já cadastrado.'
        : err.code === 'auth/weak-password'
        ? 'Senha muito fraca (mínimo 6 caracteres).'
        : 'Erro ao adicionar membro.'
      showToast(msg, 'error')
    }
    setSaving(false)
  }

  const handleRemove = async (member) => {
    if (!window.confirm(`Remover ${member.name} da equipe?`)) return
    try {
      await deleteDoc(doc(db, 'users', member.id))
      showToast(`${member.name} removido(a).`)
      loadMembers()
    } catch {
      showToast('Erro ao remover membro.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Equipe</h2>
          <p className="text-gray-500 text-sm">Membros e permissões do sistema.</p>
        </div>
        {isGerente && (
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus size={16} /> Novo Membro
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="animate-spin" size={20} /> Carregando...
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Nenhum membro cadastrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500 font-medium">{members.length} membro{members.length !== 1 ? 's' : ''}</p>
          </div>
          <ul className="divide-y divide-gray-100">
            {members.map(member => (
              <li key={member.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                  {(member.name || member.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{member.name || '—'}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                    <Mail size={11} /> {member.email || member.id}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLOR[member.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {ROLE_LABEL[member.role] || member.role || 'Membro'}
                </span>
                {isGerente && member.id !== userProfile.uid && (
                  <button
                    onClick={() => handleRemove(member)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover membro"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal novo membro */}
      {showForm && (
        <Modal
          title="Adicionar Membro"
          onClose={() => setShowForm(false)}
          footer={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleAdd} disabled={saving} className="flex-1">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Adicionar'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <Input
                placeholder="Ex: João Silva"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <Input
                type="email"
                placeholder="joao@fotus.com.br"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha inicial</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
              <Select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="executivo">Executivo</option>
                <option value="gerente">Gerente</option>
              </Select>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <Shield size={12} className="inline mr-1" />
              <strong>Gerentes</strong> têm acesso total (aprovação de expedições, gestão de equipe). <strong>Executivos</strong> criam e gerenciam suas próprias expedições.
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
