import Link from 'next/link'

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-4">Política de Privacidad</h1>
        <p className="text-gray-600 mb-8">Última actualización: Enero 2026</p>

        <div className="space-y-6 text-gray-800">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Resumen Simple</h2>
            <p>
              Dofer Labs NO recopila información personal sin tu consentimiento.
              No vendemos datos. No compartimos información con terceros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Qué datos NO recopilamos (por defecto)</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>No pedimos registro obligatorio</li>
              <li>No rastreamos tu identidad</li>
              <li>No usamos cookies invasivas</li>
              <li>No recopilamos información personal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Qué datos SÍ recopilamos (si decides compartir)</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Email o WhatsApp (solo si usas "soft opt-in")</li>
              <li>Uso anónimo de herramientas (qué herramienta, cuándo)</li>
              <li>Errores técnicos (para mejorar la plataforma)</li>
            </ul>
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
