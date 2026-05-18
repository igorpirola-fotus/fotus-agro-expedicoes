const STATUS_MAP = {
  expedition: {
    aguardando_aprovacao: "bg-purple-100 text-purple-800 border-purple-200",
    devolvida: "bg-red-100 text-red-800 border-red-200",
    planejada: "bg-blue-100 text-blue-800 border-blue-200",
    em_andamento: "bg-amber-100 text-amber-800 border-amber-200",
    concluida: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  action: {
    aberta: "bg-slate-100 text-slate-700 border-slate-200",
    em_andamento: "bg-blue-50 text-blue-700 border-blue-200",
    concluida: "bg-emerald-50 text-emerald-700 border-emerald-200",
    atrasada: "bg-red-50 text-red-700 border-red-200",
  },
  visit: {
    planejada: "bg-gray-100 text-gray-600 border-gray-200",
    realizada: "bg-emerald-100 text-emerald-800 border-emerald-200",
    nao_ocorreu: "bg-red-100 text-red-800 border-red-200",
  },
}

export function getStatusColor(status, type) {
  return STATUS_MAP[type]?.[status] || "bg-gray-100 text-gray-800 border-gray-200"
}

export const EXPEDITION_STATUSES = Object.keys(STATUS_MAP.expedition)
export const ACTION_STATUSES = Object.keys(STATUS_MAP.action)
export const VISIT_STATUSES = Object.keys(STATUS_MAP.visit)
