import React, { useState } from 'react'
import {
  collection, doc, writeBatch, serverTimestamp,
} from 'firebase/firestore'
import { db, colPath } from '../../lib/firebase.js'
import { MapPin, Plus, Trash2, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'
import { notifyExpeditionSubmitted } from '../../lib/notifications.js'

export default function CreateExpeditionModal({ onClose, companies, user, userProfile, showToast }) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({ title: '', region: '', startDate: '', endDate: '' })
  const [costs, setCosts] = useState({ flights: 0, lodging: 0, rental: 0, meals: 0, fuelPrice: 5.8, avgConsumption: 10 })
  const [routes, setRoutes] = useState([{ id: 1, from: '', to: '', distance: 0, leads: [] }])

  const totalDistance = routes.reduce((acc, r) => acc + (Number(r.distance) || 0), 0)
  const totalFuelCost = costs.avgConsumption > 0 ? (totalDistance / costs.avgConsumption) * costs.fuelPrice : 0
  const grandTotal = Number(costs.flights) + Number(costs.lodging) + Number(costs.rental) + Number(costs.meals) + totalFuelCost
  const totalLeads = routes.reduce((acc, r) => acc + r.leads.length, 0)

  const addRoute = () => setRoutes([...routes, { id: Date.now(), from: '', to: '', distance: 0, leads: [] }])
  const removeRoute = (id) => setRoutes(routes.filter(r => r.id !== id))
  const updateRoute = (id, field, value) => setRoutes(routes.map(r => r.id === id ? { ...r, [field]: value } : r))
  const addLead = (routeId) => setRoutes(routes.map(r => r.id === routeId ? { ...r, leads: [...r.leads, { id: Date.now(), name: '', objective: '' }] } : r))
  const updateLead = (routeId, leadId, field, value) => setRoutes(routes.map(r => r.id === routeId ? { ...r, leads: r.leads.map(l => l.id === leadId ? { ...l, [field]: value } : l) } : r))
  const removeLead = (routeId, leadId) => setRoutes(routes.map(r => r.id === routeId ? { ...r, leads: r.leads.filter(l => l.id !== leadId) } : r))

  const handleSubmit = async () => {
    if (!formData.title || !formData.startDate) { showToast('Preencha o título e as datas.', 'error'); return }
    if (totalLeads === 0) { showToast('Adicione pelo menos um lead em alguma rota.', 'error'); return }
    setIsSubmitting(true)
    try {
      const batch = writeBatch(db)
      const expRef = doc(collection(db, colPath('expeditions')))

      const expeditionData = {
        ...formData,
        userId: user.uid,
        userName: userProfile?.name || user.email || 'Executivo',
        status: 'aguardando_aprovacao',
        costs: { ...costs, totalFuelCost, grandTotal },
        routes: routes.map(r => ({ from: r.from, to: r.to, distance: r.distance, leadsCount: r.leads.length })),
        totalCompanies: totalLeads,
        totals: { km: totalDistance, cost: grandTotal },
        createdAt: serverTimestamp(),
      }

      batch.set(expRef, expeditionData)

      for (const route of routes) {
        for (const lead of route.leads) {
          if (!lead.name.trim()) continue
          let companyId = null
          const existing = companies.find(c => c.name.toLowerCase() === lead.name.trim().toLowerCase())
          if (existing) {
            companyId = existing.id
          } else {
            const compRef = doc(collection(db, colPath('companies')))
            batch.set(compRef, {
              name: lead.name.trim(), city: route.to || route.from || 'Desconhecida',
              state: formData.region, segment: 'Prospect/Lead',
              createdByUserName: userProfile?.name || user.email || 'Sistema',
              createdAt: serverTimestamp(),
            })
            companyId = compRef.id
          }
          const visitRef = doc(collection(db, colPath('visits')))
          batch.set(visitRef, {
            expeditionId: expRef.id, companyId, companyName: lead.name.trim(),
            city: route.to || 'Em rota', status: 'planejada',
            notesPre: lead.objective || 'Objetivo não especificado',
            createdAt: serverTimestamp(),
          })
        }
      }

      await batch.commit()
      showToast('Expedição enviada para aprovação!')
      notifyExpeditionSubmitted({ ...expeditionData, id: expRef.id }, userProfile?.name)
      onClose()
    } catch (err) {
      showToast('Erro ao enviar expedição: ' + err.message, 'error')
    } finally { setIsSubmitting(false) }
  }

  return (
    <Modal
      title="Planejamento Pré-Viagem"
      onClose={onClose}
      wide
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-sm">
            <span className="text-gray-500 block text-xs">Custo Estimado</span>
            <strong className="text-lg text-emerald-700">R$ {grandTotal.toFixed(2)}</strong>
          </div>
          <div className="flex gap-2">
            {step === 2 && <Button variant="secondary" onClick={() => setStep(1)}>Voltar</Button>}
            {step === 1 && <Button onClick={() => setStep(2)}>Próximo: Rotas & Leads</Button>}
            {step === 2 && <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : 'Enviar p/ Aprovação'}</Button>}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex gap-2 mb-6">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">Dados Básicos</h4>
              <Input label="Título da Expedição" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Expansão Norte PR" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Região Base" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} />
                <Input label="Data Início" type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                <Input label="Data Fim" type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 border-b pb-2 mb-4">Orçamento & Custos (R$)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label="Voos" type="number" min="0" step="0.01" value={costs.flights} onChange={e => setCosts({ ...costs, flights: Number(e.target.value) })} />
                <Input label="Hospedagem" type="number" min="0" step="0.01" value={costs.lodging} onChange={e => setCosts({ ...costs, lodging: Number(e.target.value) })} />
                <Input label="Aluguel Veículo" type="number" min="0" step="0.01" value={costs.rental} onChange={e => setCosts({ ...costs, rental: Number(e.target.value) })} />
                <Input label="Alimentação" type="number" min="0" step="0.01" value={costs.meals} onChange={e => setCosts({ ...costs, meals: Number(e.target.value) })} />
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 mt-2">
                <Input label="Preço Combustível (R$/L)" type="number" step="0.01" value={costs.fuelPrice} onChange={e => setCosts({ ...costs, fuelPrice: Number(e.target.value) })} />
                <Input label="Média Km/L Veículo" type="number" step="0.1" value={costs.avgConsumption} onChange={e => setCosts({ ...costs, avgConsumption: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-gray-800">Rotas e Leads</h4>
              <span className="text-xs text-gray-500">{totalDistance} km total • {totalLeads} leads</span>
            </div>
            <div className="space-y-6">
              {routes.map((route, rIndex) => (
                <div key={route.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 relative">
                  {routes.length > 1 && (
                    <button onClick={() => removeRoute(route.id)} className="absolute right-3 top-3 text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                  )}
                  <h5 className="text-xs font-bold text-emerald-700 uppercase mb-3">Trecho {rIndex + 1}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <Input label="Origem" value={route.from} onChange={e => updateRoute(route.id, 'from', e.target.value)} placeholder="Ex: São Paulo, SP" />
                    <Input label="Destino" value={route.to} onChange={e => updateRoute(route.id, 'to', e.target.value)} placeholder="Ex: Campinas, SP" />
                    <Input label="Distância (KM)" type="number" min="0" value={route.distance} onChange={e => updateRoute(route.id, 'distance', e.target.value)} />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-gray-700">Leads neste trecho ({route.leads.length})</label>
                      <Button size="sm" variant="secondary" onClick={() => addLead(route.id)} className="py-1 px-2 text-xs h-auto"><Plus size={14} /> Add Lead</Button>
                    </div>
                    <div className="space-y-2">
                      {route.leads.map(lead => (
                        <div key={lead.id} className="flex gap-2 items-start bg-white p-2 rounded border border-gray-200">
                          <div className="w-1/3">
                            <input className="w-full p-2 border border-gray-200 rounded text-sm outline-none focus:border-emerald-500" placeholder="Nome da Empresa/Lead" value={lead.name} onChange={e => updateLead(route.id, lead.id, 'name', e.target.value)} />
                          </div>
                          <div className="flex-1">
                            <input className="w-full p-2 border border-gray-200 rounded text-sm outline-none focus:border-emerald-500" placeholder="Objetivo da visita" value={lead.objective} onChange={e => updateLead(route.id, lead.id, 'objective', e.target.value)} />
                          </div>
                          <button onClick={() => removeLead(route.id, lead.id)} className="p-2 text-gray-400 hover:text-red-500"><Plus size={16} className="rotate-45" /></button>
                        </div>
                      ))}
                      {route.leads.length === 0 && <p className="text-xs text-gray-400 italic">Nenhum lead adicionado.</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={addRoute} className="w-full border-dashed border-2 hover:border-emerald-300 hover:text-emerald-700" icon={MapPin}>
              Adicionar Novo Trecho/Rota
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
