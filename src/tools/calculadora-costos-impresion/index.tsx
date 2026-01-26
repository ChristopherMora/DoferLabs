'use client'

import { useState } from 'react'
import { useTrackEvent } from '@/lib/analytics/hooks'
import type { ToolProps } from '../types'
import { calculatorInputSchema, type CalculatorInput, type CalculatorResult } from './schema'
import { config } from './tool.config'

export default function CalculadoraCostosImpresion({ onComplete, onError }: ToolProps) {
  const tracker = useTrackEvent()
  
  // State para inputs
  const [inputs, setInputs] = useState<CalculatorInput>({
    pesoGramos: 50,
    precioKgFilamento: 20,
    horasImpresion: 2,
    consumoWatts: 200,
    precioKwh: 0.15,
    margenGanancia: 0,
  })
  
  // State para resultado
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  /**
   * Calcula los costos (lógica client-side)
   */
  const calcular = () => {
    try {
      // Validar inputs
      const validated = calculatorInputSchema.parse(inputs)
      
      // Cálculos
      const costoGramo = validated.precioKgFilamento / 1000
      const costoMaterial = validated.pesoGramos * costoGramo
      
      const energiaKwh = (validated.consumoWatts * validated.horasImpresion) / 1000
      const costoEnergia = energiaKwh * validated.precioKwh
      
      const costoTotal = costoMaterial + costoEnergia
      const conMargen = costoTotal + (costoTotal * (validated.margenGanancia / 100))
      
      const resultado: CalculatorResult = {
        costos: {
          material: costoMaterial,
          energia: costoEnergia,
          tiempo: 0, // Por ahora no valoramos el tiempo
          total: costoTotal,
        },
        conMargen,
        breakdown: {
          pesoUsado: validated.pesoGramos,
          costoGramo,
          energiaKwh,
        },
      }
      
      setResult(resultado)
      setErrors({})
      
      // Track evento
      tracker.toolExecuted(config.id, {
        pesoGramos: validated.pesoGramos,
        costoTotal: costoTotal,
      })
      
      // Callback
      onComplete?.({
        success: true,
        data: resultado,
        metadata: {
          executionTime: 0,
          timestamp: new Date(),
        },
      })
      
      // Track result viewed
      tracker.resultViewed(config.id)
      
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message })
        onError?.(error)
        tracker.error(config.id, error)
      }
    }
  }

  /**
   * Handler para cambios en inputs
   */
  const handleInputChange = (field: keyof CalculatorInput, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    setErrors({}) // Limpiar errores al editar
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-4xl">{config.icon}</div>
        <h1 className="text-3xl font-bold">{config.name}</h1>
        <p className="text-gray-600">{config.description}</p>
      </div>

      {/* Form de inputs */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Datos de tu impresión</h2>
        
        {/* Material */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Peso del objeto (gramos)
          </label>
          <input
            type="number"
            value={inputs.pesoGramos}
            onChange={(e) => handleInputChange('pesoGramos', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0.1"
            step="0.1"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Precio por kg de filamento (USD)
          </label>
          <input
            type="number"
            value={inputs.precioKgFilamento}
            onChange={(e) => handleInputChange('precioKgFilamento', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            step="1"
          />
        </div>

        {/* Tiempo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tiempo de impresión (horas)
          </label>
          <input
            type="number"
            value={inputs.horasImpresion}
            onChange={(e) => handleInputChange('horasImpresion', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0.01"
            step="0.1"
          />
        </div>

        {/* Energía */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Consumo impresora (Watts)
            </label>
            <input
              type="number"
              value={inputs.consumoWatts}
              onChange={(e) => handleInputChange('consumoWatts', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Precio kWh (USD)
            </label>
            <input
              type="number"
              value={inputs.precioKwh}
              onChange={(e) => handleInputChange('precioKwh', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Margen (opcional) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Margen de ganancia (%) - Opcional
          </label>
          <input
            type="number"
            value={inputs.margenGanancia}
            onChange={(e) => handleInputChange('margenGanancia', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="5"
          />
        </div>

        {/* Botón calcular */}
        <button
          onClick={calcular}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors"
        >
          Calcular Costos
        </button>

        {/* Errores */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {Object.values(errors).map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold text-blue-900">Resultado</h2>
          
          {/* Costo total destacado */}
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-gray-600 text-sm uppercase tracking-wide">Costo Total</p>
            <p className="text-5xl font-bold text-blue-600">
              ${result.costos.total.toFixed(2)}
            </p>
            {inputs.margenGanancia > 0 && (
              <p className="text-gray-600 mt-2">
                Con margen: <span className="font-bold text-blue-700">${result.conMargen.toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 text-sm">Material</p>
              <p className="text-2xl font-bold text-gray-900">${result.costos.material.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {result.breakdown.pesoUsado}g @ ${result.breakdown.costoGramo.toFixed(4)}/g
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 text-sm">Energía</p>
              <p className="text-2xl font-bold text-gray-900">${result.costos.energia.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {result.breakdown.energiaKwh.toFixed(2)} kWh
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                // Reset
                setResult(null)
              }}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 transition-colors"
            >
              Nuevo Cálculo
            </button>
            
            {config.features.exportable && (
              <button
                onClick={() => {
                  // TODO: Implementar export
                  tracker.resultExported(config.id, 'txt')
                  alert('Export próximamente...')
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Exportar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
