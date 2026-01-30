/**
 * Protección CSRF (Cross-Site Request Forgery)
 * Para formularios y peticiones mutantes
 */

import { NextRequest } from 'next/server'

/**
 * Genera un token CSRF único
 */
export function generateCsrfToken(): string {
  // Generar token aleatorio
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else if (typeof global !== 'undefined' && global.crypto) {
    global.crypto.getRandomValues(array)
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Guarda el token CSRF en localStorage (client-side)
 */
export function storeCsrfToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('csrf_token', token)
  }
}

/**
 * Obtiene el token CSRF de localStorage (client-side)
 */
export function getCsrfToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('csrf_token')
  }
  return null
}

/**
 * Valida el token CSRF en el servidor
 */
export function validateCsrfToken(request: NextRequest, expectedToken: string): boolean {
  // Obtener token del header o body
  const tokenFromHeader = request.headers.get('x-csrf-token')
  const tokenFromCookie = request.cookies.get('csrf_token')?.value
  
  const providedToken = tokenFromHeader || tokenFromCookie
  
  if (!providedToken || !expectedToken) {
    return false
  }
  
  // Comparación segura (timing-safe)
  return timingSafeEqual(providedToken, expectedToken)
}

/**
 * Comparación timing-safe de strings
 * Previene timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Middleware helper para verificar CSRF
 * Usar en APIs que mutan datos (POST, PUT, DELETE)
 */
export function checkCsrfProtection(request: NextRequest): { valid: boolean; error?: string } {
  // Solo verificar en métodos que mutan datos
  const method = request.method.toUpperCase()
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { valid: true }
  }
  
  // En desarrollo, podemos ser más permisivos
  if (process.env.NODE_ENV === 'development') {
    return { valid: true }
  }
  
  // Verificar origen del request
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  if (!origin || !host) {
    return { 
      valid: false, 
      error: 'Missing origin or host header' 
    }
  }
  
  // Verificar que el origen coincida con el host
  const originHost = new URL(origin).host
  if (originHost !== host) {
    return { 
      valid: false, 
      error: 'Origin mismatch' 
    }
  }
  
  return { valid: true }
}

/**
 * Helper para agregar token CSRF a headers de fetch
 */
export function getCsrfHeaders(): Record<string, string> {
  const token = getCsrfToken()
  if (token) {
    return {
      'X-CSRF-Token': token,
    }
  }
  return {}
}
