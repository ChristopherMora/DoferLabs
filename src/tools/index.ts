import { toolRegistry } from './registry'
import type { ToolManifest } from './types'

// Import configs
import { config as calcCostosConfig } from './calculadora-costos-impresion/tool.config'

/**
 * Registra todas las herramientas disponibles
 * Este archivo se importa una vez al inicio de la app
 */
export function registerAllTools() {
  // Herramienta 1: Calculadora de Costos
  toolRegistry.register({
    ...calcCostosConfig,
    path: `/hub/${calcCostosConfig.id}`,
    component: () => import('./calculadora-costos-impresion'),
  })

  // TODO: Agregar más herramientas aquí siguiendo el mismo patrón
  
  console.log(`✅ ${toolRegistry.getAll().length} herramientas registradas`)
}

// Exportar helpers del registry
export { toolRegistry, getAllTools, getTool, getAvailableTools } from './registry'
export type { ToolManifest, ToolConfig, ToolProps, ToolResult } from './types'
