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

            {/* Próximamente Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                🚀 Próximamente
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tool 1 */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md p-6 space-y-3 border-2 border-dashed border-gray-300 relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                      Próximamente
                    </span>
                  </div>
                  <div className="text-4xl opacity-60">�</div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-700">
                      Imagen a Llavero
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Convierte tu imagen o logo en un llavero 3D personalizado listo para imprimir
                    </p>
                  </div>
                </div>

                {/* Tool 2 */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md p-6 space-y-3 border-2 border-dashed border-gray-300 relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                      Próximamente
                    </span>
                  </div>
                  <div className="text-4xl opacity-60">🖼️</div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-700">
                      Imagen a Modelo 3D
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Transforma cualquier imagen en un modelo 3D con relieve para decoración o señalización
                    </p>
                  </div>
                </div>

                {/* Tool 3 */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md p-6 space-y-3 border-2 border-dashed border-gray-300 relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                      Próximamente
                    </span>
                  </div>
                  <div className="text-4xl opacity-60">🍪</div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-700">
                      Generador de Cortadores de Galletas
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Crea cortadores de galletas personalizados a partir de tu imagen o diseño
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter/Notify Section */}
            <div className="mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border border-blue-200">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                  <div className="text-4xl">🔔</div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    ¿Quieres estar al día?
                  </h3>
                  <p className="text-gray-600">
                    Déjanos tu correo o WhatsApp y te avisaremos cuando agreguemos nuevas herramientas
                  </p>
                  
                  <form className="flex flex-col sm:flex-row gap-3 mt-6 max-w-xl mx-auto">
                    <input
                      type="text"
                      placeholder="correo@ejemplo.com o 55-1234-5678"
                      className="flex-1 px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      Notificarme
                    </button>
                  </form>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    🔒 No spam. Solo actualizaciones importantes.
                  </p>
                </div>
              </div>
            </div>
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
