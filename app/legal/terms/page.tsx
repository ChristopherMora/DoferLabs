import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
            Dofer <span className="text-blue-600">Labs</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Términos de Uso</h1>
        <p className="text-gray-600 mb-8">Última actualización: Enero 2026</p>

        <div className="space-y-6 text-gray-800">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Resumen</h2>
            <p>
              Usa Dofer Labs libremente. No vendemos nada. No hay compromisos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Lo que puedes hacer</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Usar todas las herramientas gratuitas</li>
              <li>Compartir resultados</li>
              <li>Sugerir mejoras</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Lo que NO debes hacer</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Abusar del servicio (rate limiting activo)</li>
              <li>Intentar romper la plataforma</li>
              <li>Usar para spam o actividades ilegales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Limitación de responsabilidad</h2>
            <p>
              Las herramientas se proveen "as-is". Los resultados son estimaciones.
              Verifica siempre tus cálculos para uso profesional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contacto</h2>
            <p>
              Dudas: <a href="mailto:hola@dofer.com.mx" className="text-blue-600 underline">hola@dofer.com.mx</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
