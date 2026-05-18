import React, { useState, useMemo } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, colPath } from '../lib/firebase.js'
import { Plus, CheckCircle2, AlertTriangle, UserCircle } from 'lucide-react'
import { formatDate } from '../utils/formatDate.js'
import Button from './ui/Button.jsx'
import Modal from './ui/Modal.jsx'
import Input from './ui/Input.jsx'
import SearchBar from './ui/SearchBar.jsx'
import Pagination, { usePagination } from './ui/Pagination.jsx'

export default function CompanyList({ companies, showToast, userProfile }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', city: '', state: '', segment: '' })
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('todos')

  const segments = useMemo(() => {
    const s = new Set(companies.map(c => c.segment).filter(Boolean))
    return ['todos', ...Array.from(s)]
  }, [companies])

  const filtered = useMemo(() => {
    let list = [...companies]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q),
      )
    }
    if (segmentFilter !== 'todos') list = list.filter(c => c.segment === segmentFilter)
    return list
  }, [companies, search, segmentFilter])

  const { paginated, page, setPage, totalPages } = usePagination(filtered, 20)

  const handleSubmit = async () => {
    if (!formData.name) { showToast('Nome da empresa é obrigatório.', 'error'); return }
    await addDoc(collection(db, colPath('companies')), {
      ...formData,
      createdByUserName: userProfile?.name || 'Sistema',
      createdAt: serverTimestamp(),
    })
    showToast('Empresa cadastrada!')
    setIsModalOpen(false)
    setFormData({ name: '', city: '', state: '', segment: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Carteira de Clientes</h2>
          <p className="text-sm text-gray-500">Gerenciamento de base de empresas.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>Nova Empresa</Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome, cidade ou estado..." className="flex-1 min-w-[200px]" />
        <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
          {segments.map(s => <option key={s} value={s}>{s === 'todos' ? 'Todos os segmentos' : s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Empresa / Lead</div>
          <div className="col-span-3">Localização</div>
          <div className="col-span-3">Última Interação</div>
          <div className="col-span-2 text-right">Executivo</div>
        </div>
        <div className="divide-y divide-gray-100">
          {paginated.map(company => (
            <div key={company.id} className="p-4 md:grid md:grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
              <div className="col-span-4 flex items-center gap-3 mb-2 md:mb-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{company.name.charAt(0)}</div>
                <div>
                  <h3 className="font-bold text-gray-800">{company.name}</h3>
                  <p className="text-xs text-gray-500 md:hidden">{company.city} - {company.state}</p>
                  {company.segment === 'Prospect/Lead' && <span className="md:hidden mt-1 inline-block bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded">Lead</span>}
                </div>
              </div>
              <div className="col-span-3 text-sm text-gray-600 hidden md:block">
                {company.city} - {company.state}
                {company.segment === 'Prospect/Lead' && <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded">Lead</span>}
              </div>
              <div className="col-span-3 text-xs hidden md:block">
                {company.lastVisitDate ? (
                  <div>
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      {company.lastVisitOutcome === 'Sucesso'
                        ? <CheckCircle2 size={14} className="text-emerald-500" />
                        : <AlertTriangle size={14} className="text-amber-500" />}
                      {formatDate(company.lastVisitDate)}
                    </div>
                    <p className="text-gray-500 truncate">{company.lastVisitNextSteps || 'Sem próximos passos'}</p>
                  </div>
                ) : <span className="text-gray-400 italic">Nenhuma visita registrada</span>}
              </div>
              <div className="col-span-2 text-right text-xs text-gray-500 hidden md:flex justify-end items-center gap-2">
                <UserCircle size={16} className="text-gray-400" />
                <span className="truncate max-w-[120px] font-medium">{company.lastVisitUserName || company.createdByUserName || 'Sistema'}</span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <div className="p-12 text-center text-gray-400">Nenhuma empresa encontrada.</div>}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {isModalOpen && (
        <Modal title="Nova Empresa" onClose={() => setIsModalOpen(false)} footer={<Button onClick={handleSubmit} className="w-full">Cadastrar</Button>}>
          <div className="space-y-4">
            <Input label="Razão Social / Nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Cidade" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
              <Input label="Estado" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="UF" />
            </div>
            <Input label="Segmento" value={formData.segment} onChange={e => setFormData({ ...formData, segment: e.target.value })} placeholder="Ex: Grãos, Revenda..." />
          </div>
        </Modal>
      )}
    </div>
  )
}
