'use client'

import { Suspense } from 'react'
import { usePageTracking } from '@/lib/analytics/hooks'

/**
 * Componente interno que usa useSearchParams
 */
function AnalyticsTracker() {
  usePageTracking()
  return null
}

/**
 * Proveedor de Analytics que inicializa tracking automático
 * Se debe usar en el layout principal para tracking de pageviews
 */
export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  )
}
