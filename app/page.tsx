import Link from 'next/link'
import { registerAllTools, getAvailableTools } from '@/tools'

// Registrar herramientas al inicio
registerAllTools()

// Configuración de caché (ISR - revalidate cada hora)
export const revalidate = 3600

export default function Home() {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <main className="flex-1 px-4 py-20">
        <div className="max-w-7xl mx-auto space-y-20">
          {/* Header */}
          <div className="text-center space-y-8">
            {/* Logo/Brand */}
            <div className="space-y-6 animate-in fade-in duration-700">
              <h1 className="text-7xl md:text-8xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                Dofer Labs
              </h1>
              <p className="text-2xl text-gray-700 max-w-3xl mx-auto font-light">
                Herramientas gratuitas y prácticas para makers
              </p>
            </div>

            {/* Value Props */}
            <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
              <div className="group p-6 rounded-2xl bg-white/50 backdrop-blur border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🎯</div>
                <h3 className="font-bold text-xl mb-2 text-gray-900">Directo al punto</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Sin registros, sin ventas. Solo herramientas que funcionan.
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-white/50 backdrop-blur border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">🆓</div>
                <h3 className="font-bold text-xl mb-2 text-gray-900">Gratis siempre</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Herramientas útiles sin costo. Porque los makers merecen acceso.
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-white/50 backdrop-blur border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
                <h3 className="font-bold text-xl mb-2 text-gray-900">Rápido y simple</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Resultados inmediatos. Sin complicaciones ni curvas de aprendizaje.
                </p>
              </div>
            </div>
          </div>

          {/* Herramientas Disponibles */}
          <div className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Herramientas Disponibles
              </h2>
              <p className="text-lg text-gray-600">
                Elige una herramienta y comienza a trabajar
              </p>
            </div>

            {/* Tools Grid por Categoría */}
            <div className="space-y-16">
              {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                <div key={category} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-bold text-gray-900">
                      {categoryNames[category] || category}
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryTools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={tool.path}
                        className="group relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 p-8 space-y-4 border border-gray-200 hover:border-blue-400 overflow-hidden hover:-translate-y-2"
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-100/0 group-hover:from-blue-50/50 group-hover:to-purple-50/30 transition-all duration-300 pointer-events-none"></div>
                        
                        {/* Icon & Status */}
                        <div className="relative flex items-start justify-between">
                          <div className="text-5xl transform group-hover:scale-110 transition-transform duration-300">
                            {tool.icon || '🔨'}
                          </div>
                          <div className="flex gap-2">
                            {tool.status === 'beta' && (
                              <span className="text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full border border-yellow-300">
                                Beta
                              </span>
                            )}
                            {tool.tier === 'pro' && (
                              <span className="text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-full border border-purple-300">
                                Pro
                              </span>
                            )}
                            {tool.status === 'stable' && tool.tier === 'free' && (
                              <span className="text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 rounded-full border border-green-300">
                                Gratis
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="relative space-y-2">
                          <h4 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                            {tool.name}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                            {tool.description}
                          </p>
                        </div>

                        {/* CTA */}
                        <div className="relative pt-3 flex items-center gap-2">
                          <span className="text-blue-600 font-semibold group-hover:gap-3 transition-all">
                            Usar herramienta
                          </span>
                          <span className="text-blue-600 transform group-hover:translate-x-2 transition-transform duration-300">
                            →
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
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔧</div>
                <p className="text-xl text-gray-600 font-medium">
                  No hay herramientas disponibles aún. ¡Pronto agregaremos más!
                </p>
              </div>
            )}
          </div>

          {/* Secondary Info */}
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/60 backdrop-blur rounded-full border border-gray-200 shadow-sm">
              <span className="text-sm font-medium text-gray-700">Sin bloqueos</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm font-medium text-gray-700">Sin paywalls</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm font-medium text-gray-700">Sin spam</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-200 bg-white/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p className="space-x-2">
            <span>Hecho con ❤️ para la comunidad maker.</span>
            <span className="hidden md:inline">·</span>
            <br className="md:hidden" />
            <Link href="/legal/privacy" className="underline hover:text-blue-600 transition-colors font-medium">
              Privacidad
            </Link>
            <span>·</span>
            <Link href="/legal/terms" className="underline hover:text-blue-600 transition-colors font-medium">
              Términos
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
