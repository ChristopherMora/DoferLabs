'use client'

import { useState } from 'react'
import { useConversionTracking } from '@/lib/analytics/hooks'

interface SubscribeFormProps {
  source?: string
}

export default function SubscribeForm({ source = 'homepage' }: SubscribeFormProps) {
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const { trackSubscriptionStart, trackSubscriptionComplete, trackSubscriptionError } = useConversionTracking()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contact.trim()) {
      setMessage({ type: 'error', text: 'Por favor ingresa tu correo o WhatsApp' })
      return
    }

    // Track inicio de suscripción
    trackSubscriptionStart()

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact: contact.trim(), source }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setContact('') // Limpiar el input
        // Track suscripción exitosa
        trackSubscriptionComplete(contact, data.type)
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al suscribirte' })
        // Track error
        trackSubscriptionError(data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage({ type: 'error', text: 'Error de conexión. Intenta de nuevo.' })
      trackSubscriptionError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="correo@ejemplo.com o 55-1234-5678"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-md border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Notificarme'}
        </button>
      </form>
      
      {message && (
        <div
          className={`text-sm p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? '✅ ' : '⚠️ '}
          {message.text}
        </div>
      )}
      
      <p className="text-[10px] text-gray-500">
        🔒 No spam. Solo actualizaciones importantes.
      </p>
    </div>
  )
}
