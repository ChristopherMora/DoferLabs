import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-gray-900">
              Dofer <span className="text-blue-600">Labs</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas gratuitas y prácticas para makers
            </p>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="space-y-2">
              <div className="text-4xl">🎯</div>
              <h3 className="font-semibold text-lg">Directo al punto</h3>
              <p className="text-gray-600 text-sm">
                Sin registros, sin ventas. Solo herramientas que funcionan.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-4xl">🆓</div>
              <h3 className="font-semibold text-lg">Gratis siempre</h3>
              <p className="text-gray-600 text-sm">
                Herramientas útiles sin costo. Porque los makers merecen acceso.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-4xl">⚡</div>
              <h3 className="font-semibold text-lg">Rápido y simple</h3>
              <p className="text-gray-600 text-sm">
                Resultados inmediatos. Sin complicaciones ni curvas de aprendizaje.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12">
            <Link
              href="/hub"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Explorar Herramientas →
            </Link>
          </div>

          {/* Secondary Info */}
          <p className="text-sm text-gray-500 mt-8">
            Sin bloqueos. Sin paywalls. Sin spam.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            Hecho con ❤️ para la comunidad maker. <br />
            <Link href="/legal/privacy" className="underline hover:text-gray-900">
              Privacidad
            </Link>
            {' · '}
            <Link href="/legal/terms" className="underline hover:text-gray-900">
              Términos
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
