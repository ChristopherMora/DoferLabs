import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comunidad MakerHUB | Únete a nosotros',
  description: 'Únete a la comunidad MakerHUB by Dofer. Comparte proyectos, aprende y conecta con makers de todo el mundo.',
}

export default function ComunidadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 via-pink-50 to-white">
      {/* Header con navegación */}
      <header className="py-6 px-4 border-b border-purple-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            MakerHUB by Dofer
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors"
          >
            ← Volver a herramientas
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4 animate-bounce">🚀</div>
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Bienvenido a la Comunidad MakerHUB
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Un espacio donde los makers se conectan, comparten y crecen juntos
            </p>
          </div>

          {/* Nuestra Misión */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 space-y-4 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">💡</div>
              <h2 className="text-3xl font-bold text-gray-900">Nuestra Misión</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p>
                En <strong>MakerHUB by Dofer</strong>, creemos que el conocimiento debe ser libre y accesible para todos. 
                Nuestra misión es construir una comunidad vibrante donde makers de todos los niveles puedan:
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-xl">•</span>
                  <span><strong>Compartir sus proyectos</strong> e inspirar a otros con sus creaciones</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-xl">•</span>
                  <span><strong>Aprender de la experiencia</strong> de makers más experimentados</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-xl">•</span>
                  <span><strong>Resolver problemas juntos</strong> y encontrar soluciones innovadoras</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold text-xl">•</span>
                  <span><strong>Acceder a herramientas gratuitas</strong> que faciliten su trabajo</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Por qué es importante para nosotros */}
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-lg p-8 md:p-10 space-y-4 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">❤️</div>
              <h2 className="text-3xl font-bold text-gray-900">¿Por qué nos importa tanto?</h2>
            </div>
            <div className="space-y-4 text-gray-800 leading-relaxed">
              <p className="text-lg">
                La cultura maker se trata de <strong>colaboración, no de competencia</strong>. Hemos vivido en carne propia 
                lo frustrante que puede ser encontrar información dispersa, herramientas de pago excesivo, o simplemente 
                no tener a quién preguntar cuando algo sale mal.
              </p>
              <p className="text-lg">
                Por eso creamos este espacio: <strong>para devolver a la comunidad</strong> todo lo que nos ha dado. 
                Cada herramienta que desarrollamos, cada recurso que compartimos, y cada miembro que se une, 
                nos acerca más a ese ideal de un ecosistema maker verdaderamente colaborativo.
              </p>
              <blockquote className="border-l-4 border-purple-600 pl-4 italic text-lg mt-6 bg-white/50 p-4 rounded-r-lg">
                "Solos llegamos más rápido, pero juntos llegamos más lejos. Y nosotros queremos llegar muy, muy lejos."
              </blockquote>
            </div>
          </div>

          {/* Qué encontrarás */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 space-y-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🎁</div>
              <h2 className="text-3xl font-bold text-gray-900">¿Qué encontrarás en la comunidad?</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl">💬</div>
                <h3 className="font-bold text-lg text-gray-900">Ayuda y Soporte</h3>
                <p className="text-gray-700 text-sm">
                  Resuelve dudas sobre impresión 3D, diseño, materiales y más con makers experimentados
                </p>
              </div>
              
              <div className="space-y-2 p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl">🖼️</div>
                <h3 className="font-bold text-lg text-gray-900">Galería de Proyectos</h3>
                <p className="text-gray-700 text-sm">
                  Comparte tus creaciones y descubre proyectos increíbles de otros makers
                </p>
              </div>
              
              <div className="space-y-2 p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl">🔧</div>
                <h3 className="font-bold text-lg text-gray-900">Tips y Trucos</h3>
                <p className="text-gray-700 text-sm">
                  Aprende técnicas avanzadas, optimizaciones y soluciones a problemas comunes
                </p>
              </div>
              
              <div className="space-y-2 p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl">🎉</div>
                <h3 className="font-bold text-lg text-gray-900">Eventos y Retos</h3>
                <p className="text-gray-700 text-sm">
                  Participa en desafíos creativos y eventos exclusivos para la comunidad
                </p>
              </div>

              <div className="space-y-2 p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl">🛒</div>
                <h3 className="font-bold text-lg text-gray-900">Recomendaciones</h3>
                <p className="text-gray-700 text-sm">
                  Descubre qué herramientas, materiales y equipos recomiendan otros makers
                </p>
              </div>
              
              <div className="space-y-2 p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl">🚀</div>
                <h3 className="font-bold text-lg text-gray-900">Acceso Anticipado</h3>
                <p className="text-gray-700 text-sm">
                  Sé el primero en probar nuevas herramientas y características antes que nadie
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action - Enlaces principales */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 md:p-12 text-white text-center space-y-6">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-3xl md:text-4xl font-bold">
              ¿Listo para unirte?
            </h2>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto">
              Únete a cientos de makers que ya forman parte de nuestra comunidad. 
              Elige tu plataforma favorita y comienza a conectar hoy mismo.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a
                href="https://www.facebook.com/groups/1397007015312714"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Únete en Facebook
              </a>
              
              <a
                href="https://chat.whatsapp.com/E7lc7UDWWBpGu4ayMFVS7W"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-green-600 hover:bg-green-50 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Únete en WhatsApp
              </a>
            </div>

            <p className="text-sm text-purple-200 mt-6">
              🌟 Completamente gratis • Sin spam • 100% makers
            </p>
          </div>

          {/* Testimonios imaginarios */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Lo que dicen nuestros makers</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                    A
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Ana M.</div>
                    <div className="text-xs text-gray-500">Maker desde 2023</div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic">
                  "Esta comunidad me ayudó a resolver problemas de calibración que llevaba meses intentando solucionar. ¡Increíble el apoyo!"
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-xl">
                    C
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Carlos R.</div>
                    <div className="text-xs text-gray-500">Maker desde 2021</div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic">
                  "Las herramientas gratuitas son un salvavidas. Y la comunidad es súper activa y dispuesta a ayudar."
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center text-white font-bold text-xl">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">María L.</div>
                    <div className="text-xs text-gray-500">Maker desde 2024</div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic">
                  "Empecé hace poco y aquí encontré todo lo que necesitaba para dar mis primeros pasos. ¡100% recomendado!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-purple-200 bg-white/80 backdrop-blur mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-600">
          <p className="space-x-2">
            <Link href="/" className="underline hover:text-purple-600 transition-colors font-medium">
              Inicio
            </Link>
            <span>·</span>
            <Link href="/legal/privacy" className="underline hover:text-purple-600 transition-colors font-medium">
              Privacidad
            </Link>
            <span>·</span>
            <Link href="/legal/terms" className="underline hover:text-purple-600 transition-colors font-medium">
              Términos
            </Link>
          </p>
          <p className="mt-2 text-gray-500">
            Hecho con ❤️ para la comunidad maker
          </p>
        </div>
      </footer>
    </div>
  )
}
