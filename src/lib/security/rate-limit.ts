/**
 * Rate Limiter simple basado en memoria
 * Para producción considerar Redis o Upstash
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Limpiar entradas antiguas cada 1 minuto
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetAt < now) {
        this.requests.delete(key)
      }
    }
  }

  /**
   * Verifica si una IP/identificador ha excedido el límite
   * @param identifier - Identificador único (IP, userId, etc)
   * @param limit - Número máximo de requests
   * @param windowMs - Ventana de tiempo en milisegundos
   * @returns true si está permitido, false si está rate limited
   */
  check(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    if (!entry || entry.resetAt < now) {
      // Primera request o ventana expirada
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      })
      return true
    }

    if (entry.count >= limit) {
      // Límite excedido
      return false
    }

    // Incrementar contador
    entry.count++
    return true
  }

  /**
   * Obtiene información sobre el límite para un identificador
   */
  getInfo(identifier: string): { remaining: number; resetAt: number; limit: number } | null {
    const entry = this.requests.get(identifier)
    if (!entry) {
      return null
    }

    return {
      remaining: Math.max(0, 10 - entry.count), // Asumiendo limit default de 10
      resetAt: entry.resetAt,
      limit: 10,
    }
  }

  /**
   * Resetea el límite para un identificador
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  /**
   * Destruir el limiter (limpiar interval)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.requests.clear()
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

// Configuraciones predefinidas
export const RATE_LIMITS = {
  // APIs públicas generales
  api: {
    limit: 100, // 100 requests
    window: 15 * 60 * 1000, // 15 minutos
  },
  // Suscripciones (más restrictivo)
  subscription: {
    limit: 5, // 5 intentos
    window: 15 * 60 * 1000, // 15 minutos
  },
  // Eventos de analytics (más permisivo)
  events: {
    limit: 200, // 200 eventos
    window: 15 * 60 * 1000, // 15 minutos
  },
  // Subida de archivos (muy restrictivo)
  upload: {
    limit: 10, // 10 archivos
    window: 60 * 60 * 1000, // 1 hora
  },
}

/**
 * Helper para obtener el identificador de rate limit desde la request
 */
export function getRateLimitIdentifier(request: Request): string {
  // Obtener IP del usuario
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return `rate-limit:${ip}`
}

/**
 * Middleware helper para rate limiting
 */
export function checkRateLimit(
  request: Request,
  config: { limit: number; window: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const identifier = getRateLimitIdentifier(request)
  const allowed = rateLimiter.check(identifier, config.limit, config.window)
  
  const info = rateLimiter.getInfo(identifier)
  
  return {
    allowed,
    remaining: info?.remaining ?? config.limit,
    resetAt: info?.resetAt ?? Date.now() + config.window,
  }
}
