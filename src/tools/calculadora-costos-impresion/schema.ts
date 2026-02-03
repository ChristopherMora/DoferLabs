import { z } from 'zod'

/**
 * Schema de validación para inputs de la calculadora
 */
export const calculatorInputSchema = z.object({
  // Material
  pesoGramos: z.number().min(0.1).max(10000, 'Peso máximo: 10kg'),
  precioKgFilamento: z.number().min(1).max(10000, 'Precio debe ser válido'),
  porcentajeMerma: z.number().min(0).max(100).default(10), // % de soportes/desperdicios
  
  // Cantidad
  cantidad: z.number().min(1).max(10000).default(1), // Cantidad de piezas
  
  // Tiempo
  horasImpresion: z.number().min(0.01).max(1000, 'Máximo 1000 horas'),
  
  // Energía
  consumoWatts: z.number().min(1).max(1000).default(350), // Típico FDM en México
  precioKwh: z.number().min(0).max(100).default(2.5), // MXN por kWh (tarifa básica CFE)
  
  // Máquina
  precioImpresora: z.number().min(0).max(1000000).optional().default(0), // MXN
  vidaUtilHoras: z.number().min(0).max(100000).optional().default(2000), // Horas de vida útil
  
  // Mano de obra
  costoManoObra: z.number().min(0).max(100000).optional().default(0), // MXN por pieza
  
  // Opcionales
  margenGanancia: z.number().min(0).max(1000).optional().default(0),
})

export type CalculatorInput = z.infer<typeof calculatorInputSchema>

/**
 * Tipo del resultado del cálculo
 */
export interface CalculatorResult {
  costos: {
    material: number
    energia: number
    depreciacion: number
    manoObra: number
    tiempo: number // Si quieren valorizar su tiempo
    total: number
  }
  conMargen: number
  cantidad: number
  precioUnitario: number
  precioTotal: number
  descuentoVolumen: number
  breakdown: {
    pesoUsado: number
    pesoReal: number // Con merma
    costoGramo: number
    energiaKwh: number
    porcentajeMerma: number
  }
}

/**
 * Base de datos de precios de materiales en MXN por kg
 */
export const MATERIAL_PRICES: Record<string, { precio: number; nombre: string; emoji: string }> = {
  pla: { precio: 250, nombre: 'PLA', emoji: '🟢' },
  'pla-plus': { precio: 350, nombre: 'PLA+', emoji: '🟢' },
  petg: { precio: 400, nombre: 'PETG', emoji: '🔵' },
  abs: { precio: 350, nombre: 'ABS', emoji: '🟡' },
  asa: { precio: 450, nombre: 'ASA', emoji: '🟠' },
  tpu: { precio: 550, nombre: 'TPU (Flexible)', emoji: '🟣' },
  nylon: { precio: 600, nombre: 'Nylon', emoji: '⚪' },
  'pla-wood': { precio: 400, nombre: 'PLA Madera', emoji: '🟤' },
  'pla-silk': { precio: 380, nombre: 'PLA Seda', emoji: '✨' },
  'petg-carbon': { precio: 650, nombre: 'PETG Fibra Carbono', emoji: '⚫' },
}
