import { z } from 'zod'

/**
 * Schema de validación para inputs de la calculadora
 */
export const calculatorInputSchema = z.object({
  // Material
  pesoGramos: z.number().min(0.1).max(10000, 'Peso máximo: 10kg'),
  precioKgFilamento: z.number().min(1).max(10000, 'Precio debe ser válido'),
  porcentajeMerma: z.number().min(0).max(100).default(10), // % de soportes/desperdicios
  
  // Tiempo
  horasImpresion: z.number().min(0.01).max(1000, 'Máximo 1000 horas'),
  
  // Energía
  consumoWatts: z.number().min(1).max(1000).default(350), // Típico FDM en México
  precioKwh: z.number().min(0).max(100).default(2.5), // MXN por kWh (tarifa básica CFE)
  
  // Máquina
  precioImpresora: z.number().min(0).max(1000000).optional().default(0), // MXN
  vidaUtilHoras: z.number().min(100).max(100000).optional().default(2000), // Horas de vida útil
  
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
    tiempo: number // Si quieren valorizar su tiempo
    total: number
  }
  conMargen: number
  breakdown: {
    pesoUsado: number
    pesoReal: number // Con merma
    costoGramo: number
    energiaKwh: number
    porcentajeMerma: number
  }
}
