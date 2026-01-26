import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitiza input de texto para prevenir XSS
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // No HTML, solo texto
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitiza HTML permitiendo tags seguros
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  })
}

/**
 * Sanitiza número, forzando a número válido
 */
export function sanitizeNumber(value: unknown, defaultValue = 0): number {
  const num = Number(value)
  return isNaN(num) || !isFinite(num) ? defaultValue : num
}

/**
 * Sanitiza objeto removiendo propiedades peligrosas
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  // Remover propiedades proto pollution
  delete (sanitized as any).__proto__
  delete (sanitized as any).constructor
  delete (sanitized as any).prototype
  return sanitized
}
