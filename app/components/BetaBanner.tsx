'use client'

import { useState } from 'react'

export default function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 text-center relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <span className="text-lg font-bold">⚠️ BETA</span>
        <span className="text-sm">
          Esta página se encuentra en fase beta. Pueden existir errores o funcionalidades incompletas.
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-white hover:text-gray-200 font-bold text-xl"
          aria-label="Cerrar banner"
        >
          ×
        </button>
      </div>
    </div>
  )
}
