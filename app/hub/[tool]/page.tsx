'use client'

import { use, Suspense, lazy } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { registerAllTools, getTool } from '@/tools'
import { useTrackToolOpened } from '@/lib/analytics/hooks'

// Registrar herramientas
registerAllTools()

interface PageProps {
  params: Promise<{ tool: string }>
}

function ToolContent({ toolId }: { toolId: string }) {
  const tool = getTool(toolId)

  // Track tool opened
  useTrackToolOpened(toolId)

  if (!tool) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Herramienta no encontrada</h1>
          <p className="text-gray-600">La herramienta que buscas no existe.</p>
          <Link
            href="/hub"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Volver al Hub
          </Link>
        </div>
      </div>
    )
  }

  // Lazy load del componente usando dynamic de Next.js
  const ToolComponent = dynamic(() => tool.component(), {
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando herramienta...</p>
        </div>
      </div>
    ),
    ssr: false
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-4">
            <Link
              href="/hub"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Volver al Hub
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Inicio
            </Link>
          </nav>
        </div>
      </header>

      {/* Tool Component */}
      <main className="py-8">
        <ToolComponent />
      </main>
    </div>
  )
}

export default function ToolPage({ params }: PageProps) {
  const { tool } = use(params)

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando herramienta...</p>
          </div>
        </div>
      }
    >
      <ToolContent toolId={tool} />
    </Suspense>
  )
}
