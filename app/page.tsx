import Link from 'next/link'
import { registerAllTools, getAvailableTools } from '@/tools'
import SubscribeForm from './components/SubscribeForm'

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
                Dofer Labs, MakerHub
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

            {/* Community Section */}
            <div className="pt-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border border-purple-200">
                <div className="max-w-xl mx-auto text-center space-y-4">
                  <div className="text-3xl">🚀</div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Únete a la Comunidad Dofer Labs, MakerHub
                  </h3>
                  <p className="text-sm text-gray-600">
                    Comparte tus proyectos, aprende de otros makers y mantente al día con las últimas herramientas
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <a
                      href="https://www.facebook.com/groups/1397007015312714"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Grupo Facebook
                    </a>
                    
                    <a
                      href="https://chat.whatsapp.com/E7lc7UDWWBpGu4ayMFVS7W"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      Grupo WhatsApp
                    </a>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-3">
                    💬 Comparte ideas, resuelve dudas y conecta con makers como tú
                  </p>
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
                  
                  <SubscribeForm source="homepage" />
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
            <Link href="/comunidad" className="underline hover:text-purple-600 transition-colors font-medium">
              Comunidad
            </Link>
            <span>·</span>
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
