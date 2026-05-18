import React from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, children, onClose, footer, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] flex flex-col overflow-hidden`}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">{footer}</div>
        )}
      </div>
    </div>
  )
}
