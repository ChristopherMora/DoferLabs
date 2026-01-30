'use client'

import { usePageTracking } from '@/lib/analytics/hooks'

/**
 * Proveedor de Analytics que inicializa tracking automático
 * Se debe usar en el layout principal para tracking de pageviews
 */
export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Hook que trackea automáticamente cambios de página
  usePageTracking()

  return <>{children}</>
}
