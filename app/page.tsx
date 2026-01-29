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
      <main className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-4">
            {/* Logo/Brand */}
            <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                Dofer Labs
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Herramientas gratuitas y prácticas para makers
              </p>
            </div>

            {/* Value Props */}
            <div className="grid md:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
              <div className="group p-4 rounded-xl bg-white/50 backdrop-blur border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-bold text-base mb-1 text-gray-900">Directo al punto</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Sin registros, sin ventas. Solo herramientas que funcionan.
                </p>
              </div>

              <div className="group p-4 rounded-xl bg-white/50 backdrop-blur border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-3xl mb-2">🆓</div>
                <h3 className="font-bold text-base mb-1 text-gray-900">Gratis siempre</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Herramientas útiles sin costo. Porque los makers merecen acceso.
                </p>
              </div>

              <div className="group p-4 rounded-xl bg-white/50 backdrop-blur border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-bold text-base mb-1 text-gray-900">Rápido y simple</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Resultados inmediatos. Sin complicaciones ni curvas de aprendizaje.
                </p>
              </div>
            </div>
          </div>

          {/* Herramientas Disponibles */}
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-3xl font-bold text-gray-900">
                Herramientas Disponibles
              </h2>
              <p className="text-sm text-gray-600">
                Elige una herramienta y comienza a trabajar
              </p>
            </div>

            {/* Tools Grid por Categoría */}
            <div className="space-y-8">
              {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    {categoryNames[category] || category}
                  </h3>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryTools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={tool.path}
                        className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all p-5 space-y-3 border border-gray-200 hover:border-blue-400"
                      >
                        {/* Icon & Status */}
                        <div className="flex items-start justify-between">
                          <div className="text-3xl">
                            {tool.icon || '🔨'}
                          </div>
                          <div className="flex gap-2">
                            {tool.status === 'beta' && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                                Beta
                              </span>
                            )}
                            {tool.tier === 'pro' && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                Pro
                              </span>
                            )}
                            {tool.status === 'stable' && tool.tier === 'free' && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                Gratis
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors">
                            {tool.name}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {tool.description}
                          </p>
                        </div>

                        {/* CTA */}
                        <div className="pt-1 flex items-center gap-1">
                          <span className="text-blue-600 text-sm font-medium">
                            Usar herramienta →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Próximamente Section */}
            <div className="space-y-3 pt-4">
              <h3 className="text-xl font-bold text-gray-900">
                🚀 Próximamente
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm p-5 space-y-2 border-2 border-dashed border-gray-300 relative">
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      Próximamente
                    </span>
                  </div>
                  <div className="text-3xl opacity-60">🔑</div>
                  <div>
                    <h4 className="font-semibold text-base text-gray-700">
                      Imagen a Llavero
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Convierte tu imagen o logo en un llavero 3D personalizado
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm p-5 space-y-2 border-2 border-dashed border-gray-300 relative">
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      Próximamente
                    </span>
                  </div>
                  <div className="text-3xl opacity-60">🖼️</div>
                  <div>
                    <h4 className="font-semibold text-base text-gray-700">
                      Imagen a Modelo 3D
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Transforma imágenes en modelos 3D con relieve
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-sm p-5 space-y-2 border-2 border-dashed border-gray-300 relative">
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      Próximamente
                    </span>
                  </div>
                  <div className="text-3xl opacity-60">🍪</div>
                  <div>
                    <h4 className="font-semibold text-base text-gray-700">
                      Generador de Cortadores de Galletas
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Crea cortadores personalizados desde tu imagen
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter/Notify Section */}
            <div className="pt-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-200">
                <div className="max-w-xl mx-auto text-center space-y-3">
                  <div className="text-2xl">🔔</div>
                  <h3 className="text-xl font-bold text-gray-900">
                    ¿Quieres estar al día?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Déjanos tu correo o WhatsApp y te avisaremos cuando agreguemos nuevas herramientas
                  </p>
                  
                  <form className="flex flex-col sm:flex-row gap-2 mt-4">
                    <input
                      type="text"
                      placeholder="correo@ejemplo.com o 55-1234-5678"
                      className="flex-1 px-3 py-2 text-sm rounded-md border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      required
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-md hover:shadow-lg transition-all"
                    >
                      Notificarme
                    </button>
                  </form>
                  
                  <p className="text-[10px] text-gray-500 mt-2">
                    🔒 No spam. Solo actualizaciones importantes.
                  </p>
                </div>
              </div>
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
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-4 px-6 py-2 bg-white/60 backdrop-blur rounded-full border border-gray-200 shadow-sm">
              <span className="text-xs font-medium text-gray-700">Sin bloqueos</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-medium text-gray-700">Sin paywalls</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-medium text-gray-700">Sin spam</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-600">
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
