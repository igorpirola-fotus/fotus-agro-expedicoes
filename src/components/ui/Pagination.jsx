import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function usePagination(items, pageSize = 20) {
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safeCurrentPage = Math.min(page, totalPages)

  const paginated = items.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  )

  const reset = () => setPage(1)

  return { paginated, page: safeCurrentPage, setPage, totalPages, reset }
}

export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-gray-600 px-2">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
