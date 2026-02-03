import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { checkCsrfProtection } from '@/lib/security/csrf'

// Validación del input
const subscribeSchema = z.object({
  contact: z.string().min(3, 'Contacto muy corto').max(100, 'Contacto muy largo'),
  source: z.string().optional().default('homepage'),
})

// Función para detectar si es email o whatsapp
function detectContactType(contact: string): 'email' | 'whatsapp' {
  // Si contiene @ es email
  if (contact.includes('@')) {
    return 'email'
  }
  // Si son solo números, guiones, espacios o empieza con + es whatsapp
  if (/^[\d\s\-+()]+$/.test(contact)) {
    return 'whatsapp'
  }
  // Por defecto asumimos email
  return 'email'
}

// Función para normalizar contacto
function normalizeContact(contact: string, type: 'email' | 'whatsapp'): string {
  if (type === 'email') {
    return contact.toLowerCase().trim()
  }
  // Para whatsapp, remover espacios, guiones, paréntesis
  return contact.replace(/[\s\-()]/g, '').trim()
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.subscription)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Demasiados intentos. Por favor intenta de nuevo más tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMITS.subscription.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          }
        }
      )
    }

    // CSRF Protection
    const csrfCheck = checkCsrfProtection(request)
    if (!csrfCheck.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validar input
    const validationResult = subscribeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Datos inválidos',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { contact, source } = validationResult.data

    // Detectar tipo de contacto
    const type = detectContactType(contact)
    const normalizedContact = normalizeContact(contact, type)

    // Validación adicional según tipo
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normalizedContact)) {
        return NextResponse.json(
          { success: false, error: 'Email inválido' },
          { status: 400 }
        )
      }
    } else {
      // Validar whatsapp (debe tener al menos 10 dígitos)
      const digitsOnly = normalizedContact.replace(/\D/g, '')
      if (digitsOnly.length < 10) {
        return NextResponse.json(
          { success: false, error: 'Número de WhatsApp inválido (mínimo 10 dígitos)' },
          { status: 400 }
        )
      }
    }

    // Verificar si ya existe
    const existing = await prisma.subscriber.findUnique({
      where: { contact: normalizedContact }
    })

    if (existing) {
      // Si existe pero está inactivo, reactivar
      if (!existing.active) {
        await prisma.subscriber.update({
          where: { id: existing.id },
          data: { active: true, updatedAt: new Date() }
        })
        return NextResponse.json({
          success: true,
          message: '¡Bienvenido de nuevo! Tu suscripción ha sido reactivada.',
          type
        })
      }
      
      return NextResponse.json({
        success: true,
        message: '¡Ya estás suscrito! Te avisaremos de nuevas herramientas.',
        type
      })
    }

    // Crear nuevo subscriber
    await prisma.subscriber.create({
      data: {
        contact: normalizedContact,
        type,
        source,
        active: true,
        verified: false,
      }
    })

    return NextResponse.json({
      success: true,
      message: type === 'email' 
        ? '¡Listo! Te avisaremos cuando agreguemos nuevas herramientas.'
        : '¡Perfecto! Te contactaremos por WhatsApp cuando haya novedades.',
      type
    })

  } catch (error) {
    console.error('Error al crear suscriptor:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al procesar tu suscripción. Intenta de nuevo.' 
      },
      { status: 500 }
    )
  }
}
