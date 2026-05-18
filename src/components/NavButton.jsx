import React from 'react'

export default function NavButton({ icon: Icon, label, active, onClick, mobile }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 ${
        active
          ? 'bg-emerald-800 text-white font-medium shadow-inner'
          : 'text-emerald-100 hover:bg-emerald-800/40 hover:text-white'
      } ${mobile ? 'text-lg' : 'text-sm'}`}
    >
      <Icon size={mobile ? 24 : 18} />
      {label}
    </button>
  )
}
