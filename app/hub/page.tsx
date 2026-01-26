import Link from 'next/link'
import { registerAllTools, getAvailableTools } from '@/tools'

// Registrar herramientas al inicio
registerAllTools()

// Configuración de caché (ISR - revalidate cada hora)
export const revalidate = 3600

export default function HubPage() {
  const tools = getAvailableTools()

  // Agrupar por categoría
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, typeof tools>)

  const categoryNames: Record<string, string> = {
    costos: '💰 Costos',
    calidad: '✅ Calidad',
    materiales: '🧱 Materiales',
    diseño: '🎨 Diseño',
    utilidades: '🔧 Utilidades',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            Dofer <span className="text-blue-600">Labs</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">Maker Hub</h1>
            <p className="text-gray-600">
              Elige una herramienta y comienza a trabajar
            </p>
          </div>

          {/* Tools Grid */}
          <div className="space-y-12">
            {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {categoryNames[category] || category}
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.path}
                      className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 space-y-3 border border-gray-200 hover:border-blue-300"
                    >
                      {/* Icon & Status */}
                      <div className="flex items-start justify-between">
                        <div className="text-4xl">{tool.icon || '🔨'}</div>
                        <div className="flex gap-2">
                          {tool.status === 'beta' && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                              Beta
                            </span>
                          )}
                          {tool.tier === 'pro' && (
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              Pro
                            </span>
                          )}
                          {tool.status === 'stable' && tool.tier === 'free' && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              Gratis
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="pt-2">
                        <span className="text-blue-600 text-sm font-medium group-hover:underline">
                          Usar herramienta →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {tools.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No hay herramientas disponibles aún. ¡Pronto agregaremos más!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            ¿Tienes una idea para una herramienta?{' '}
            <a href="mailto:hola@dofer.com.mx" className="underline hover:text-gray-900">
              Cuéntanos
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
