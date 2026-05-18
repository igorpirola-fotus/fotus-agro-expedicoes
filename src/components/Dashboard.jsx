import React from 'react'
import {
  Truck, CheckSquare, AlertTriangle, CheckCircle2, BarChart3,
  MapPin, Calendar, Briefcase,
} from 'lucide-react'
import { formatDate } from '../utils/formatDate.js'
import { getStatusColor } from '../utils/getStatusColor.js'

export default function Dashboard({ userProfile, expeditions, actions, setView }) {
  const myExpeditions = expeditions.filter(
    e => userProfile.role === 'gerente' || e.userId === userProfile.uid,
  )
  const myActions = actions.filter(
    a => userProfile.role === 'gerente' || a.responsibleId === userProfile.uid,
  )

  const pendingActions = myActions.filter(
    a => a.status === 'aberta' || a.status === 'atrasada',
  ).length
  const completedActions = myActions.filter(a => a.status === 'concluida').length
  const activeExpeditions = myExpeditions.filter(e => e.status === 'em_andamento').length

  const stats = [
    { label: 'Em Campo', value: activeExpeditions, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ações Pendentes', value: pendingActions, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Concluídas', value: completedActions, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    {
      label: 'Eficiência',
      value: `${myActions.length > 0 ? Math.round((completedActions / myActions.length) * 100) : 0}%`,
      icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Olá, {userProfile.name.split(' ')[0]}</h2>
        <p className="text-gray-500 text-sm">Bem-vindo ao painel de controle.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-full mb-3 ${stat.bg}`}><stat.icon className={stat.color} size={24} /></div>
            <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expedições ativas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Truck size={18} className="text-gray-400" /> Expedições Ativas
            </h3>
            <button onClick={() => setView('expeditions')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Ver todas</button>
          </div>
          <div className="space-y-4 flex-1">
            {myExpeditions.filter(e => e.status === 'em_andamento').slice(0, 3).map(exp => (
              <div key={exp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800">{exp.title}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <MapPin size={12} /> {exp.region}
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <Calendar size={12} /> {formatDate(exp.startDate)}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(exp.status, 'expedition')}`}>
                  em andamento
                </div>
              </div>
            ))}
            {myExpeditions.filter(e => e.status === 'em_andamento').length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Nenhuma expedição ativa.</div>
            )}
          </div>
        </div>

        {/* Próximas ações */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <CheckSquare size={18} className="text-gray-400" /> Próximas Ações
            </h3>
            <button onClick={() => setView('actions')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Ver todas</button>
          </div>
          <div className="space-y-3 flex-1">
            {myActions.filter(a => a.status !== 'concluida').slice(0, 4).map(action => (
              <div key={action.id} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${action.priority === 'alta' ? 'bg-red-500' : action.priority === 'media' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{action.title}</p>
                  <p className="text-xs text-gray-500 truncate">{action.companyName}</p>
                </div>
                <div className="text-xs font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded">
                  {formatDate(action.dueDate)}
                </div>
              </div>
            ))}
            {myActions.filter(a => a.status !== 'concluida').length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Tudo em dia! Nenhuma ação pendente.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
