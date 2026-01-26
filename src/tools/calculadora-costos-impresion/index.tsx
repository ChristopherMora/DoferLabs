'use client'

import { useState } from 'react'
import JSZip from 'jszip'
import { useTrackEvent } from '@/lib/analytics/hooks'
import type { ToolProps } from '../types'
import { calculatorInputSchema, type CalculatorInput, type CalculatorResult } from './schema'
import { config } from './tool.config'

export default function CalculadoraCostosImpresion({ onComplete, onError }: ToolProps) {
  const tracker = useTrackEvent()
  
  // State para inputs con valores por defecto para México
  const [inputs, setInputs] = useState<CalculatorInput>({
    pesoGramos: 250, // Peso típico de una pieza mediana
    precioKgFilamento: 520, // MXN promedio en México
    porcentajeMerma: 10, // 10% típico para FDM
    horasImpresion: 9.5, // Tiempo típico para pieza mediana
    consumoWatts: 350, // Bambu Lab A1 / Ender 3
    precioKwh: 2.5, // Tarifa básica CFE México (promedio)
    precioImpresora: 10999, // Bambu Lab A1 precio México
    vidaUtilHoras: 2000, // Vida útil estimada
    margenGanancia: 30, // 30% margen típico
  })
  
  // State para resultado
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [slicerNotes, setSlicerNotes] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [printerName, setPrinterName] = useState<string>('')

  /**
   * Parsea archivos de slicer (.gcode o .3mf) para extraer datos
   */
  const parseSlicerFile = async (file: File) => {
    setIsImporting(true)
    setErrors({})
    setSlicerNotes('')
    setPreviewImage('')
    setPrinterName('')
    
    try {
      let text = ''
      const extractedData: Partial<CalculatorInput> = {}
      let notes: string[] = []
      
      console.log('📁 Archivo cargado:', file.name, 'Tamaño:', file.size, 'bytes')
      
      const fileName = file.name.toLowerCase()
      const has3mfExtension = fileName.endsWith('.3mf')
      
      // Si es .3mf, descomprimir primero
      if (has3mfExtension) {
        console.log('📦 Detectado archivo .3mf - descomprimiendo...')
        try {
          const zip = await JSZip.loadAsync(file)
          console.log('✅ ZIP descomprimido, archivos encontrados:', Object.keys(zip.files))
          
          // Los .3mf tienen un archivo Metadata/Slic3r_PE.config o similar con la info
          // También buscar en .gcode dentro del .3mf si existe
          let metadata = ''
          
          for (const [fileName, zipFile] of Object.entries(zip.files)) {
            if (!zipFile.dir) {
              console.log('📄 Leyendo archivo interno:', fileName)
              
              // Extraer imagen preview (thumbnail.png o similar)
              if (fileName.toLowerCase().includes('thumbnail') || 
                  fileName.toLowerCase().includes('preview') ||
                  fileName.toLowerCase().endsWith('.png')) {
                try {
                  const blob = await zipFile.async('blob')
                  const imageUrl = URL.createObjectURL(blob)
                  setPreviewImage(imageUrl)
                  console.log('🖼️ Imagen preview encontrada:', fileName)
                } catch (err) {
                  console.warn('⚠️ Error cargando imagen:', err)
                }
                continue
              }
              
              const content = await zipFile.async('string')
              
              // Si hay un .gcode dentro, usarlo directamente
              if (fileName.toLowerCase().endsWith('.gcode')) {
                console.log('✅ Encontrado .gcode dentro del .3mf')
                text = content
                break
              }
              
              // Acumular metadata y archivos de configuración
              if (fileName.includes('metadata') || fileName.includes('config') || 
                  fileName.toLowerCase().endsWith('.xml')) {
                metadata += content + '\n'
              }
            }
          }
          
          // Si no encontramos gcode, usar metadata
          if (!text) {
            text = metadata
          }
          
          console.log('📝 Contenido extraído, longitud:', text.length)
        } catch (error) {
          console.error('❌ Error descomprimiendo .3mf:', error)
          setErrors({ import: 'Error al leer el archivo .3mf. Puede estar corrupto o no ser un archivo .3mf válido.' })
          return
        }
      } else {
        // Para .gcode leer directamente como texto
        text = await file.text()
      }
      
      // Detectar si el contenido es gcode
      const firstLines = text.split('\n').slice(0, 50)
      const commentCount = firstLines.filter(l => l.trim().startsWith(';')).length
      const isGcodeContent = commentCount > 5
      
      console.log('🔍 Detección de formato:', {
        extensión: has3mfExtension ? '.3mf' : '.gcode',
        comentariosEncontrados: commentCount,
        formatoDetectado: isGcodeContent ? 'GCODE' : 'XML/Metadata'
      })
      
      // Dividir en líneas y filtrar líneas de comentarios o metadatos
      const lines = text.split('\n')
      let commentLines: string[] = []
      
      if (isGcodeContent) {
        console.log('📝 Procesando como GCODE - buscando comentarios')
        // Para .gcode buscar líneas con ;
        commentLines = lines.filter(line => line.trim().startsWith(';')).map(line => line.trim())
      } else {
        console.log('📋 Procesando como XML/Metadata - buscando información')
        // Para metadata/xml buscar cualquier línea que tenga información útil
        commentLines = lines.filter(line => {
          const l = line.toLowerCase()
          return (l.includes('weight') || l.includes('time') || l.includes('filament') || 
                  l.includes('material') || l.includes('print') || l.includes('duration'))
        })
      }
      
      console.log('💬 Líneas de información encontradas:', commentLines.length)
      
      // EXTRAER NOMBRE DE IMPRESORA
      for (const line of commentLines) {
        const lowerLine = line.toLowerCase()
        // Bambu Studio: "; printer_model = Bambu Lab A1"
        // Cura: "; Machine name: Ender 3"
        if (lowerLine.includes('printer_model') || lowerLine.includes('printer') || 
            lowerLine.includes('machine name') || lowerLine.includes('machine:')) {
          const match = line.match(/(?:printer_model|printer|machine[\s_]name|machine)\s*[=:]\s*([^;\n]+)/i)
          if (match) {
            const printer = match[1].trim()
            if (printer.length > 2 && printer.length < 50) {
              setPrinterName(printer)
              console.log('🖨️ Impresora detectada:', printer)
              break
            }
          }
        }
      }
      
      // BUSCAR PESO - más específico para evitar falsos positivos
      const weightKeywords = ['filament used', 'filament weight', 'total filament used', 'material weight', 'weight', 'total weight']
      
      for (const keyword of weightKeywords) {
        if (extractedData.pesoGramos) break
        
        for (const line of commentLines) {
          const lowerLine = line.toLowerCase()
          if (lowerLine.includes(keyword)) {
            // Buscar número seguido de g/gr/gram/gramos con límites de palabra
            // Evitar casos como "1002g" sin contexto
            const match = line.match(/[:\s=](\d+\.?\d*)\s*(?:g|gr|gram|gramos)(?:rams?)?(?:\s|,|;|$)/i)
            if (match) {
              const value = parseFloat(match[1])
              if (value >= 0.1 && value <= 5000) {
                extractedData.pesoGramos = value
                console.log('✅ Peso encontrado:', value, 'g en línea:', line.substring(0, 100))
                break
              }
            }
          }
        }
      }
      
      // Buscar patrones específicos en todo el texto (útil para .3mf)
      if (!extractedData.pesoGramos) {
        // Buscar "total" o "weight" seguido de número y g
        const patterns = [
          /total[^\d]*(\d+\.?\d*)\s*g(?:rams?)?/gi,
          /weight[^\d]*(\d+\.?\d*)\s*g(?:rams?)?/gi,
          /filament[^\d]*(\d+\.?\d*)\s*g(?:rams?)?/gi
        ]
        
        for (const pattern of patterns) {
          if (extractedData.pesoGramos) break
          const matches = text.matchAll(pattern)
          for (const match of matches) {
            const value = parseFloat(match[1])
            if (value >= 0.1 && value <= 5000) {
              extractedData.pesoGramos = value
              console.log('✅ Peso encontrado con patrón:', value, 'g')
              break
            }
          }
        }
      }

      // BAMBU STUDIO: Calcular peso desde longitud de filamento
      if (!extractedData.pesoGramos) {
        for (const line of commentLines) {
          const lowerLine = line.toLowerCase()
          // Bambu Studio exporta: "total filament length [mm] : 83052.75"
          if (lowerLine.includes('filament length') || lowerLine.includes('filament used [mm]')) {
            const match = line.match(/[:\s=](\d+\.?\d*)\s*(?:mm)?/i)
            if (match) {
              const lengthMm = parseFloat(match[1])
              if (lengthMm > 100 && lengthMm < 1000000) { // Rango válido
                // Calcular peso: Volumen = longitud × π × (diámetro/2)²
                const filamentDiameter = 1.75 // mm estándar
                const radius = filamentDiameter / 2
                const volumeMm3 = lengthMm * Math.PI * Math.pow(radius, 2)
                const volumeCm3 = volumeMm3 / 1000
                const densityPLA = 1.25 // g/cm³
                extractedData.pesoGramos = Math.round(volumeCm3 * densityPLA * 100) / 100
                console.log('✅ Peso calculado desde longitud Bambu:', extractedData.pesoGramos, 'g (longitud:', lengthMm, 'mm)')
                break
              }
            }
          }
        }
      }
      
      // Si encontramos volumen pero no peso
      if (!extractedData.pesoGramos) {
        for (const line of commentLines) {
          const lowerLine = line.toLowerCase()
          if ((lowerLine.includes('filament') || lowerLine.includes('material')) && 
              (lowerLine.includes('cm³') || lowerLine.includes('cm3'))) {
            const match = line.match(/(\d+\.?\d*)\s*cm[³3]/i)
            if (match) {
              const volume = parseFloat(match[1])
              if (volume > 0 && volume <= 5000) {
                extractedData.pesoGramos = Math.round(volume * 1.25 * 100) / 100
                console.log('✅ Peso calculado desde volumen:', extractedData.pesoGramos, 'g (volumen:', volume, 'cm³)')
                break
              }
            }
          }
        }
      }
      
      // BUSCAR TIEMPO
      const timeKeywords = ['estimated printing time', 'print time', 'estimated time', 'total time', 'printing time', 'time']
      
      for (const keyword of timeKeywords) {
        if (extractedData.horasImpresion) break
        
        for (const line of commentLines) {
          const lowerLine = line.toLowerCase()
          if (lowerLine.includes(keyword)) {
            // Patrón 1: X hours Y minutes o Xh Ym
            let match = line.match(/(\d+)\s*h(?:ours?)?\s+(\d+)\s*m(?:in)?/i)
            if (match) {
              const hours = parseInt(match[1])
              const minutes = parseInt(match[2])
              extractedData.horasImpresion = hours + (minutes / 60)
              console.log('✅ Tiempo encontrado:', extractedData.horasImpresion, 'h (formato h+m)')
              break
            }
            
            // Patrón 2: X.Y hours
            match = line.match(/(\d+\.?\d*)\s*h(?:ours?)?(?!\d)/i)
            if (match) {
              const value = parseFloat(match[1])
              if (value > 0 && value <= 200) {
                extractedData.horasImpresion = value
                console.log('✅ Tiempo encontrado:', value, 'h (formato decimal)')
                break
              }
            }
            
            // Patrón 3: X minutes
            if (!line.toLowerCase().includes('mm')) {
              match = line.match(/(\d+)\s*m(?:in)?(?:utes?)?(?!\w)/i)
              if (match) {
                const minutes = parseInt(match[1])
                if (minutes > 0 && minutes <= 12000) {
                  extractedData.horasImpresion = Math.round((minutes / 60) * 100) / 100
                  console.log('✅ Tiempo encontrado:', extractedData.horasImpresion, 'h (convertido de', minutes, 'min)')
                  break
                }
              }
            }
          }
        }
      }
      
      // Extraer notas legibles
      for (const line of commentLines) {
        if (notes.length >= 5) break
        const note = line.replace(/^;\s*/, '').trim()
        if (note && note.length > 10 && note.length < 120 && /^[\x20-\x7E\s]+$/.test(note)) {
          notes.push(note)
        }
      }
      
      console.log('📊 Resumen extracción:', {
        archivo: file.name,
        tipo: isGcodeContent ? 'GCODE (texto plano)' : 'XML/Metadata',
        peso: extractedData.pesoGramos || 'No encontrado',
        tiempo: extractedData.horasImpresion || 'No encontrado',
        notasEncontradas: notes.length
      })
      
      // Actualizar state con los datos extraídos
      if (extractedData.pesoGramos || extractedData.horasImpresion) {
        setInputs(prev => ({ 
          ...prev, 
          ...(extractedData.pesoGramos && { pesoGramos: extractedData.pesoGramos }),
          ...(extractedData.horasImpresion && { horasImpresion: Math.round(extractedData.horasImpresion * 100) / 100 })
        }))
        
        if (notes.length > 0) {
          setSlicerNotes(notes.join('\n'))
        }
        
        // Mensaje de éxito
        const extractedFields = []
        if (extractedData.pesoGramos) extractedFields.push(`Peso: ${extractedData.pesoGramos}g`)
        if (extractedData.horasImpresion) extractedFields.push(`Tiempo: ${extractedData.horasImpresion.toFixed(2)}h`)
        
        setErrors({ success: `✅ Datos extraídos: ${extractedFields.join(', ')}` })
        tracker.toolExecuted(config.id, { action: isGcodeContent ? 'import_gcode_success' : 'import_3mf_success', fileName: file.name })
      } else {
        console.log('❌ No se pudo extraer ningún dato')
        if (isGcodeContent) {
          console.log('💡 Mostrando primeras 20 líneas de comentarios para debug:')
          commentLines.slice(0, 20).forEach((line, i) => console.log(`${i + 1}:`, line))
        }
        setErrors({ 
          import: isGcodeContent
            ? 'No se encontró información de peso o tiempo en el archivo .gcode. Asegúrate de que tenga comentarios con esta información.'
            : 'No se encontró información en el archivo .3mf. Estos archivos a veces no incluyen metadatos de peso/tiempo. Intenta exportar como .gcode desde tu slicer.' 
        })
      }
      
    } catch (error) {
      setErrors({ import: 'Error al leer el archivo. Verifica que el archivo no esté corrupto.' })
      console.error('❌ Error parsing file:', error)
    } finally {
      setIsImporting(false)
    }
  }

  /**
   * Handler para archivo seleccionado
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const fileName = file.name.toLowerCase()
    
    // Aceptar .gcode, .3mf, .gcode.3mf
    if (!fileName.endsWith('.gcode') && !fileName.endsWith('.3mf') && !fileName.includes('.gcode.')) {
      setErrors({ import: 'Por favor selecciona un archivo .gcode, .3mf o .gcode.3mf' })
      return
    }
    
    parseSlicerFile(file)
  }

  /**
   * Calcula los costos (lógica client-side)
   */
  const calcular = () => {
    try {
      // Validar inputs
      const validated = calculatorInputSchema.parse(inputs)
      
      // Calcular peso real con merma
      const pesoReal = validated.pesoGramos * (1 + validated.porcentajeMerma / 100)
      
      // Costo de material
      const costoGramo = validated.precioKgFilamento / 1000
      const costoMaterial = pesoReal * costoGramo
      
      // Costo de energía
      const energiaKwh = (validated.consumoWatts * validated.horasImpresion) / 1000
      const costoEnergia = energiaKwh * validated.precioKwh
      
      // Costo de depreciación de la impresora
      let costoDepreciacion = 0
      if (validated.precioImpresora && validated.vidaUtilHoras) {
        costoDepreciacion = (validated.precioImpresora / validated.vidaUtilHoras) * validated.horasImpresion
      }
      
      const costoTotal = costoMaterial + costoEnergia + costoDepreciacion
      const conMargen = costoTotal + (costoTotal * (validated.margenGanancia / 100))
      
      const resultado: CalculatorResult = {
        costos: {
          material: costoMaterial,
          energia: costoEnergia,
          depreciacion: costoDepreciacion,
          tiempo: 0, // Por ahora no valoramos el tiempo
          total: costoTotal,
        },
        conMargen,
        breakdown: {
          pesoUsado: validated.pesoGramos,
          pesoReal,
          costoGramo,
          energiaKwh,
          porcentajeMerma: validated.porcentajeMerma,
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
        
        {/* Importar desde Slicer */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border-2 border-dashed border-emerald-300">
          <div className="flex items-start gap-4">
            {/* Preview Image */}
            {previewImage ? (
              <div className="flex-shrink-0">
                <img 
                  src={previewImage} 
                  alt="Preview 3D" 
                  className="w-32 h-32 object-contain rounded-lg border-2 border-emerald-300 bg-white"
                />
              </div>
            ) : (
              <div className="text-3xl flex-shrink-0">📁</div>
            )}
            
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900 mb-1">Importar desde Slicer</h3>
              <p className="text-sm text-emerald-700 mb-3">
                Sube tu archivo <strong>.gcode, .3mf o .gcode.3mf</strong> y autocompletaremos los datos
              </p>
              
              {printerName && (
                <div className="mb-3 inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  <span>🖨️</span>
                  <span className="font-semibold">{printerName}</span>
                </div>
              )}
              
              <label className="cursor-pointer inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                <span>{isImporting ? 'Procesando...' : 'Elegir archivo'}</span>
                <input
                  type="file"
                  accept=".gcode,.GCODE,.3mf,.3MF,text/plain,text/x-gcode,application/x-3mf"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
              
              <p className="text-xs text-emerald-600 mt-2">
                💡 Tip: Exporta desde Cura, PrusaSlicer, Bambu Studio, etc.
              </p>
              
              {slicerNotes && (
                <div className="mt-3 p-2 bg-white/50 rounded text-xs text-gray-600 max-h-20 overflow-auto">
                  <strong>Notas del slicer:</strong>
                  <pre className="whitespace-pre-wrap font-mono">{slicerNotes}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Error de importación */}
        {errors.import && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            {errors.import}
          </div>
        )}
        
        {/* Mensaje de éxito */}
        {errors.success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {errors.success}
          </div>
        )}
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">o ingresa manualmente</span>
          </div>
        </div>
        
        {/* Material */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Peso del objeto (gramos)
          </label>
          <input
            key={`peso-${inputs.pesoGramos}`}
            type="number"
            value={inputs.pesoGramos}
            onChange={(e) => handleInputChange('pesoGramos', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            min="0.1"
            step="0.1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Precio por kg (MXN)
            </label>
            <input
              type="number"
              value={inputs.precioKgFilamento}
              onChange={(e) => handleInputChange('precioKgFilamento', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              min="1"
              step="10"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Precio por gramo (MXN)
            </label>
            <input
              type="number"
              value={(inputs.precioKgFilamento / 1000).toFixed(2)}
              onChange={(e) => {
                const precioGramo = parseFloat(e.target.value) || 0
                handleInputChange('precioKgFilamento', precioGramo * 1000)
              }}
              className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              min="0.01"
              step="0.1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Merma/Soportes (%)
          </label>
          <input
            type="number"
            value={inputs.porcentajeMerma}
            onChange={(e) => handleInputChange('porcentajeMerma', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            min="0"
            max="100"
            step="1"
          />
          <p className="text-xs text-gray-500">Típico FDM: 10% | MSLA: 30%</p>
        </div>

        {/* Tiempo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tiempo de impresión (horas)
          </label>
          <input
            key={`tiempo-${inputs.horasImpresion}`}
            type="number"
            value={inputs.horasImpresion}
            onChange={(e) => handleInputChange('horasImpresion', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            min="0.01"
            step="0.1"
          />
        </div>

        {/* Energía y Máquina */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">⚡ Energía y Máquina</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Consumo impresora (Watts)
              </label>
              <input
                type="number"
                value={inputs.consumoWatts}
                onChange={(e) => handleInputChange('consumoWatts', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tarifa CFE (MXN/kWh)
              </label>
              <input
                type="number"
                value={inputs.precioKwh}
                onChange={(e) => handleInputChange('precioKwh', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Precio impresora (MXN)
              </label>
              <input
                type="number"
                value={inputs.precioImpresora}
                onChange={(e) => handleInputChange('precioImpresora', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                min="0"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Vida útil (horas)
              </label>
              <input
                type="number"
                value={inputs.vidaUtilHoras}
                onChange={(e) => handleInputChange('vidaUtilHoras', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                min="100"
                step="100"
              />
            </div>
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
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
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
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
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
              ${result.costos.total.toFixed(2)} MXN
            </p>
            {inputs.margenGanancia > 0 && (
              <p className="text-gray-600 mt-2">
                Con margen: <span className="font-bold text-blue-700">${result.conMargen.toFixed(2)} MXN</span>
              </p>
            )}
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 text-sm">💰 Material</p>
              <p className="text-2xl font-bold text-gray-900">${result.costos.material.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {result.breakdown.pesoUsado}g + {result.breakdown.porcentajeMerma}% merma = {result.breakdown.pesoReal.toFixed(1)}g
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 text-sm">⚡ Energía</p>
              <p className="text-2xl font-bold text-gray-900">${result.costos.energia.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {result.breakdown.energiaKwh.toFixed(2)} kWh
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-600 text-sm">🖨️ Depreciación</p>
              <p className="text-2xl font-bold text-gray-900">${result.costos.depreciacion.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Por uso de máquina
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
