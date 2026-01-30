import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware de seguridad para Next.js
 * Agrega headers de seguridad y protecciones básicas
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // ============================================
  // Headers de Seguridad
  // ============================================

  // Content Security Policy (CSP)
  // Previene XSS y ataques de inyección de código
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)

  // X-Frame-Options: Previene clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options: Previene MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy: Controla qué información se envía en el header Referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy: Controla qué features del navegador pueden usarse
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // X-XSS-Protection: Protección legacy contra XSS (algunos navegadores antiguos)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Strict-Transport-Security (HSTS): Fuerza HTTPS
  // Solo en producción y con HTTPS habilitado
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // ============================================
  // Headers CORS (solo para APIs)
  // ============================================
  
  if (request.nextUrl.pathname.startsWith('/api')) {
    // En desarrollo, permitir localhost
    // En producción, especificar dominios permitidos
    const allowedOrigins = process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000', 'http://localhost:3001']
      : [process.env.NEXT_PUBLIC_APP_URL || 'https://makerhub.com'] // Cambiar por tu dominio

    const origin = request.headers.get('origin')
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400') // 24 horas

    // Manejar preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers })
    }
  }

  // ============================================
  // Protección básica contra bots
  // ============================================

  const userAgent = request.headers.get('user-agent')
  
  // Bloquear user agents sospechosos
  const suspiciousAgents = [
    'curl', 
    'wget', 
    'python-requests',
    'scrapy',
    'bot',
  ]

  if (userAgent) {
    const lowerAgent = userAgent.toLowerCase()
    const isSuspicious = suspiciousAgents.some(agent => lowerAgent.includes(agent))
    
    // En APIs, bloquear bots (excepto en desarrollo)
    if (isSuspicious && 
        request.nextUrl.pathname.startsWith('/api') && 
        process.env.NODE_ENV === 'production') {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  return response
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
