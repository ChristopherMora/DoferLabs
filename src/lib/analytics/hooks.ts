'use client'

import { useEffect } from 'react'
import { tracker } from './tracker'

/**
 * Hook para trackear cuando una herramienta se abre
 */
export function useTrackToolOpened(toolId: string, metadata?: Record<string, unknown>) {
  useEffect(() => {
    tracker.toolOpened(toolId, metadata)
  }, [toolId, metadata])
}

/**
 * Hook para trackear pageviews
 */
export function useTrackPageView(pageName: string) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('pageview', { page: pageName })
    }
  }, [pageName])
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
