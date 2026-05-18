import React, { useState, useMemo } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db, colPath } from '../lib/firebase.js'
import { CheckSquare, Plus, Calendar } from 'lucide-react'
import { formatDate, isOverdue } from '../utils/formatDate.js'
import Button from './ui/Button.jsx'
import SearchBar from './ui/SearchBar.jsx'
import Pagination, { usePagination } from './ui/Pagination.jsx'
import ActionFormModal from './modals/ActionFormModal.jsx'

export default function ActionPlanGlobal({ actions, userProfile, companies, user, showToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('todas')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const myActions = useMemo(() => {
    let list = userProfile.role === 'gerente'
      ? actions
      : actions.filter(a => a.responsibleId === userProfile.uid)

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.companyName?.toLowerCase().includes(q),
      )
    }
    if (priorityFilter !== 'todas') list = list.filter(a => a.priority === priorityFilter)
    if (dateFrom) list = list.filter(a => a.dueDate >= dateFrom)
    if (dateTo) list = list.filter(a => a.dueDate <= dateTo)
    return list
  }, [actions, userProfile, search, priorityFilter, dateFrom, dateTo])

  const markDone = (action) => {
    updateDoc(doc(db, colPath('actions'), action.id), { status: 'concluida' })
    showToast('Concluído!')
  }

  const columns = ['aberta', 'em_andamento', 'concluida']

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Plano de Ação</h2>
          <p className="text-sm text-gray-500">Tarefas e follow-ups pendentes.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus} className="hidden md:flex">Nova Ação</Button>
        <button onClick={() => setIsModalOpen(true)} className="md:hidden bg-emerald-600 text-white p-2 rounded-full shadow-lg"><Plus size={24} /></button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 shrink-0">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por título ou empresa..." className="flex-1 min-w-[200px]" />
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
          <option value="todas">Todas as prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Prazo a partir de" className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Prazo até" className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
      </div>

      {/* Tabs mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
        {['all', ...columns].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === s ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {s === 'all' ? 'Todas' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 flex-1 overflow-y-auto">
        {columns.map(status => (
          <ActionColumn
            key={status}
            status={status}
            actions={myActions.filter(a => a.status === status)}
            visible={filterStatus === 'all' || filterStatus === status}
            onMarkDone={markDone}
          />
        ))}
      </div>

      {isModalOpen && (
        <ActionFormModal onClose={() => setIsModalOpen(false)} user={userProfile} companies={companies} showToast={showToast} />
      )}
    </div>
  )
}

function ActionColumn({ status, actions, visible, onMarkDone }) {
  const { paginated, page, setPage, totalPages } = usePagination(actions, 20)

  const headerColors = {
    aberta: 'bg-gray-200 text-gray-700',
    em_andamento: 'bg-blue-100 text-blue-800',
    concluida: 'bg-emerald-100 text-emerald-800',
  }

  return (
    <div className={`flex flex-col h-full ${!visible ? 'hidden md:flex' : ''}`}>
      <div className={`p-3 rounded-t-lg font-bold text-sm text-center uppercase tracking-wider flex items-center justify-center gap-2 ${headerColors[status]}`}>
        {status.replace('_', ' ')} <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">{actions.length}</span>
      </div>
      <div className="bg-gray-100 p-3 rounded-b-lg flex-1 space-y-3 min-h-[200px] overflow-y-auto custom-scrollbar">
        {paginated.map(action => (
          <ActionCard key={action.id} action={action} status={status} onMarkDone={onMarkDone} />
        ))}
        {actions.length === 0 && <div className="text-center text-gray-400 text-xs py-10 italic">Nenhuma ação nesta etapa</div>}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </div>
  )
}

function ActionCard({ action, status, onMarkDone }) {
  const overdue = status !== 'concluida' && isOverdue(action.dueDate)
  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative ${status === 'concluida' ? 'opacity-80' : ''} ${overdue ? 'border-red-200' : ''}`}>
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${status === 'concluida' ? 'bg-emerald-500' : action.priority === 'alta' ? 'bg-red-500' : action.priority === 'media' ? 'bg-amber-400' : 'bg-blue-400'}`} />
      <div className="pl-3">
        <p className={`font-bold text-sm leading-snug ${status === 'concluida' ? 'line-through text-emerald-900 decoration-emerald-300' : 'text-gray-800'}`}>{action.title}</p>
        <p className="text-xs text-gray-500 mt-1 truncate">{action.companyName}</p>
        <div className="flex justify-between items-end mt-3 border-t border-gray-50 pt-2">
          <div className={`text-xs font-medium flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-gray-400'}`}>
            <Calendar size={12} /> {formatDate(action.dueDate)}
            {overdue && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded ml-1">atrasada</span>}
          </div>
          {status !== 'concluida' && (
            <button onClick={() => onMarkDone(action)} className="text-gray-300 hover:text-emerald-500 transition-colors p-1">
              <CheckSquare size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
