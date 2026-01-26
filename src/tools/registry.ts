import { ToolManifest } from './types'

/**
 * Registry central de herramientas
 * Usa auto-discovery para cargar todas las herramientas dinámicamente
 */
class ToolRegistry {
  private tools: Map<string, ToolManifest> = new Map()
  private initialized = false

  /**
   * Inicializa el registry cargando todas las herramientas
   */
  async initialize() {
    if (this.initialized) return

    // Auto-discovery: busca todos los archivos tool.config.ts
    // En Next.js 15 usamos import dinámico en lugar de import.meta.glob
    // Las herramientas se registran manualmente o mediante un loader
    
    this.initialized = true
  }

  /**
   * Registra una herramienta manualmente
   */
  register(manifest: ToolManifest) {
    if (this.tools.has(manifest.id)) {
      console.warn(`Tool ${manifest.id} already registered, overwriting`)
    }
    this.tools.set(manifest.id, manifest)
  }

  /**
   * Obtiene una herramienta por ID
   */
  get(id: string): ToolManifest | undefined {
    return this.tools.get(id)
  }

  /**
   * Obtiene todas las herramientas
   */
  getAll(): ToolManifest[] {
    return Array.from(this.tools.values())
  }

  /**
   * Obtiene herramientas por categoría
   */
  getByCategory(category: string): ToolManifest[] {
    return this.getAll().filter(tool => tool.category === category)
  }

  /**
   * Obtiene herramientas por tier
   */
  getByTier(tier: string): ToolManifest[] {
    return this.getAll().filter(tool => tool.tier === tier)
  }

  /**
   * Obtiene herramientas disponibles (no deprecated)
   */
  getAvailable(): ToolManifest[] {
    return this.getAll().filter(tool => tool.status !== 'deprecated')
  }

  /**
   * Busca herramientas por texto
   */
  search(query: string): ToolManifest[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter(tool => 
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.category.toLowerCase().includes(lowerQuery)
    )
  }
}

// Singleton del registry
export const toolRegistry = new ToolRegistry()

// Helper para obtener todas las herramientas (usa en Server Components)
export function getAllTools(): ToolManifest[] {
  return toolRegistry.getAll()
}

// Helper para obtener una herramienta (usa en Server Components)
export function getTool(id: string): ToolManifest | undefined {
  return toolRegistry.get(id)
}

// Helper para obtener herramientas disponibles
export function getAvailableTools(): ToolManifest[] {
  return toolRegistry.getAvailable()
}
