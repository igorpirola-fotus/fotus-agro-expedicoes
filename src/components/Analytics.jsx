import React, { useMemo } from 'react'
import { TrendingUp, Truck, CheckSquare, Briefcase, MapPin, Award, AlertTriangle } from 'lucide-react'

function StatBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg}`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Analytics({ expeditions, actions, companies, visits }) {
  const stats = useMemo(() => {
    const totalExp = expeditions.length
    const expByStatus = {
      planejada: expeditions.filter(e => e.status === 'planejada').length,
      aguardando_aprovacao: expeditions.filter(e => e.status === 'aguardando_aprovacao').length,
      em_andamento: expeditions.filter(e => e.status === 'em_andamento').length,
      concluida: expeditions.filter(e => e.status === 'concluida').length,
      rejeitada: expeditions.filter(e => e.status === 'rejeitada').length,
    }

    const totalAct = actions.length
    const actDone = actions.filter(a => a.status === 'concluida').length
    const actPending = actions.filter(a => a.status === 'aberta' || a.status === 'em_andamento').length
    const actEfficiency = totalAct > 0 ? Math.round((actDone / totalAct) * 100) : 0

    const totalComp = companies.length
    const segments = companies.reduce((acc, c) => {
      const seg = c.segment || 'Não informado'
      acc[seg] = (acc[seg] || 0) + 1
      return acc
    }, {})

    const totalVisits = visits.length
    const visitsDone = visits.filter(v => v.status === 'realizada').length
    const visitsMissed = visits.filter(v => v.status === 'nao_ocorreu').length

    return { totalExp, expByStatus, totalAct, actDone, actPending, actEfficiency, totalComp, segments, totalVisits, visitsDone, visitsMissed }
  }, [expeditions, actions, companies, visits])

  const topSegments = Object.entries(stats.segments)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const segColors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
        <p className="text-gray-500 text-sm">Visão geral do desempenho das expedições.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Truck} label="Expedições" value={stats.totalExp}
          sub={`${stats.expByStatus.em_andamento} em andamento`}
          color="text-blue-600" bg="bg-blue-50" />
        <KpiCard icon={Briefcase} label="Empresas" value={stats.totalComp}
          sub={`${topSegments.length} segmentos`}
          color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard icon={CheckSquare} label="Ações" value={stats.totalAct}
          sub={`${stats.actPending} pendentes`}
          color="text-amber-600" bg="bg-amber-50" />
        <KpiCard icon={Award} label="Eficiência" value={`${stats.actEfficiency}%`}
          sub={`${stats.actDone} concluídas`}
          color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expedições por status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Truck size={16} className="text-emerald-600" /> Expedições por Status
          </h3>
          {stats.totalExp === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Nenhuma expedição cadastrada.</p>
            : <div className="space-y-3">
                <StatBar label="Planejada" value={stats.expByStatus.planejada} total={stats.totalExp} color="bg-gray-400" />
                <StatBar label="Aguardando Aprovação" value={stats.expByStatus.aguardando_aprovacao} total={stats.totalExp} color="bg-purple-400" />
                <StatBar label="Em Andamento" value={stats.expByStatus.em_andamento} total={stats.totalExp} color="bg-blue-500" />
                <StatBar label="Concluída" value={stats.expByStatus.concluida} total={stats.totalExp} color="bg-emerald-500" />
                <StatBar label="Rejeitada" value={stats.expByStatus.rejeitada} total={stats.totalExp} color="bg-red-400" />
              </div>
          }
        </div>

        {/* Ações por status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <CheckSquare size={16} className="text-emerald-600" /> Plano de Ação
          </h3>
          {stats.totalAct === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Nenhuma ação cadastrada.</p>
            : <>
                <div className="space-y-3 mb-6">
                  <StatBar label="Abertas" value={actions.filter(a => a.status === 'aberta').length} total={stats.totalAct} color="bg-gray-400" />
                  <StatBar label="Em Andamento" value={actions.filter(a => a.status === 'em_andamento').length} total={stats.totalAct} color="bg-blue-500" />
                  <StatBar label="Concluídas" value={stats.actDone} total={stats.totalAct} color="bg-emerald-500" />
                  <StatBar label="Atrasadas" value={actions.filter(a => a.status === 'atrasada').length} total={stats.totalAct} color="bg-red-400" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">{stats.actEfficiency}%</p>
                    <p className="text-xs text-gray-500">Taxa de conclusão</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-amber-600">{stats.actPending}</p>
                    <p className="text-xs text-gray-500">Pendentes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">{stats.actDone}</p>
                    <p className="text-xs text-gray-500">Concluídas</p>
                  </div>
                </div>
              </>
          }
        </div>

        {/* Empresas por segmento */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Briefcase size={16} className="text-emerald-600" /> Empresas por Segmento
          </h3>
          {topSegments.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Nenhuma empresa cadastrada.</p>
            : <div className="space-y-3">
                {topSegments.map(([seg, count], i) => (
                  <StatBar key={seg} label={seg} value={count} total={stats.totalComp} color={segColors[i % segColors.length]} />
                ))}
              </div>
          }
        </div>

        {/* Visitas */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600" /> Visitas
          </h3>
          {stats.totalVisits === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Nenhuma visita registrada.</p>
            : <>
                <div className="space-y-3 mb-6">
                  <StatBar label="Planejadas" value={visits.filter(v => v.status === 'planejada').length} total={stats.totalVisits} color="bg-gray-400" />
                  <StatBar label="Realizadas" value={stats.visitsDone} total={stats.totalVisits} color="bg-emerald-500" />
                  <StatBar label="Não ocorreram" value={stats.visitsMissed} total={stats.totalVisits} color="bg-red-400" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">
                      {stats.totalVisits > 0 ? Math.round((stats.visitsDone / stats.totalVisits) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500">Taxa de realização</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">{stats.totalVisits}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-500">{stats.visitsMissed}</p>
                    <p className="text-xs text-gray-500">Não ocorreram</p>
                  </div>
                </div>
              </>
          }
        </div>
      </div>
    </div>
  )
}
