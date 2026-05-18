import React from 'react'
import { ChevronRight } from 'lucide-react'

export default function Select({ label, children, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        <select
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm appearance-none bg-white"
          {...props}
        >
          {children}
        </select>
        <ChevronRight className="absolute right-3 top-3 text-gray-400 rotate-90 pointer-events-none" size={16} />
      </div>
    </div>
  )
}
