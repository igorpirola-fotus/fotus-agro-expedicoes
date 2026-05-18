import React, { useState } from 'react'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, colPath } from '../lib/firebase.js'
import {
  ArrowLeft, MapPin, BarChart3, CheckSquare, CheckCircle2,
  Clock, Plus, AlertTriangle, ArrowRight,
} from 'lucide-react'
import { formatDate } from '../utils/formatDate.js'
import { getStatusColor } from '../utils/getStatusColor.js'
import { notifyExpeditionApproved, notifyExpeditionRejected } from '../lib/notifications.js'
import Button from './ui/Button.jsx'
import Modal from './ui/Modal.jsx'
import PostExpeditionModal from './modals/PostExpeditionModal.jsx'
import RejectExpeditionModal from './modals/RejectExpeditionModal.jsx'
import VisitDetailModal from './modals/VisitDetailModal.jsx'
import ActionFormModal from './modals/ActionFormModal.jsx'
import ExpeditionMap from './ExpeditionMap.jsx'

export default function ExpeditionDetail({
  expeditionId, expeditions, visits, actions, companies,
  onBack, userProfile, showToast,
}) {
  const expedition = expeditions.find(e => e.id === expeditionId)
  const [activeTab, setActiveTab] = useState('visitas')
  const [modalType, setModalType] = useState(null)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [isRejecting, setIsRejecting] = useState(false)

  if (!expedition) return <div>Expedição não encontrada</div>

  const handleStatusChange = async (newStatus) => {
    await updateDoc(doc(db, colPath('expeditions'), expeditionId), { status: newStatus })
    showToast(`Status atualizado para ${newStatus.replace(/_/g, ' ')}`)
  }

  const handleApprove = async () => {
    await handleStatusChange('planejada')
    notifyExpeditionApproved(expedition)
  }

  const handleReject = async (reason) => {
    if (!reason) { showToast('Informe o motivo.', 'error'); return }
    await updateDoc(doc(db, colPath('expeditions'), expeditionId), { status: 'devolvida', rejectionReason: reason })
    showToast('Expedição devolvida para ajustes.', 'error')
    notifyExpeditionRejected(expedition, reason)
    setIsRejecting(false)
  }

  const handleAddVisit = async (companyId) => {
    const comp = companies.find(c => c.id === companyId)
    if (!comp) return
    await addDoc(collection(db, colPath('visits')), {
      expeditionId, companyId: comp.id, companyName: comp.name,
      city: comp.city, status: 'planejada',
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
    })
    showToast('Empresa adicionada ao roteiro')
    setModalType(null)
  }

  const visitsDone = visits.filter(v => v.status === 'realizada').length
  const visitsPct = visits.length > 0 ? Math.round((visitsDone / visits.length) * 100) : 0

  return (
    <div className="space-y-6 pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 leading-tight">{expedition.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(expedition.status, 'expedition')}`}>{expedition.status.replace(/_/g, ' ')}</span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-gray-500 text-xs flex items-center gap-1"><MapPin size={12} /> {expedition.region}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {expedition.status === 'aguardando_aprovacao' && userProfile.role === 'gerente' && (
              <>
                <Button variant="danger" size="sm" onClick={() => setIsRejecting(true)}>Devolver</Button>
                <Button size="sm" onClick={handleApprove}>Aprovar</Button>
              </>
            )}
            {expedition.status === 'devolvida' && userProfile.role === 'executivo' && (
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                updateDoc(doc(db, colPath('expeditions'), expeditionId), { status: 'aguardando_aprovacao', rejectionReason: null })
                showToast('Reenviada para aprovação!')
              }}>Reenviar p/ Aprovação</Button>
            )}
            {expedition.status === 'planejada' && <Button size="sm" onClick={() => handleStatusChange('em_andamento')}>Iniciar Viagem</Button>}
            {expedition.status === 'em_andamento' && <Button size="sm" className="bg-emerald-700" onClick={() => setModalType('fechar')}>Concluir Viagem</Button>}
          </div>
        </div>

        {expedition.status === 'devolvida' && expedition.rejectionReason && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
            <div className="flex gap-3 items-start">
              <AlertTriangle size={20} className="text-red-500 mt-0.5" />
              <div><h4 className="font-bold text-red-800 text-sm">Devolvida para ajustes</h4><p className="text-red-700 text-sm mt-1">{expedition.rejectionReason}</p></div>
            </div>
          </div>
        )}

        {/* Resumo financeiro */}
        {expedition.costs && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase flex items-center gap-2"><BarChart3 size={16} className="text-emerald-600" /> Resumo do Planejamento</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatBox label="Custo Total" value={`R$ ${expedition.totals?.cost?.toFixed(2) || '0.00'}`} color="text-emerald-700" />
              <StatBox label="Distância" value={`${expedition.totals?.km || 0} KM`} color="text-blue-700" />
              <StatBox label="Combustível" value={`R$ ${expedition.costs.totalFuelCost?.toFixed(2) || '0.00'}`} color="text-amber-600" />
              <StatBox label="Outros" value={`R$ ${((expedition.totals?.cost || 0) - (expedition.costs.totalFuelCost || 0)).toFixed(2)}`} color="text-purple-600" />
            </div>
            <div className="space-y-2">
              {expedition.routes?.map((r, i) => (
                <div key={i} className="flex flex-col md:flex-row md:justify-between md:items-center bg-white p-3 rounded-lg border border-slate-200 text-sm gap-2">
                  <span className="flex items-center gap-2 text-gray-700">
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded">#{i + 1}</span>
                    {r.from} <ArrowRight size={14} className="text-gray-400" /> {r.to}
                  </span>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100"><MapPin size={12} /> {r.distance} KM</span>
                    <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{r.leadsCount || 0} Leads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra de progresso */}
        <div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${visitsPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{visitsDone} de {visits.length} visitas realizadas</span>
            <span>{visitsPct}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <TabBtn label="Roteiro & Visitas" active={activeTab === 'visitas'} onClick={() => setActiveTab('visitas')} />
        <TabBtn label={`Plano de Ação (${actions.length})`} active={activeTab === 'plano'} onClick={() => setActiveTab('plano')} />
        <TabBtn label="Mapa de Rotas" active={activeTab === 'mapa'} onClick={() => setActiveTab('mapa')} />
      </div>

      {/* Tab: Visitas */}
      {activeTab === 'visitas' && (
        <div className="space-y-4">
          <Button variant="secondary" onClick={() => setModalType('add_company')} className="w-full border-dashed border-2 text-gray-500 hover:text-emerald-600 hover:border-emerald-200" icon={Plus}>
            Adicionar empresa ao roteiro
          </Button>
          {visits.map(visit => (
            <VisitCard key={visit.id} visit={visit} onOpen={() => { setSelectedVisit(visit); setModalType('visit') }} />
          ))}
        </div>
      )}

      {/* Tab: Plano de Ação */}
      {activeTab === 'plano' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">Progresso</p>
              <p className="text-2xl font-bold text-gray-800">
                {actions.length > 0 ? Math.round((actions.filter(a => a.status === 'concluida').length / actions.length) * 100) : 0}%
              </p>
            </div>
            <Button onClick={() => setModalType('new_action')} size="sm" icon={Plus}>Nova Ação</Button>
          </div>
          <div className="space-y-4">
            {['aberta', 'em_andamento', 'concluida'].map(status => {
              const filtered = actions.filter(a => a.status === status)
              if (filtered.length === 0) return null
              return (
                <div key={status}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                    {status === 'concluida' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    {status.replace('_', ' ')}
                  </h4>
                  <div className="space-y-3">
                    {filtered.map(action => (
                      <div key={action.id} className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-3 ${status === 'concluida' ? 'opacity-80' : ''}`}>
                        <div className={`mt-1 w-1.5 self-stretch rounded-full shrink-0 ${status === 'concluida' ? 'bg-emerald-500' : action.priority === 'alta' ? 'bg-red-500' : action.priority === 'media' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h5 className={`font-bold text-sm ${status === 'concluida' ? 'line-through text-emerald-900 decoration-emerald-300' : 'text-gray-800'}`}>{action.title}</h5>
                            {status !== 'concluida' && (
                              <button onClick={() => { updateDoc(doc(db, colPath('actions'), action.id), { status: 'concluida' }); showToast('Ação concluída!') }} className="text-gray-300 hover:text-emerald-500"><CheckSquare size={18} /></button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{action.companyName}</p>
                          <div className="flex items-center gap-2 mt-2"><span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">Vence: {formatDate(action.dueDate)}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Mapa */}
      {activeTab === 'mapa' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Visualização geográfica dos trechos da expedição (via OpenStreetMap).</p>
          <ExpeditionMap routes={expedition.routes || []} />
        </div>
      )}

      {/* Modals */}
      {modalType === 'fechar' && (
        <PostExpeditionModal expedition={expedition} onClose={() => { setModalType(null); onBack() }} showToast={showToast} />
      )}
      {modalType === 'add_company' && (
        <Modal title="Selecionar Empresa" onClose={() => setModalType(null)}>
          <div className="space-y-2">
            {companies.filter(c => !visits.some(v => v.companyId === c.id)).map(comp => (
              <button key={comp.id} onClick={() => handleAddVisit(comp.id)} className="w-full text-left p-3 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-100 flex justify-between items-center group">
                <span className="font-medium text-gray-700 group-hover:text-emerald-800">{comp.name}</span>
                <Plus size={16} className="text-gray-300 group-hover:text-emerald-600" />
              </button>
            ))}
            {companies.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma empresa disponível.</p>}
          </div>
        </Modal>
      )}
      {modalType === 'visit' && selectedVisit && (
        <VisitDetailModal visit={selectedVisit} onClose={() => { setModalType(null); setSelectedVisit(null) }} user={userProfile} showToast={showToast} />
      )}
      {modalType === 'new_action' && (
        <ActionFormModal onClose={() => setModalType(null)} user={userProfile} initialData={{ expeditionId }} companies={companies} showToast={showToast} />
      )}
      {isRejecting && (
        <RejectExpeditionModal onClose={() => setIsRejecting(false)} onConfirm={handleReject} />
      )}
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="bg-white p-3.5 rounded-lg shadow-sm border border-slate-100">
      <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">{label}</span>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  )
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {label}
    </button>
  )
}

function VisitCard({ visit, onOpen }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{visit.companyName}</h3>
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5"><MapPin size={12} /> {visit.city}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(visit.status, 'visit')}`}>{visit.status.replace('_', ' ')}</span>
        </div>
        {visit.status === 'realizada' ? (
          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-sm text-gray-700 mb-4"><strong className="text-emerald-800 text-xs uppercase block mb-1">Relatório de Visita</strong>{visit.notesPos || 'Sem anotações.'}</div>
        ) : visit.status === 'nao_ocorreu' ? (
          <div className="bg-red-50/50 p-3 rounded-lg border border-red-100 text-sm text-gray-700 mb-4"><strong className="text-red-800 text-xs uppercase block mb-1">Visita Não Ocorreu</strong>{visit.notesPos || 'Sem anotações.'}</div>
        ) : (
          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 text-sm text-gray-700 mb-4"><strong className="text-amber-800 text-xs uppercase block mb-1">Objetivo Pré-Visita</strong>{visit.notesPre || 'Não definido'}</div>
        )}
        <div className="flex gap-3 mt-4">
          {visit.status === 'planejada' ? (
            <Button variant="primary" onClick={onOpen} className="flex-1 text-sm">Registrar Visita</Button>
          ) : (
            <Button variant="secondary" onClick={onOpen} className="flex-1 text-sm text-gray-600">Ver Detalhes / Editar</Button>
          )}
        </div>
      </div>
    </div>
  )
}
