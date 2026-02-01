import { z } from 'zod'

// ============================================
// TIPOS CORE DEL SISTEMA DE HERRAMIENTAS
// ============================================

/**
 * Niveles de acceso para features
 */
export type FeatureTier = 'free' | 'pro' | 'enterprise'

/**
 * Categorías de herramientas
 */
export type ToolCategory = 
  | 'costos'      // Calculadoras de costos
  | 'calidad'     // Control de calidad, troubleshooting
  | 'materiales'  // Info sobre materiales, adhesión, etc.
  | 'diseño'      // Herramientas de diseño/CAD
  | 'utilidades'  // Conversores, generadores, etc.

/**
 * Estados de desarrollo de una herramienta
 */
export type ToolStatus = 'beta' | 'stable' | 'deprecated'

/**
 * Configuración base de una herramienta
 */
export interface ToolConfig {
  // Metadata
  id: string
  name: string
  description: string
  category: ToolCategory
  
  // UI
  icon?: string
  color?: string
  
  // Estado & acceso
  status: ToolStatus
  tier: FeatureTier
  
  // Features
  features: {
    exportable?: boolean    // ¿Puede exportar resultados?
    saveable?: boolean      // ¿Puede guardar resultados?
    shareable?: boolean     // ¿Puede compartir?
    versionable?: boolean   // ¿Mantiene historial?
  }
  
  // SEO
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

/**
 * Manifest completo de una herramienta
 * Incluye el componente lazy-loaded
 */
export interface ToolManifest extends ToolConfig {
  // Lazy-loaded component
  component: () => Promise<{ default: React.ComponentType<ToolProps> }>
  
  // Path de la herramienta
  path: string
}

/**
 * Props que recibe cada componente de herramienta
 */
export interface ToolProps {
  // Context del usuario (opcional si no hay auth)
  userTier?: FeatureTier
  userId?: string
  
  // Callbacks
  onComplete?: (result: ToolResult) => void
  onError?: (error: Error) => void
}

/**
 * Resultado estándar de una herramienta
 */
export interface ToolResult<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
  metadata?: {
    executionTime?: number
    timestamp: Date
  }
}

/**
 * Input genérico de herramienta con validación Zod
 */
export interface ToolInput<T extends z.ZodTypeAny = z.ZodTypeAny> {
  schema: T
  defaultValues?: Partial<z.infer<T>>
}

/**
 * Evento de analítica de herramienta
 */
export interface ToolEvent {
  toolId: string
  eventType: 'opened' | 'executed' | 'result_viewed' | 'exported' | 'saved' | 'error' | 'page_view'
  metadata?: Record<string, unknown>
  timestamp: Date
}

// ============================================
// SCHEMAS ZOD COMUNES
// ============================================

/**
 * Schema base para validar configuraciones de herramientas
 */
export const toolConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['costos', 'calidad', 'materiales', 'diseño', 'utilidades']),
  status: z.enum(['beta', 'stable', 'deprecated']),
  tier: z.enum(['free', 'pro', 'enterprise']),
  features: z.object({
    exportable: z.boolean().optional(),
    saveable: z.boolean().optional(),
    shareable: z.boolean().optional(),
    versionable: z.boolean().optional(),
  }),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
})

/**
 * Schema para eventos de analítica
 */
export const toolEventSchema = z.object({
  toolId: z.string(),
  eventType: z.enum(['opened', 'executed', 'result_viewed', 'exported', 'saved', 'error']),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.date(),
})
