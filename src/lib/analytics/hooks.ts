'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { tracker } from './tracker'
import type { ToolEvent } from '@/tools/types'

/**
 * Hook para tracking automático de pageviews
 * Se debe usar en el layout principal
 */
export function usePageTracking() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const previousPath = useRef<string>('')

  useEffect(() => {
    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    // Evitar duplicados en el primer render
    if (previousPath.current === currentPath) return
    
    previousPath.current = currentPath

    // Track page view
    tracker.track({
      toolId: pathname,
      eventType: 'page_view',
      metadata: {
        path: currentPath,
        referrer: document.referrer || 'direct',
      },
    })
  }, [pathname, searchParams])
}

/**
 * Hook para trackear cuando una herramienta se abre
 */
export function useTrackToolOpened(toolId: string, metadata?: Record<string, unknown>) {
  useEffect(() => {
    tracker.toolOpened(toolId, metadata)
  }, [toolId, metadata])
}

/**
 * Hook para tracking de herramientas
 * Proporciona funciones helpers para eventos comunes
 */
export function useToolTracking(toolId: string) {
  // Track que se abrió la herramienta
  useEffect(() => {
    tracker.toolOpened(toolId)
  }, [toolId])

  return {
    // Track ejecución de la herramienta
    trackExecution: (metadata?: Record<string, unknown>) => {
      tracker.toolExecuted(toolId, metadata)
    },

    // Track resultado visto
    trackResult: (metadata?: Record<string, unknown>) => {
      tracker.resultViewed(toolId, metadata)
    },

    // Track exportación
    trackExport: (format: string) => {
      tracker.resultExported(toolId, format)
    },

    // Track guardado
    trackSave: () => {
      tracker.resultSaved(toolId)
    },

    // Track error
    trackError: (error: Error) => {
      tracker.error(toolId, error)
    },

    // Track evento personalizado
    trackCustom: (eventType: ToolEvent['eventType'], metadata?: Record<string, unknown>) => {
      tracker.track({
        toolId,
        eventType,
        metadata,
      })
    },
  }
}

/**
 * Hook para tracking de conversiones y eventos especiales
 */
export function useConversionTracking() {
  return {
    // Track inicio de suscripción
    trackSubscriptionStart: () => {
      tracker.track({
        toolId: 'subscription',
        eventType: 'opened',
      })
    },

    // Track suscripción completada
    trackSubscriptionComplete: (contact: string, type: 'email' | 'whatsapp') => {
      tracker.track({
        toolId: 'subscription',
        eventType: 'executed',
        metadata: { type, contactLength: contact.length },
      })
    },

    // Track error en suscripción
    trackSubscriptionError: (error: string) => {
      tracker.track({
        toolId: 'subscription',
        eventType: 'error',
        metadata: { error },
      })
    },

    // Track clicks en comunidad
    trackCommunityClick: (platform: 'facebook' | 'whatsapp') => {
      tracker.track({
        toolId: 'community',
        eventType: 'opened',
        metadata: { platform },
      })
    },

    // Track botón flotante de comunidad
    trackFloatingButtonClick: () => {
      tracker.track({
        toolId: 'community',
        eventType: 'opened',
      })
    },
  }
}

/**
 * Hook genérico para trackear eventos
 */
export function useTrackEvent() {
  return {
    toolOpened: tracker.toolOpened.bind(tracker),
    toolExecuted: tracker.toolExecuted.bind(tracker),
    resultViewed: tracker.resultViewed.bind(tracker),
    resultExported: tracker.resultExported.bind(tracker),
    resultSaved: tracker.resultSaved.bind(tracker),
    error: tracker.error.bind(tracker),
  }
}

/**
 * Hook para tracking de formularios
 */
export function useFormTracking(formId: string) {
  const startTimeRef = useRef<number>(0)

  return {
    // Track inicio del formulario
    trackStart: () => {
      startTimeRef.current = Date.now()
      tracker.track({
        toolId: formId,
        eventType: 'opened',
      })
    },

    // Track completado
    trackComplete: (values?: Record<string, unknown>) => {
      const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0
      tracker.track({
        toolId: formId,
        eventType: 'executed',
        metadata: {
          duration,
          fieldsCount: values ? Object.keys(values).length : 0,
        },
      })
    },

    // Track abandonado
    trackAbandon: (lastField?: string) => {
      const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0
      tracker.track({
        toolId: formId,
        eventType: 'error',
        metadata: { duration, lastField },
      })
    },
  }
}

