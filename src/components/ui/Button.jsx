import React from 'react'

const VARIANTS = {
  primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200",
  secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
  ghost: "text-emerald-600 hover:bg-emerald-50",
}

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5",
  lg: "px-6 py-3 text-lg",
}

export default function Button({
  children, onClick, variant = 'primary', className = '',
  type = 'button', disabled = false, icon: Icon, size = 'md',
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${SIZES[size]} rounded-lg font-medium transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  )
}
