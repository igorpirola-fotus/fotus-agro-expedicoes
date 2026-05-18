export function formatDate(dateString) {
  if (!dateString) return '-'
  try {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function daysFromNow(days) {
  return new Date(Date.now() + 86400000 * days).toISOString().split('T')[0]
}

export function isOverdue(dateString) {
  if (!dateString) return false
  return dateString < todayISO()
}
