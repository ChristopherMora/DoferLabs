import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { checkCsrfProtection } from '@/lib/security/csrf'

// Validación del evento
const eventSchema = z.object({
  eventType: z.string().min(1).max(100),
  toolId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

// Tipos de eventos permitidos
const VALID_EVENT_TYPES = [
  // Navegación
  'page_view',
  'page_exit',
  
  // Herramientas
  'tool_opened',
  'tool_executed',
  'tool_error',
  'result_viewed',
  'result_copied',
  'result_downloaded',
  
  // Conversión
  'subscription_started',
  'subscription_completed',
  'subscription_failed',
  
  // Comunidad
  'community_button_clicked',
  'facebook_link_clicked',
  'whatsapp_link_clicked',
  'community_page_viewed',
  
  // Engagement
  'form_started',
  'form_completed',
  'form_abandoned',
  'link_clicked',
  'scroll_depth',
]

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (más permisivo para analytics)
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.events)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validar estructura básica
    const validationResult = eventSchema.safeParse(body)
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

    const { eventType, toolId, sessionId, userId, metadata } = validationResult.data

    // Validar que el tipo de evento sea válido
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tipo de evento no válido: ${eventType}` 
        },
        { status: 400 }
      )
    }

    // Obtener información adicional del request
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'direct'
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Enriquecer metadata con información del contexto
    const enrichedMetadata = {
      ...metadata,
      userAgent,
      referer,
      // NO guardar IP completa por privacidad, solo primeros segmentos
      ipHash: ip !== 'unknown' ? hashIP(ip) : 'unknown',
      timestamp: new Date().toISOString(),
    }

    // Guardar el evento en la base de datos (deshabilitado - base de datos en desarrollo)
    console.log('Event tracked:', { eventType, toolId, sessionId, userId, metadata: enrichedMetadata })
    // await prisma.event.create({
    //   data: {
    //     eventType,
    //     toolId: toolId || null,
    //     sessionId: sessionId || null,
    //     userId: userId || null,
    //     metadata: enrichedMetadata,
    //   }
    // })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al guardar evento:', error)
    
    // No fallar ruidosamente - analytics no debe romper la app
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

// Batch endpoint para múltiples eventos
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, RATE_LIMITS.events)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    if (!Array.isArray(body.events)) {
      return NextResponse.json(
        { success: false, error: 'Se esperaba un array de eventos' },
        { status: 400 }
      )
    }

    // Validar todos los eventos
    const validEvents = body.events
      .map((event: any) => eventSchema.safeParse(event))
      .filter((result: any) => result.success)
      .map((result: any) => (result as any).data)

    if (validEvents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay eventos válidos' },
        { status: 400 }
      )
    }

    // Guardar todos los eventos (deshabilitado - base de datos en desarrollo)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'direct'
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    console.log('Batch events tracked:', validEvents.length)
    // await prisma.event.createMany({
    //   data: validEvents.map((event: any) => ({
    //     eventType: event.eventType,
    //     toolId: event.toolId || null,
    //     sessionId: event.sessionId || null,
    //     userId: event.userId || null,
    //     metadata: {
    //       ...event.metadata,
    //       userAgent,
    //       referer,
    //       ipHash: ip !== 'unknown' ? hashIP(ip) : 'unknown',
    //       timestamp: new Date().toISOString(),
    //     },
    //   }))
    // })

    return NextResponse.json({ 
      success: true, 
      saved: validEvents.length 
    })

  } catch (error) {
    console.error('Error al guardar eventos en batch:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

// Hash simple de IP para privacidad (no reversible)
function hashIP(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
