import React, { useState, useMemo } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db, appId, colPath } from '../lib/firebase.js'
import { Truck, MapPin, Calendar, Plus, AlertTriangle, Briefcase } from 'lucide-react'
import { formatDate } from '../utils/formatDate.js'
import { getStatusColor } from '../utils/getStatusColor.js'
import { notifyExpeditionApproved, notifyExpeditionRejected } from '../lib/notifications.js'
import Button from './ui/Button.jsx'
import SearchBar from './ui/SearchBar.jsx'
import Select from './ui/Select.jsx'
import CreateExpeditionModal from './modals/CreateExpeditionModal.jsx'
import PostExpeditionModal from './modals/PostExpeditionModal.jsx'
import RejectExpeditionModal from './modals/RejectExpeditionModal.jsx'

export default function ExpeditionList({
  expeditions, userProfile, onSelect, companies, user, showToast, visits,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [closingExpedition, setClosingExpedition] = useState(null)
  const [rejectingExp, setRejectingExp] = useState(null)
  const [viewMode, setViewMode] = useState('kanban')

  // Filtros
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const myExpeditions = useMemo(() => {
    let list = userProfile.role === 'gerente'
      ? expeditions
      : expeditions.filter(e => e.userId === userProfile.uid)

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.region?.toLowerCase().includes(q) ||
        e.userName?.toLowerCase().includes(q),
      )
    }
    if (statusFilter !== 'todos') {
      list = list.filter(e => e.status === statusFilter)
    }
    if (dateFrom) list = list.filter(e => e.startDate >= dateFrom)
    if (dateTo) list = list.filter(e => e.startDate <= dateTo)
    return list
  }, [expeditions, userProfile, search, statusFilter, dateFrom, dateTo])

  const colunas = [
    { id: 'planejadas', title: 'Planejadas / Aguardando', statuses: ['aguardando_aprovacao', 'devolvida', 'planejada'], bg: 'bg-slate-100' },
    { id: 'ativas', title: 'Em Campo (Ativas)', statuses: ['em_andamento'], bg: 'bg-blue-50/50' },
    { id: 'realizadas', title: 'Realizadas', statuses: ['concluida'], bg: 'bg-emerald-50/50' },
  ]

  const groupedByExecutive = useMemo(() => {
    const groups = {}
    myExpeditions.forEach(exp => {
      const uId = exp.userId || 'unknown'
      if (!groups[uId]) groups[uId] = { userId: uId, userName: exp.userName || 'Executivo', expeditions: [] }
      groups[uId].expeditions.push(exp)
    })
    return Object.values(groups)
  }, [myExpeditions])

  const handleApprove = async (exp) => {
    await updateDoc(doc(db, colPath('expeditions'), exp.id), { status: 'planejada' })
    showToast('Expedição Aprovada!')
    notifyExpeditionApproved(exp)
  }

  const handleReject = async (exp, reason) => {
    if (!reason) { showToast('Informe o motivo da reprovação.', 'error'); return }
    await updateDoc(doc(db, colPath('expeditions'), exp.id), { status: 'devolvida', rejectionReason: reason })
    showToast('Expedição devolvida para ajustes.', 'error')
    notifyExpeditionRejected(exp, reason)
    setRejectingExp(null)
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quadro de Expedições</h2>
          <p className="text-gray-500 text-sm">Acompanhe o status das viagens.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {userProfile.role === 'gerente' && (
            <div className="flex bg-gray-200 p-1 rounded-lg w-full md:w-auto">
              <button onClick={() => setViewMode('kanban')} className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>Kanban</button>
              <button onClick={() => setViewMode('executivo')} className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'executivo' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>Por Executivo</button>
            </div>
          )}
          <Button onClick={() => setIsModalOpen(true)} icon={Plus} className="w-full md:w-auto">Nova Expedição</Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 shrink-0">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por título, região ou executivo..."
          className="flex-1 min-w-[220px]"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        >
          <option value="todos">Todos os status</option>
          <option value="aguardando_aprovacao">Aguardando aprovação</option>
          <option value="devolvida">Devolvida</option>
          <option value="planejada">Planejada</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Data início (a partir de)" className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Data início (até)" className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
      </div>

      {/* Kanban */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 snap-x">
          {colunas.map(col => (
            <div key={col.id} className={`min-w-[320px] md:min-w-[350px] flex-1 rounded-2xl flex flex-col snap-center border border-gray-200/60 shadow-sm overflow-hidden ${col.bg}`}>
              <div className="p-4 border-b border-gray-200/50 bg-white/50 sticky top-0 z-10 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">{col.title}</h3>
                <span className="bg-white px-2.5 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm border border-gray-100">
                  {myExpeditions.filter(e => col.statuses.includes(e.status)).length}
                </span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {myExpeditions.filter(e => col.statuses.includes(e.status)).map(exp => (
                  <ExpeditionCard
                    key={exp.id}
                    exp={exp}
                    userProfile={userProfile}
                    onSelect={onSelect}
                    onApprove={handleApprove}
                    onReject={() => setRejectingExp(exp)}
                    onStart={() => { updateDoc(doc(db, colPath('expeditions'), exp.id), { status: 'em_andamento' }); showToast('Viagem Iniciada!') }}
                    onClose={() => setClosingExpedition(exp)}
                    onResubmit={() => { updateDoc(doc(db, colPath('expeditions'), exp.id), { status: 'aguardando_aprovacao', rejectionReason: null }); showToast('Reenviada para aprovação!') }}
                  />
                ))}
                {myExpeditions.filter(e => col.statuses.includes(e.status)).length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-10 opacity-60">
                    <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-2"><Truck size={20} /></div>
                    <p>Nenhuma expedição</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6 pb-4">
          {groupedByExecutive.map(group => {
            const realizadas = group.expeditions.filter(e => e.status === 'concluida').length
            return (
              <div key={group.userId} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">{group.userName.charAt(0)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{group.userName}</h3>
                      <span className="text-gray-500 text-sm">{group.expeditions.length} expedições</span>
                    </div>
                  </div>
                  <div className="flex gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="text-center px-2"><span className="block text-[10px] font-bold text-gray-400 uppercase">Realizadas</span><span className="text-xl font-bold text-emerald-600">{realizadas}</span></div>
                    <div className="w-px bg-gray-200" />
                    <div className="text-center px-2"><span className="block text-[10px] font-bold text-gray-400 uppercase">Pendentes</span><span className="text-xl font-bold text-amber-500">{group.expeditions.length - realizadas}</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.expeditions.map(exp => {
                    const expVisits = visits.filter(v => v.expeditionId === exp.id)
                    const visRealizadas = expVisits.filter(v => v.status === 'realizada').length
                    return (
                      <div key={exp.id} onClick={() => onSelect(exp.id)} className="border border-gray-200 bg-gray-50 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all p-4 rounded-xl flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-gray-800 text-sm truncate pr-2">{exp.title}</h4>
                          <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(exp.status, 'expedition')}`}>{exp.status.replace('_', ' ')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-auto bg-white p-3 rounded-lg border border-gray-100">
                          <div><span className="text-xs text-gray-400 uppercase font-semibold">Realizadas</span><span className="font-bold text-emerald-600 text-lg block">{visRealizadas}</span></div>
                          <div><span className="text-xs text-gray-400 uppercase font-semibold">Pendentes</span><span className="font-bold text-amber-500 text-lg block">{expVisits.length - visRealizadas}</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {groupedByExecutive.length === 0 && <div className="text-center py-16 text-gray-400">Nenhuma expedição encontrada.</div>}
        </div>
      )}

      {isModalOpen && (
        <CreateExpeditionModal onClose={() => setIsModalOpen(false)} companies={companies} user={user} userProfile={userProfile} showToast={showToast} />
      )}
      {closingExpedition && (
        <PostExpeditionModal expedition={closingExpedition} onClose={() => setClosingExpedition(null)} showToast={showToast} />
      )}
      {rejectingExp && (
        <RejectExpeditionModal
          onClose={() => setRejectingExp(null)}
          onConfirm={(reason) => handleReject(rejectingExp, reason)}
        />
      )}
    </div>
  )
}

function ExpeditionCard({ exp, userProfile, onSelect, onApprove, onReject, onStart, onClose, onResubmit }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col">
      <div onClick={() => onSelect(exp.id)}>
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(exp.status, 'expedition')}`}>
            {exp.status.replace(/_/g, ' ')}
          </span>
        </div>
        <h4 className="font-bold text-gray-800 text-base mb-1 group-hover:text-emerald-700 transition-colors leading-tight">{exp.title}</h4>
        <div className="space-y-1.5 text-xs text-gray-500 mt-3">
          <div className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {exp.region}</div>
          <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> {formatDate(exp.startDate)} a {formatDate(exp.endDate)}</div>
        </div>
        {(exp.status === 'aguardando_aprovacao' || exp.status === 'devolvida') && exp.totals && (
          <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div><span className="block text-gray-400 font-bold text-[9px] uppercase">Custo Est.</span><span className="font-bold text-emerald-700">R$ {exp.totals.cost?.toFixed(2)}</span></div>
            <div><span className="block text-gray-400 font-bold text-[9px] uppercase">Distância</span><span className="font-bold text-blue-700">{exp.totals.km} KM</span></div>
          </div>
        )}
        {exp.status === 'devolvida' && exp.rejectionReason && (
          <div className="mt-3 p-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
            <span className="font-bold block text-[10px] uppercase mb-0.5"><AlertTriangle size={10} className="inline mr-1" />Motivo:</span>
            {exp.rejectionReason}
          </div>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1"><Briefcase size={12} /> {exp.totalCompanies || 0} Leads</span>
        <div className="flex gap-1.5">
          {exp.status === 'aguardando_aprovacao' && userProfile.role === 'gerente' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onReject() }} className="text-[10px] bg-red-50 text-red-600 px-2 py-1.5 rounded-lg font-bold hover:bg-red-100 border border-red-100">Reprovar</button>
              <button onClick={(e) => { e.stopPropagation(); onApprove(exp) }} className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-bold hover:bg-emerald-200">Aprovar</button>
            </>
          )}
          {exp.status === 'devolvida' && userProfile.role === 'executivo' && (
            <button onClick={(e) => { e.stopPropagation(); onResubmit() }} className="text-[10px] bg-purple-100 text-purple-700 px-2.5 py-1.5 rounded-lg font-bold hover:bg-purple-200">Reenviar</button>
          )}
          {exp.status === 'planejada' && (
            <button onClick={(e) => { e.stopPropagation(); onStart() }} className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-200">Iniciar</button>
          )}
          {exp.status === 'em_andamento' && (
            <button onClick={(e) => { e.stopPropagation(); onClose() }} className="text-[10px] bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700">Concluir Viagem</button>
          )}
        </div>
      </div>
    </div>
  )
}
