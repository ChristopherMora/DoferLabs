/**
 * Sistema de identificación de sesiones anónimas
 * Genera un fingerprint único por dispositivo/navegador
 */

// Generar un ID único basado en características del navegador
function generateFingerprint(): string {
  if (typeof window === 'undefined') return 'server'

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
  ]

  const fingerprint = components.join('|')
  return simpleHash(fingerprint)
}

// Hash simple para el fingerprint
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// Generar un ID de sesión único
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

const SESSION_KEY = 'doferlabs_session_id'
const SESSION_TIMESTAMP_KEY = 'doferlabs_session_timestamp'
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutos

/**
 * Obtiene o crea un session ID
 * La sesión expira después de 30 minutos de inactividad
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'

  try {
    const now = Date.now()
    const storedSessionId = localStorage.getItem(SESSION_KEY)
    const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY)

    // Si existe una sesión y no ha expirado, actualizarla y devolverla
    if (storedSessionId && timestamp) {
      const lastActivity = parseInt(timestamp, 10)
      if (now - lastActivity < SESSION_TIMEOUT) {
        localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString())
        return storedSessionId
      }
    }

    // Crear nueva sesión
    const fingerprint = generateFingerprint()
    const sessionId = `${fingerprint}-${generateSessionId()}`
    localStorage.setItem(SESSION_KEY, sessionId)
    localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString())

    return sessionId
  } catch (error) {
    // Fallback si localStorage no está disponible
    console.warn('localStorage no disponible:', error)
    return `temp-${generateFingerprint()}-${Date.now()}`
  }
}

/**
 * Obtiene el fingerprint del dispositivo (más persistente que session)
 */
export function getDeviceFingerprint(): string {
  return generateFingerprint()
}

/**
 * Resetea la sesión (útil para testing o cuando el usuario cierra sesión)
 */
export function resetSession(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_TIMESTAMP_KEY)
  } catch (error) {
    console.warn('Error al resetear sesión:', error)
  }
}
