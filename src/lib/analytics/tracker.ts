'use client'

import { features } from '../features/flags'
import type { ToolEvent } from '@/tools/types'

/**
 * Event Tracker - Sistema centralizado de eventos
 * Maneja analytics sin PII en MVP
 */
class EventTracker {
  private sessionId: string

  constructor() {
    // Generar session ID anónimo (fingerprint simple)
    this.sessionId = this.generateSessionId()
  }

  /**
   * Genera un session ID único para tracking anónimo
   */
  private generateSessionId(): string {
    // En navegador, usar localStorage para persistir session
    if (typeof window === 'undefined') return 'server'
    
    const stored = localStorage.getItem('dofer_session_id')
    if (stored) return stored

    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
    localStorage.setItem('dofer_session_id', newId)
    return newId
  }

  /**
   * Track genérico de evento
   */
  track(event: Partial<ToolEvent>) {
    if (!features.analytics) return

    const fullEvent: ToolEvent = {
      toolId: event.toolId || 'unknown',
      eventType: event.eventType || 'opened',
      metadata: event.metadata,
      timestamp: new Date(),
    }

    // En MVP: console log (luego enviar a backend o servicio externo)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', fullEvent)
    }

    // TODO: Enviar a backend /api/events o servicio externo
    this.sendToBackend(fullEvent)
  }

  /**
   * Envía evento al backend
   */
  private async sendToBackend(event: ToolEvent) {
    try {
      // Enviar al backend de forma asíncrona
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: event.eventType,
          toolId: event.toolId,
          sessionId: this.sessionId,
          metadata: event.metadata,
        }),
        keepalive: true, // Permite que la petición continúe aunque se cierre la página
      }).catch(error => {
        // Silently fail - no romper UX por analytics
        if (process.env.NODE_ENV === 'development') {
          console.error('Analytics error:', error)
        }
      })
    } catch (error) {
      // Silently fail - no romper UX por analytics
      if (process.env.NODE_ENV === 'development') {
        console.error('Analytics error:', error)
      }
    }
  }

  // ============================================
  // Métodos de conveniencia para eventos comunes
  // ============================================

  toolOpened(toolId: string, metadata?: Record<string, unknown>) {
    this.track({
      toolId,
      eventType: 'opened',
      metadata,
    })
  }

  toolExecuted(toolId: string, metadata?: Record<string, unknown>) {
    this.track({
      toolId,
      eventType: 'executed',
      metadata,
    })
  }

  resultViewed(toolId: string, metadata?: Record<string, unknown>) {
    this.track({
      toolId,
      eventType: 'result_viewed',
      metadata,
    })
  }

  resultExported(toolId: string, format: string) {
    this.track({
      toolId,
      eventType: 'exported',
      metadata: { format },
    })
  }

  resultSaved(toolId: string) {
    this.track({
      toolId,
      eventType: 'saved',
    })
  }

  error(toolId: string, error: Error) {
    this.track({
      toolId,
      eventType: 'error',
      metadata: {
        message: error.message,
        stack: error.stack,
      },
    })
  }

  pageView(path: string, metadata?: Record<string, unknown>) {
    this.track({
      eventType: 'page_view',
      metadata: { path, ...metadata },
    })
  }
}

// Singleton del tracker
export const tracker = new EventTracker()

// Export de métodos individuales para conveniencia
export const trackToolOpened = tracker.toolOpened.bind(tracker)
export const trackToolExecuted = tracker.toolExecuted.bind(tracker)
export const trackResultViewed = tracker.resultViewed.bind(tracker)
export const trackResultExported = tracker.resultExported.bind(tracker)
export const trackResultSaved = tracker.resultSaved.bind(tracker)
export const trackError = tracker.error.bind(tracker)
