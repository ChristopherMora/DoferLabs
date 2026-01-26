import { z } from 'zod'

/**
 * Schema de validación para inputs de la calculadora
 */
export const calculatorInputSchema = z.object({
  // Material
  pesoGramos: z.number().min(0.1).max(10000, 'Peso máximo: 10kg'),
  precioKgFilamento: z.number().min(1).max(10000, 'Precio debe ser válido'),
  
  // Tiempo
  horasImpresion: z.number().min(0.01).max(1000, 'Máximo 1000 horas'),
  
  // Energía
  consumoWatts: z.number().min(1).max(1000).default(200), // Typical 3D printer
  precioKwh: z.number().min(0).max(100).default(0.15), // USD per kWh
  
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
    tiempo: number // Si quieren valorizar su tiempo
    total: number
  }
  conMargen: number
  breakdown: {
    pesoUsado: number
    costoGramo: number
    energiaKwh: number
  }
}
