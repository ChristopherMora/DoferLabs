'use client'

import { useState, Suspense } from 'react'
import JSZip from 'jszip'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Center } from '@react-three/drei'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useTrackEvent } from '@/lib/analytics/hooks'
import type { ToolProps } from '../types'
import { calculatorInputSchema, type CalculatorInput, type CalculatorResult } from './schema'
import { config } from './tool.config'

// Componente Tooltip moderno
function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex ml-1.5">
      <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] text-gray-400 bg-gray-100 rounded-full cursor-help transition-all hover:bg-gray-600 hover:text-white">
        i
      </span>
      <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg whitespace-normal w-64 z-10 pointer-events-none">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></span>
      </span>
    </span>
  )
}

// Componente para visualizar STL en 3D
function StlViewer({ 
  geometry, 
  rotation
}: { 
  geometry: THREE.BufferGeometry
  rotation: [number, number, number]
}) {
  return (
    <Canvas 
      camera={{ position: [0, 0, 150], fov: 45 }} 
      style={{ height: '400px', background: '#f8fafc' }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Center>
          <group rotation={rotation}>
            {/* Pieza principal */}
            <mesh geometry={geometry} castShadow receiveShadow>
              <meshStandardMaterial 
                color="#3b82f6" 
                metalness={0.3} 
                roughness={0.4}
                flatShading={false}
              />
            </mesh>
          </group>
        </Center>
        
        {/* Plano de la cama de impresión */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial 
            color="#94a3b8" 
            transparent 
            opacity={0.15} 
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Grid helper */}
        <gridHelper args={[200, 20, '#cbd5e1', '#e2e8f0']} position={[0, -0.9, 0]} />
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          maxDistance={500}
          minDistance={10}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Suspense>
    </Canvas>
  )
}

export default function CalculadoraCostosImpresion({ onComplete, onError }: ToolProps) {
  const tracker = useTrackEvent()
  
  // State para inputs - vacíos hasta que se cargue un archivo del slicer
  const [inputs, setInputs] = useState<CalculatorInput>({
    pesoGramos: 0,
    precioKgFilamento: 0,
    porcentajeMerma: 0,
    horasImpresion: 0,
    consumoWatts: 0,
    precioKwh: 0,
    precioImpresora: 0,
    vidaUtilHoras: 0,
    margenGanancia: 0,
  })
  
  // State para resultado
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [slicerNotes, setSlicerNotes] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [printerName, setPrinterName] = useState<string>('')
  
  // State para STL
  const [cotizacionMode, setCotizacionMode] = useState<'gcode' | 'stl'>('gcode')
  const [stlGeometry, setStlGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [stlVolume, setStlVolume] = useState<number>(0)
  const [stlDimensions, setStlDimensions] = useState({ x: 0, y: 0, z: 0 })
  const [infillDensity, setInfillDensity] = useState<number>(20)
  const [layerHeight, setLayerHeight] = useState<number>(0.2)
  const [wallThickness, setWallThickness] = useState<number>(1.2)
  const [stlRotation, setStlRotation] = useState<[number, number, number]>([-Math.PI / 2, 0, 0])
  
  // State para exportación PDF
  const [showExportModal, setShowExportModal] = useState<boolean>(false)
  const [exportType, setExportType] = useState<'sencilla' | 'personalizada'>('sencilla')
  const [businessName, setBusinessName] = useState<string>('')
  const [businessLogo, setBusinessLogo] = useState<string>('')

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
      let objectCount = 0
      
      if (isGcodeContent) {
        console.log('📝 Procesando como GCODE - buscando comentarios')
        // Para .gcode buscar líneas con ;
        commentLines = lines.filter(line => line.trim().startsWith(';')).map(line => line.trim())
        
        // Detectar múltiples objetos
        const objectMarkers = commentLines.filter(line => 
          line.toLowerCase().includes('printing object') ||
          line.toLowerCase().includes('object id') ||
          line.toLowerCase().includes('mesh:') ||
          line.toLowerCase().includes('plate')
        )
        if (objectMarkers.length > 1) {
          objectCount = objectMarkers.length
        }
      } else {
        console.log('📋 Procesando como XML/Metadata - buscando información')
        // Para metadata/xml buscar cualquier línea que tenga información útil
        commentLines = lines.filter(line => {
          const l = line.toLowerCase()
          return (l.includes('weight') || l.includes('time') || l.includes('filament') || 
                  l.includes('material') || l.includes('print') || l.includes('duration') ||
                  l.includes('object') || l.includes('plate'))
        })
        
        // Detectar múltiples objetos en metadata
        const objectLines = text.match(/object|item|mesh/gi) || []
        if (objectLines.length > 5) {
          objectCount = Math.floor(objectLines.length / 5) // Aproximación
        }
      }
      
      console.log('💬 Líneas de información encontradas:', commentLines.length)
      if (objectCount > 0) {
        console.log('🔢 Múltiples objetos detectados:', objectCount)
      }
      
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
        
        // Agregar información sobre múltiples objetos si se detectaron
        let successMsg = `✅ Datos extraídos: ${extractedFields.join(', ')}`
        if (objectCount > 1) {
          successMsg += ` | Este archivo contiene ${objectCount} objetos/placas - los costos mostrados son para la impresión completa`
        }
        
        setErrors({ success: successMsg })
        tracker.toolExecuted(config.id, { action: isGcodeContent ? 'import_gcode_success' : 'import_3mf_success', fileName: file.name, objectCount })
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
   * Handler para archivo seleccionado (GCODE/3MF)
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
   * Handler para archivo STL
   */
  const handleStlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.stl')) {
      setErrors({ import: 'Por favor selecciona un archivo .stl' })
      return
    }
    
    setIsImporting(true)
    setErrors({})
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loader = new STLLoader()
      const geometry = loader.parse(arrayBuffer)
      
      // Calcular volumen y dimensiones
      geometry.computeBoundingBox()
      const bbox = geometry.boundingBox!
      const dimensions = {
        x: Math.abs(bbox.max.x - bbox.min.x),
        y: Math.abs(bbox.max.y - bbox.min.y),
        z: Math.abs(bbox.max.z - bbox.min.z)
      }
      
      // Calcular volumen aproximado del STL (en mm³)
      let volume = 0
      const position = geometry.attributes.position
      
      for (let i = 0; i < position.count; i += 3) {
        // Obtener vértices del triángulo
        const v1 = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i))
        const v2 = new THREE.Vector3(position.getX(i + 1), position.getY(i + 1), position.getZ(i + 1))
        const v3 = new THREE.Vector3(position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2))
        
        // Fórmula del volumen del tetraedro
        volume += v1.dot(v2.cross(v3)) / 6
      }
      
      volume = Math.abs(volume) // Asegurar valor positivo
      
      setStlGeometry(geometry)
      setStlVolume(volume)
      setStlDimensions(dimensions)
      
      // Orientar automáticamente
      setStlRotation([-Math.PI / 2, 0, 0])
      
      // Calcular peso estimado basado en volumen y densidad
      const volumeCm3 = volume / 1000 // Convertir mm³ a cm³
      const densityPLA = 1.25 // g/cm³
      
      // Calcular peso considerando el relleno
      const shellVolume = volumeCm3 * 0.3 // Aproximar 30% es perímetros
      const infillVolume = volumeCm3 * 0.7 * (infillDensity / 100) // 70% es interior con relleno
      const estimatedWeight = (shellVolume + infillVolume) * densityPLA
      
      setInputs(prev => ({ 
        ...prev, 
        pesoGramos: Math.round(estimatedWeight * 100) / 100
      }))
      
      setErrors({ success: `✅ STL cargado: ${dimensions.x.toFixed(1)}×${dimensions.y.toFixed(1)}×${dimensions.z.toFixed(1)}mm, Peso estimado: ${estimatedWeight.toFixed(2)}g` })
      
      tracker.toolExecuted(config.id, { action: 'import_stl_success', fileName: file.name })
    } catch (error) {
      console.error('Error loading STL:', error)
      setErrors({ import: 'Error al cargar el archivo STL. Verifica que sea un archivo válido.' })
    } finally {
      setIsImporting(false)
    }
  }

  /**
   * Recalcular peso cuando cambian parámetros de impresión STL
   */
  const recalculateStlWeight = () => {
    if (stlVolume === 0) return
    
    const volumeCm3 = stlVolume / 1000
    const densityPLA = 1.25
    
    const shellVolume = volumeCm3 * 0.3
    const infillVolume = volumeCm3 * 0.7 * (infillDensity / 100)
    const estimatedWeight = (shellVolume + infillVolume) * densityPLA
    
    setInputs(prev => ({ 
      ...prev, 
      pesoGramos: Math.round(estimatedWeight * 100) / 100
    }))
  }

  /**
   * Calcula la mejor orientación para el STL
   * Encuentra la cara con mayor área para colocar en la cama
   */
  const autoOrientStl = () => {
    if (!stlGeometry) return
    
    const geometry = stlGeometry.clone()
    geometry.computeBoundingBox()
    geometry.computeVertexNormals()
    
    const bbox = geometry.boundingBox!
    const center = new THREE.Vector3()
    bbox.getCenter(center)
    
    // Analizar las 6 orientaciones principales (±X, ±Y, ±Z)
    const orientations = [
      { axis: new THREE.Vector3(1, 0, 0), angle: 0, name: '+X' },
      { axis: new THREE.Vector3(1, 0, 0), angle: Math.PI, name: '-X' },
      { axis: new THREE.Vector3(0, 1, 0), angle: Math.PI / 2, name: '+Y' },
      { axis: new THREE.Vector3(0, 1, 0), angle: -Math.PI / 2, name: '-Y' },
      { axis: new THREE.Vector3(0, 0, 1), angle: 0, name: '+Z (arriba)' },
      { axis: new THREE.Vector3(0, 0, 1), angle: Math.PI, name: '-Z (abajo)' },
    ]
    
    let bestOrientation = { rotation: [-Math.PI / 2, 0, 0] as [number, number, number], score: 0, name: '' }
    
    // Evaluar cada orientación
    for (const orient of orientations) {
      const testGeometry = geometry.clone()
      
      // Rotar geometría
      const quaternion = new THREE.Quaternion()
      quaternion.setFromAxisAngle(orient.axis, orient.angle)
      testGeometry.applyQuaternion(quaternion)
      testGeometry.computeBoundingBox()
      
      const testBbox = testGeometry.boundingBox!
      
      // Score basado en: área de contacto (X*Y) y altura mínima (Z)
      const contactArea = Math.abs(testBbox.max.x - testBbox.min.x) * Math.abs(testBbox.max.y - testBbox.min.y)
      const height = Math.abs(testBbox.max.z - testBbox.min.z)
      
      // Preferir mayor área de contacto y menor altura (más estable)
      const score = contactArea / (height + 1)
      
      if (score > bestOrientation.score) {
        // Convertir quaternion a rotación Euler
        const euler = new THREE.Euler()
        euler.setFromQuaternion(quaternion)
        
        // Ajustar para que la pieza mire hacia arriba correctamente
        bestOrientation = {
          rotation: [-Math.PI / 2 + euler.x, euler.y, euler.z],
          score,
          name: orient.name
        }
      }
    }
    
    console.log('🔄 Mejor orientación encontrada:', bestOrientation.name, 'Score:', bestOrientation.score.toFixed(2))
    
    setStlRotation(bestOrientation.rotation)
    
    setErrors({ success: `✅ Pieza orientada automáticamente (${bestOrientation.name})` })
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

  /**
   * Handler para subir logo
   */
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setErrors({ import: 'Por favor selecciona una imagen válida' })
      return
    }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setBusinessLogo(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  /**
   * Generar PDF de cotización
   */
  const exportToPDF = () => {
    if (!result) return
    
    const doc = new jsPDF()
    const fecha = new Date().toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    let yPosition = 20
    
    // Si es cotización personalizada y hay logo
    if (exportType === 'personalizada' && businessLogo) {
      try {
        doc.addImage(businessLogo, 'PNG', 15, yPosition, 40, 40)
        yPosition += 45
      } catch (error) {
        console.error('Error al agregar logo:', error)
      }
    }
    
    // Título y nombre del negocio
    if (exportType === 'personalizada' && businessName) {
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(businessName, 15, yPosition)
      yPosition += 10
    }
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Cotización de Impresión 3D', 15, yPosition)
    yPosition += 7
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Fecha: ${fecha}`, 15, yPosition)
    yPosition += 15
    
    // Información de la pieza
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalles de la Pieza:', 15, yPosition)
    yPosition += 7
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const details = [
      `Peso del objeto: ${result.breakdown.pesoUsado}g`,
      `Peso con merma (${result.breakdown.porcentajeMerma}%): ${result.breakdown.pesoReal.toFixed(2)}g`,
      `Tiempo de impresión: ${inputs.horasImpresion}h`,
    ]
    
    if (stlDimensions.x > 0) {
      details.push(`Dimensiones: ${stlDimensions.x.toFixed(1)} × ${stlDimensions.y.toFixed(1)} × ${stlDimensions.z.toFixed(1)} mm`)
    }
    
    details.forEach(detail => {
      doc.text(detail, 15, yPosition)
      yPosition += 5
    })
    
    yPosition += 5
    
    // Tabla de costos
    autoTable(doc, {
      startY: yPosition,
      head: [['Concepto', 'Costo']],
      body: [
        ['Material', `$${result.costos.material.toFixed(2)} MXN`],
        ['Energía', `$${result.costos.energia.toFixed(2)} MXN`],
        ['Depreciación de máquina', `$${result.costos.depreciacion.toFixed(2)} MXN`],
        ['', ''],
        ['COSTO TOTAL', `$${result.costos.total.toFixed(2)} MXN`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.row.index === 4) {
          data.cell.styles.fillColor = [239, 246, 255]
          data.cell.styles.fontSize = 12
          data.cell.styles.fontStyle = 'bold'
        }
      }
    })
    
    // @ts-ignore - autoTable agrega la propiedad lastAutoTable
    yPosition = doc.lastAutoTable.finalY + 10
    
    // Si hay margen de ganancia
    if (inputs.margenGanancia > 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(59, 130, 246)
      doc.text(`PRECIO CON MARGEN (${inputs.margenGanancia}%):`, 15, yPosition)
      
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text(`$${result.conMargen.toFixed(2)} MXN`, 15, yPosition + 8)
      yPosition += 20
    }
    
    // Desglose adicional
    yPosition += 5
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text('Desglose:', 15, yPosition)
    yPosition += 5
    
    const breakdown = [
      `Costo por gramo: $${result.breakdown.costoGramo.toFixed(2)} MXN`,
      `Energía consumida: ${result.breakdown.energiaKwh.toFixed(2)} kWh`,
    ]
    
    doc.setFontSize(8)
    breakdown.forEach(item => {
      doc.text(item, 15, yPosition)
      yPosition += 4
    })
    
    // Pie de página
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Cotización generada con DoferLabs', 15, pageHeight - 10)
    
    // Guardar PDF
    const fileName = exportType === 'personalizada' && businessName
      ? `Cotizacion_${businessName.replace(/\s+/g, '_')}_${Date.now()}.pdf`
      : `Cotizacion_Impresion3D_${Date.now()}.pdf`
    
    doc.save(fileName)
    
    // Track export
    tracker.resultExported(config.id, 'pdf')
    
    setShowExportModal(false)
    setErrors({ success: '✅ PDF exportado exitosamente' })
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-4xl">{config.icon}</div>
        <h1 className="text-3xl font-bold">{config.name}</h1>
        <p className="text-gray-600">{config.description}</p>
      </div>

      {/* Tabs para seleccionar modo de cotización */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setCotizacionMode('gcode')
            setStlGeometry(null)
            setErrors({})
          }}
          className={`px-6 py-3 font-medium transition-all border-b-2 ${
            cotizacionMode === 'gcode'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📦 GCODE / 3MF
        </button>
        <button
          onClick={() => {
            setCotizacionMode('stl')
            setPreviewImage('')
            setErrors({})
          }}
          className={`px-6 py-3 font-medium transition-all border-b-2 ${
            cotizacionMode === 'stl'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🔷 Archivo STL
        </button>
      </div>

      {/* Form de inputs */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">
          {cotizacionMode === 'gcode' ? 'Importar desde Slicer' : 'Cotizar desde STL'}
        </h2>
        
        {/* Modo GCODE/3MF */}
        {cotizacionMode === 'gcode' && (
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
        )}

        {/* Modo STL */}
        {cotizacionMode === 'stl' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-dashed border-blue-300">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Cargar archivo STL</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Sube tu archivo <strong>.stl</strong> y calcularemos el peso estimado
                  </p>
                  
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                    <span>{isImporting ? 'Cargando...' : 'Elegir archivo STL'}</span>
                    <input
                      type="file"
                      accept=".stl,.STL"
                      onChange={handleStlUpload}
                      disabled={isImporting}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {/* Advertencia importante */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 text-xl flex-shrink-0">⚠️</span>
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Importante:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Asegúrate de que el STL tenga la <strong>escala correcta</strong> (en mm)</li>
                        <li>Verifica que la <strong>orientación</strong> sea la adecuada para imprimir</li>
                        <li>Los cálculos son estimaciones basadas en el volumen del modelo</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Vista previa 3D del STL */}
                {stlGeometry && (
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg border-2 border-blue-300 overflow-hidden">
                      <StlViewer 
                        geometry={stlGeometry} 
                        rotation={stlRotation}
                      />
                    </div>
                    
                    {/* Controles de orientación */}
                    <button
                      onClick={autoOrientStl}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md transition-all shadow-sm"
                    >
                      🔄 Auto-orientar pieza
                    </button>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <p className="text-xs text-gray-600">Ancho (X)</p>
                        <p className="font-bold text-blue-600">{stlDimensions.x.toFixed(1)} mm</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <p className="text-xs text-gray-600">Largo (Y)</p>
                        <p className="font-bold text-blue-600">{stlDimensions.y.toFixed(1)} mm</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-200">
                        <p className="text-xs text-gray-600">Alto (Z)</p>
                        <p className="font-bold text-blue-600">{stlDimensions.z.toFixed(1)} mm</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Configuración de impresión para STL */}
            {stlGeometry && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900 mb-2">⚙️ Configuración de impresión</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Densidad de relleno (%)
                      <InfoTooltip text="Porcentaje de material en el interior. 20% es estándar para piezas normales." />
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={infillDensity}
                      onChange={(e) => {
                        setInfillDensity(parseInt(e.target.value))
                        setTimeout(() => recalculateStlWeight(), 100)
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>0%</span>
                      <span className="font-bold text-blue-600">{infillDensity}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Altura de capa (mm)
                      <InfoTooltip text="Grosor de cada capa. 0.2mm es estándar. Menor = mejor calidad pero más tiempo." />
                    </label>
                    <select
                      value={layerHeight}
                      onChange={(e) => setLayerHeight(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="0.1">0.1mm (Alta calidad)</option>
                      <option value="0.15">0.15mm</option>
                      <option value="0.2">0.2mm (Estándar)</option>
                      <option value="0.25">0.25mm</option>
                      <option value="0.3">0.3mm (Rápido)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Grosor de pared (mm)
                    <InfoTooltip text="Espesor del perímetro exterior. 1.2mm (3 líneas) es estándar." />
                  </label>
                  <select
                    value={wallThickness}
                    onChange={(e) => setWallThickness(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0.8">0.8mm (2 líneas)</option>
                    <option value="1.2">1.2mm (3 líneas)</option>
                    <option value="1.6">1.6mm (4 líneas)</option>
                    <option value="2.0">2.0mm (5 líneas)</option>
                  </select>
                </div>
                
                <button
                  onClick={recalculateStlWeight}
                  className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-md transition-colors"
                >
                  🔄 Recalcular peso con esta configuración
                </button>
              </div>
            )}
          </div>
        )}
        
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
            <InfoTooltip text="Peso neto del objeto impreso sin soportes. Lo puedes obtener del slicer o pesando la pieza." />
          </label>
          <input
            key={`peso-${inputs.pesoGramos}`}
            type="number"
            value={inputs.pesoGramos}
            onChange={(e) => handleInputChange('pesoGramos', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 250"
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            min="0.1"
            step="0.1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Precio por kg (MXN)
              <InfoTooltip text="Precio por kilogramo del filamento o resina que usas. Ejemplo: PLA ~$520 MXN/kg, ABS ~$580 MXN/kg" />
            </label>
            <input
              type="number"
              value={inputs.precioKgFilamento}
              onChange={(e) => handleInputChange('precioKgFilamento', parseFloat(e.target.value) || 0)}
              placeholder="Ej: 520"
              className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              min="1"
              step="10"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Precio por gramo (MXN)
              <InfoTooltip text="Es el precio por kg dividido entre 1000. Se calcula automáticamente cuando ingresas el precio por kg." />
            </label>
            <input
              type="number"
              value={(inputs.precioKgFilamento / 1000).toFixed(2)}
              onChange={(e) => {
                const precioGramo = parseFloat(e.target.value) || 0
                handleInputChange('precioKgFilamento', precioGramo * 1000)
              }}
              placeholder="Ej: 0.52"
              className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              min="0.01"
              step="0.1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Merma/Soportes (%)
            <InfoTooltip text="Porcentaje adicional de material usado en soportes, brim, purgas y desperdicio. FDM típico: 10%, MSLA típico: 30%" />
          </label>
          <input
            type="number"
            value={inputs.porcentajeMerma}
            onChange={(e) => handleInputChange('porcentajeMerma', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 10"
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
            <InfoTooltip text="Duración total de la impresión en horas. Lo obtienes del slicer antes de imprimir. Ejemplo: 9.5 horas = 9h 30min" />
          </label>
          <input
            key={`tiempo-${inputs.horasImpresion}`}
            type="number"
            value={inputs.horasImpresion}
            onChange={(e) => handleInputChange('horasImpresion', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 9.5"
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
                <InfoTooltip text="Consumo eléctrico promedio de tu impresora durante la impresión. Ender 3: ~200W, Bambu Lab A1: ~350W, Prusa i3: ~120W" />
              </label>
              <input
                type="number"
                value={inputs.consumoWatts}
                onChange={(e) => handleInputChange('consumoWatts', parseFloat(e.target.value) || 0)}
                placeholder="Ej: 350"
                className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tarifa CFE (MXN/kWh)
                <InfoTooltip text="Costo de electricidad por kilowatt-hora. Tarifa doméstica CFE México: ~$2.5 MXN/kWh (varía por región y consumo)" />
              </label>
              <input
                type="number"
                value={inputs.precioKwh}
                onChange={(e) => handleInputChange('precioKwh', parseFloat(e.target.value) || 0)}
                placeholder="Ej: 2.5"
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
                <InfoTooltip text="Costo de compra de tu impresora 3D. Se usa para calcular depreciación. Ejemplo: Ender 3 ~$5,000, Bambu Lab A1 ~$11,000" />
              </label>
              <input
                type="number"
                value={inputs.precioImpresora}
                onChange={(e) => handleInputChange('precioImpresora', parseFloat(e.target.value) || 0)}
                placeholder="Ej: 10999"
                className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                min="0"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Vida útil (horas)
                <InfoTooltip text="Horas estimadas de uso de la impresora antes de necesitar reemplazo o reparación mayor. Típico: 2000-5000 horas" />
              </label>
              <input
                type="number"
                value={inputs.vidaUtilHoras}
                onChange={(e) => handleInputChange('vidaUtilHoras', parseFloat(e.target.value) || 0)}
                placeholder="Ej: 2000"
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
            <InfoTooltip text="Porcentaje de ganancia sobre el costo total. Recomendado 25-40% para piezas estándar. Ajusta según complejidad y tiempo de diseño." />
          </label>
          <input
            type="number"
            value={inputs.margenGanancia}
            onChange={(e) => handleInputChange('margenGanancia', parseFloat(e.target.value) || 0)}
            placeholder="Ej: 30"
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
                onClick={() => setShowExportModal(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                📄 Exportar Cotización
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Exportar Cotización</h3>
            
            {/* Tipo de cotización */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de cotización
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportType('sencilla')}
                  className={`py-2 px-4 rounded-md font-medium transition-all ${
                    exportType === 'sencilla'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📋 Sencilla
                </button>
                <button
                  onClick={() => setExportType('personalizada')}
                  className={`py-2 px-4 rounded-md font-medium transition-all ${
                    exportType === 'personalizada'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⭐ Personalizada
                </button>
              </div>
            </div>
            
            {/* Opciones de personalización */}
            {exportType === 'personalizada' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre del negocio
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej: Mi Taller de Impresión 3D"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Logo del negocio (opcional)
                  </label>
                  {businessLogo ? (
                    <div className="space-y-2">
                      <img 
                        src={businessLogo} 
                        alt="Logo" 
                        className="h-20 w-auto object-contain border border-gray-300 rounded p-2 bg-white"
                      />
                      <button
                        onClick={() => setBusinessLogo('')}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        🗑️ Eliminar logo
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-500 transition-colors">
                        <p className="text-sm text-gray-600">Haz clic para subir logo</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG (máx. 2MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}
            
            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={exportToPDF}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                📥 Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
