'use client'

import { useState, Suspense, useEffect } from 'react'
import JSZip from 'jszip'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Center } from '@react-three/drei'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useToolTracking } from '@/lib/analytics/hooks'
import { validateFile, ALLOWED_EXTENSIONS } from '@/lib/security/file-validation'
import type { ToolProps } from '../types'
import { calculatorInputSchema, type CalculatorInput, type CalculatorResult } from './schema'
import { config } from './tool.config'

// Base de datos de consumo de energía por impresora (en Watts promedio para PLA)
// Fuente: Bambu Lab Wiki y mediciones de la comunidad
const PRINTER_POWER_DATABASE: Record<string, { watts: number; brand: string; fullName: string }> = {
  // Bambu Lab
  'p1s': { watts: 105, brand: 'Bambu Lab', fullName: 'Bambu Lab P1S' },
  'p1p': { watts: 110, brand: 'Bambu Lab', fullName: 'Bambu Lab P1P' },
  'p2s': { watts: 200, brand: 'Bambu Lab', fullName: 'Bambu Lab P2S' },
  'x1': { watts: 105, brand: 'Bambu Lab', fullName: 'Bambu Lab X1' },
  'x1c': { watts: 105, brand: 'Bambu Lab', fullName: 'Bambu Lab X1 Carbon' },
  'x1e': { watts: 185, brand: 'Bambu Lab', fullName: 'Bambu Lab X1E' },
  'a1': { watts: 95, brand: 'Bambu Lab', fullName: 'Bambu Lab A1' },
  'a1 mini': { watts: 80, brand: 'Bambu Lab', fullName: 'Bambu Lab A1 Mini' },
  'a1mini': { watts: 80, brand: 'Bambu Lab', fullName: 'Bambu Lab A1 Mini' },
  'h2s': { watts: 200, brand: 'Bambu Lab', fullName: 'Bambu Lab H2S' },
  'h2d': { watts: 197, brand: 'Bambu Lab', fullName: 'Bambu Lab H2D' },
  'h2c': { watts: 200, brand: 'Bambu Lab', fullName: 'Bambu Lab H2C' },
  // Creality
  'ender 3': { watts: 270, brand: 'Creality', fullName: 'Creality Ender 3' },
  'ender 3 v2': { watts: 270, brand: 'Creality', fullName: 'Creality Ender 3 V2' },
  'ender 3 v3': { watts: 350, brand: 'Creality', fullName: 'Creality Ender 3 V3' },
  'ender 3 s1': { watts: 300, brand: 'Creality', fullName: 'Creality Ender 3 S1' },
  'ender 3 pro': { watts: 270, brand: 'Creality', fullName: 'Creality Ender 3 Pro' },
  'ender 5': { watts: 350, brand: 'Creality', fullName: 'Creality Ender 5' },
  'cr-10': { watts: 400, brand: 'Creality', fullName: 'Creality CR-10' },
  'k1': { watts: 350, brand: 'Creality', fullName: 'Creality K1' },
  'k1 max': { watts: 450, brand: 'Creality', fullName: 'Creality K1 Max' },
  'k1c': { watts: 350, brand: 'Creality', fullName: 'Creality K1C' },
  'k2 plus': { watts: 500, brand: 'Creality', fullName: 'Creality K2 Plus' },
  // Prusa
  'prusa mk3': { watts: 120, brand: 'Prusa', fullName: 'Prusa MK3' },
  'prusa mk3s': { watts: 120, brand: 'Prusa', fullName: 'Prusa MK3S+' },
  'prusa mk4': { watts: 150, brand: 'Prusa', fullName: 'Prusa MK4' },
  'prusa mini': { watts: 100, brand: 'Prusa', fullName: 'Prusa Mini' },
  'prusa xl': { watts: 250, brand: 'Prusa', fullName: 'Prusa XL' },
  'prusa core one': { watts: 150, brand: 'Prusa', fullName: 'Prusa Core One' },
  // Anycubic
  'kobra': { watts: 350, brand: 'Anycubic', fullName: 'Anycubic Kobra' },
  'kobra 2': { watts: 400, brand: 'Anycubic', fullName: 'Anycubic Kobra 2' },
  'kobra 3': { watts: 450, brand: 'Anycubic', fullName: 'Anycubic Kobra 3' },
  'vyper': { watts: 350, brand: 'Anycubic', fullName: 'Anycubic Vyper' },
  // Elegoo
  'neptune 3': { watts: 350, brand: 'Elegoo', fullName: 'Elegoo Neptune 3' },
  'neptune 4': { watts: 450, brand: 'Elegoo', fullName: 'Elegoo Neptune 4' },
  'neptune 4 pro': { watts: 500, brand: 'Elegoo', fullName: 'Elegoo Neptune 4 Pro' },
  // Voron (DIY)
  'voron 0': { watts: 150, brand: 'Voron', fullName: 'Voron 0.2' },
  'voron 2.4': { watts: 400, brand: 'Voron', fullName: 'Voron 2.4' },
  'voron trident': { watts: 350, brand: 'Voron', fullName: 'Voron Trident' },
  // Artillery
  'sidewinder': { watts: 400, brand: 'Artillery', fullName: 'Artillery Sidewinder' },
  'genius': { watts: 300, brand: 'Artillery', fullName: 'Artillery Genius' },
  // Flashforge
  'adventurer': { watts: 200, brand: 'Flashforge', fullName: 'Flashforge Adventurer' },
  'creator': { watts: 300, brand: 'Flashforge', fullName: 'Flashforge Creator' },
  // Genéricos por tipo
  'i3': { watts: 250, brand: 'Generic', fullName: 'Impresora tipo i3' },
  'corexy': { watts: 350, brand: 'Generic', fullName: 'Impresora CoreXY' },
  'delta': { watts: 300, brand: 'Generic', fullName: 'Impresora Delta' },
}

// Función para buscar consumo de impresora
function findPrinterPower(printerName: string): { watts: number; fullName: string } | null {
  const normalizedName = printerName.toLowerCase().trim()
  
  // Búsqueda exacta primero
  if (PRINTER_POWER_DATABASE[normalizedName]) {
    return PRINTER_POWER_DATABASE[normalizedName]
  }
  
  // Búsqueda parcial
  for (const [key, data] of Object.entries(PRINTER_POWER_DATABASE)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return data
    }
  }
  
  // Búsqueda por palabras clave de marca
  const brandPatterns: [RegExp, string][] = [
    [/bambu|bbl/i, 'a1'], // Por defecto para Bambu
    [/creality|ender/i, 'ender 3'],
    [/prusa/i, 'prusa mk4'],
    [/anycubic|kobra/i, 'kobra 2'],
    [/elegoo|neptune/i, 'neptune 4'],
    [/voron/i, 'voron 2.4'],
    [/artillery/i, 'sidewinder'],
  ]
  
  for (const [pattern, defaultKey] of brandPatterns) {
    if (pattern.test(normalizedName)) {
      return PRINTER_POWER_DATABASE[defaultKey]
    }
  }
  
  return null
}

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

// Componente para visualizar modelo 3MF en 3D
function ThreeMFViewer({ 
  group, 
  rotation
}: { 
  group: THREE.Group
  rotation: [number, number, number]
}) {
  return (
    <Canvas 
      camera={{ position: [0, 0, 200], fov: 45 }} 
      style={{ height: '400px', background: '#f8fafc' }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <directionalLight position={[0, 10, 0]} intensity={0.3} />
        
        <Center>
          <group rotation={rotation}>
            <primitive object={group.clone()} />
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
  const { trackExecution, trackResult, trackExport, trackError, trackCustom } = useToolTracking(config.id)
  
  // State para inputs - vacíos hasta que se cargue un archivo del slicer
  const [inputs, setInputs] = useState<CalculatorInput>({
    pesoGramos: 0,
    precioKgFilamento: 0,
    porcentajeMerma: 0,
    horasImpresion: 0,
    consumoWatts: 0,
    precioKwh: 2.5,
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
  
  // State para STL y 3MF
  const [cotizacionMode, setCotizacionMode] = useState<'gcode' | 'stl'>('gcode')
  const [stlGeometry, setStlGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [threeMFGroup, setThreeMFGroup] = useState<THREE.Group | null>(null)
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
  const [clientName, setClientName] = useState<string>('')

  /**
   * Parsea archivos de slicer (.gcode o .3mf) para extraer datos
   */
  const parseSlicerFile = async (file: File) => {
    setIsImporting(true)
    setErrors({})
    setSlicerNotes('')
    setPreviewImage('')
    setPrinterName('')
    setThreeMFGroup(null) // Limpiar modelo 3MF anterior
    
    // Track inicio de importación
    const fileExtension = file.name.toLowerCase().split('.').pop() || 'unknown'
    trackCustom('opened', {
      fileType: fileExtension,
      fileSize: file.size,
    })
    
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
          let bestPreview: { name: string; size: number; blob?: Blob } | null = null
          
          for (const [fileName, zipFile] of Object.entries(zip.files)) {
            if (!zipFile.dir) {
              console.log('📄 Leyendo archivo interno:', fileName)
              
              // Extraer la MEJOR imagen preview (la más grande)
              // Bambu Studio guarda: Metadata/plate_1.png, Metadata/top_1.png, etc.
              if (fileName.toLowerCase().endsWith('.png') || 
                  fileName.toLowerCase().endsWith('.jpg') ||
                  fileName.toLowerCase().endsWith('.jpeg')) {
                try {
                  const blob = await zipFile.async('blob')
                  console.log('🖼️ Imagen encontrada:', fileName, 'tamaño:', blob.size)
                  
                  // Guardar la imagen más grande (mejor calidad)
                  if (!bestPreview || blob.size > bestPreview.size) {
                    bestPreview = { name: fileName, size: blob.size, blob }
                  }
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
                  fileName.toLowerCase().endsWith('.xml') ||
                  fileName.includes('Metadata') || fileName.includes('3D/')) {
                metadata += content + '\n'
              }
            }
          }
          
          // Usar la mejor imagen de preview
          if (bestPreview?.blob) {
            const imageUrl = URL.createObjectURL(bestPreview.blob)
            setPreviewImage(imageUrl)
            console.log('🖼️ Usando mejor preview:', bestPreview.name, 'tamaño:', bestPreview.size)
          }
          
          // Si no encontramos gcode, usar metadata
          if (!text) {
            text = metadata
          }
          
          // Cargar modelo 3D del archivo 3MF para visualización
          try {
            console.log('🎨 Intentando cargar modelo 3D del archivo 3MF...')
            const loader = new ThreeMFLoader()
            const arrayBuffer = await file.arrayBuffer()
            console.log('🎨 ArrayBuffer listo, tamaño:', arrayBuffer.byteLength)
            const group = loader.parse(arrayBuffer)
            console.log('🎨 Resultado del parse:', group, 'children:', group?.children?.length)
            
            if (group && group.children.length > 0) {
              // Centrar y escalar el modelo
              const box = new THREE.Box3().setFromObject(group)
              const center = box.getCenter(new THREE.Vector3())
              const size = box.getSize(new THREE.Vector3())
              
              group.position.sub(center)
              
              // Guardar dimensiones
              setStlDimensions({ 
                x: Math.round(size.x * 100) / 100, 
                y: Math.round(size.y * 100) / 100, 
                z: Math.round(size.z * 100) / 100 
              })
              
              // Calcular volumen aproximado
              let totalVolume = 0
              group.traverse((child) => {
                if (child instanceof THREE.Mesh && child.geometry) {
                  const geo = child.geometry
                  if (!geo.index) {
                    geo.computeBoundingBox()
                    const geoBox = geo.boundingBox
                    if (geoBox) {
                      const geoSize = geoBox.getSize(new THREE.Vector3())
                      totalVolume += geoSize.x * geoSize.y * geoSize.z * 0.3 // Aproximación
                    }
                  }
                }
              })
              
              setThreeMFGroup(group)
              setStlVolume(Math.round(totalVolume * 100) / 100)
              console.log('🎨 Modelo 3MF cargado para visualización, meshes:', group.children.length)
            }
          } catch (loadError) {
            console.warn('⚠️ No se pudo cargar modelo 3D del 3MF:', loadError)
            // No es crítico, continuamos sin visualización 3D
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
      
      // ========================================
      // EXTRAER NOMBRE DE IMPRESORA Y CONSUMO
      // ========================================
      let detectedPrinter = ''
      let detectedPowerWatts = 0
      
      // Patrones específicos por slicer
      const printerPatterns = [
        // Bambu Studio: "; printer_model = Bambu Lab P1S 0.4mm Nozzle" o "; printer_model = P1S-0.4"
        /;\s*printer_model\s*[=:]\s*(.+)/i,
        // Bambu Studio alternativo: "; printer_settings_id = Bambu Lab P1S"
        /;\s*printer_settings_id\s*[=:]\s*(.+)/i,
        // Cura: "; Machine name: Creality Ender 3"
        /;\s*machine[\s_]?name\s*[=:]\s*(.+)/i,
        // PrusaSlicer: "; printer_type = MK4"
        /;\s*printer_type\s*[=:]\s*(.+)/i,
        // Genérico: "; printer = X"
        /;\s*printer\s*[=:]\s*(.+)/i,
      ]
      
      for (const pattern of printerPatterns) {
        if (detectedPrinter) break
        for (const line of commentLines) {
          const match = line.match(pattern)
          if (match) {
            const rawPrinter = match[1].trim()
              .replace(/;.*$/, '') // Quitar comentarios al final
              .replace(/\s+nozzle.*$/i, '') // Quitar info de nozzle
              .replace(/\s+\d+\.?\d*\s*mm.*$/i, '') // Quitar tamaño de nozzle
              .trim()
            
            if (rawPrinter.length > 1 && rawPrinter.length < 60) {
              detectedPrinter = rawPrinter
              console.log('🖨️ Impresora detectada:', detectedPrinter)
              
              // Buscar consumo en base de datos
              const powerInfo = findPrinterPower(detectedPrinter)
              if (powerInfo) {
                detectedPowerWatts = powerInfo.watts
                detectedPrinter = powerInfo.fullName // Usar nombre completo
                console.log('⚡ Consumo encontrado:', detectedPowerWatts, 'W para', powerInfo.fullName)
              }
              break
            }
          }
        }
      }
      
      // Si no encontramos impresora, buscar patrones en nombres de archivo o metadata
      if (!detectedPrinter) {
        const textLower = text.toLowerCase()
        const brandPatterns: [RegExp, string, string][] = [
          [/bambu|bbl|p1s|p1p|x1c|x1e|a1(?:\s|mini)/i, 'Bambu Lab', 'p1s'],
          [/ender|creality|k1|cr-10/i, 'Creality', 'ender 3'],
          [/prusa|mk[34]s?|mini/i, 'Prusa', 'prusa mk4'],
          [/anycubic|kobra|vyper/i, 'Anycubic', 'kobra 2'],
          [/elegoo|neptune/i, 'Elegoo', 'neptune 4'],
          [/voron/i, 'Voron', 'voron 2.4'],
        ]
        
        for (const [pattern, brand, defaultModel] of brandPatterns) {
          if (pattern.test(textLower) || pattern.test(file.name)) {
            const powerInfo = PRINTER_POWER_DATABASE[defaultModel]
            if (powerInfo) {
              detectedPrinter = `${brand} (detectado)`
              detectedPowerWatts = powerInfo.watts
              console.log('🖨️ Marca detectada:', brand, '- usando consumo por defecto:', detectedPowerWatts, 'W')
            }
            break
          }
        }
      }
      
      // Actualizar state de impresora
      if (detectedPrinter) {
        setPrinterName(detectedPrinter)
      }
      
      // ========================================
      // BUSCAR PESO - Orden de prioridad mejorado
      // ========================================
      
      // DEBUG: Buscar líneas con "filament" para ver qué hay
      const filamentLines = commentLines.filter(l => l.toLowerCase().includes('filament'))
      console.log('🔍 Líneas con "filament":', filamentLines.slice(0, 15))
      
      // DEBUG: Mostrar TODAS las líneas de comentarios para análisis
      console.log('📋 Total de líneas de comentarios:', commentLines.length)
      console.log('📋 Primeras 30 líneas:', commentLines.slice(0, 30))
      
      // BAMBU STUDIO ESPECÍFICO: Buscar "total filament length [mm]" con valores separados por coma
      // Este es el formato más común en archivos de Bambu Studio
      for (const line of commentLines) {
        if (extractedData.pesoGramos) break
        
        // Buscar la línea específica de Bambu Studio - varios formatos posibles
        // Formato 1: "; total filament length [mm] : 1772.28,45168.67"
        // Formato 2: ";total filament length [mm] = 46940"
        const bambuMatch = line.match(/total\s+filament\s+length\s*\[mm\]\s*[=:]\s*([\d.,\s]+)/i)
        if (bambuMatch) {
          console.log('🎯 Línea Bambu Studio encontrada:', line)
          const valuesStr = bambuMatch[1]
          const values = valuesStr.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v) && v > 0)
          console.log('🎯 Valores de longitud parseados:', values)
          
          if (values.length > 0) {
            const totalLengthMm = values.reduce((sum, v) => sum + v, 0)
            console.log('🎯 Longitud total:', totalLengthMm, 'mm =', totalLengthMm / 1000, 'm')
            
            // Calcular peso
            const filamentDiameter = 1.75
            const radius = filamentDiameter / 2
            const volumeMm3 = totalLengthMm * Math.PI * Math.pow(radius, 2)
            const volumeCm3 = volumeMm3 / 1000
            const densityPLA = 1.24
            extractedData.pesoGramos = Math.round(volumeCm3 * densityPLA * 100) / 100
            console.log('✅ Peso CALCULADO desde Bambu Studio:', extractedData.pesoGramos, 'g')
          }
        }
      }
      
      // BAMBU STUDIO: También buscar peso directo en gramos
      if (!extractedData.pesoGramos) {
        for (const line of commentLines) {
          // Formato: "; filament used [g] = 108.09,38.42" o "; total filament weight [g] = 148.61"
          const weightMatch = line.match(/filament\s+(?:used|weight)\s*\[g\]\s*[=:]\s*([\d.,\s]+)/i)
          if (weightMatch) {
            console.log('🎯 Línea de peso en gramos encontrada:', line)
            const valuesStr = weightMatch[1]
            const values = valuesStr.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v) && v > 0)
            if (values.length > 0) {
              extractedData.pesoGramos = Math.round(values.reduce((sum, v) => sum + v, 0) * 100) / 100
              console.log('✅ Peso DIRECTO desde Bambu Studio [g]:', extractedData.pesoGramos, 'g')
              break
            }
          }
        }
      }
      
      // 1. PRIMERO: Buscar peso DIRECTO en gramos de Bambu Studio/PrusaSlicer/Cura
      // Estos son los formatos más confiables
      if (!extractedData.pesoGramos) {
        const directWeightPatterns = [
          // Bambu Studio: "; filament used [g] = 148.61" o "; total filament used [g] = 148.61"
          // También manejar múltiples valores: "; filament used [g] = 108.09,38.42"
          /;\s*(?:total\s+)?filament\s+(?:used|weight)\s*\[g\]\s*[=:]\s*([\d.,]+)/i,
          // PrusaSlicer: "; filament used [g] = 148.61"
          /filament\s+used\s*\[g\]\s*[=:]\s*([\d.,]+)/i,
          // Formato general con unidad explícita: "filament_weight = 148.61g"
          /filament[_\s]*weight\s*[=:]\s*(\d+\.?\d*)\s*g/i,
          // Cura: ";Filament weight = 148.61 g"
          /filament\s+weight\s*[=:]\s*(\d+\.?\d*)\s*g/i,
          // SuperSlicer/Slic3r: "; total filament cost = X.XX" seguido de peso
          /;\s*filament\s+used\s*=\s*(\d+\.?\d*)g/i,
          // Formato: "total weight: 148.61 g"
          /total\s+weight\s*[=:]\s*(\d+\.?\d*)\s*g/i,
        ]
        
        for (const pattern of directWeightPatterns) {
          if (extractedData.pesoGramos) break
          for (const line of commentLines) {
            const match = line.match(pattern)
            if (match) {
              // Manejar múltiples valores separados por coma
              const valueStr = match[1]
              const values = valueStr.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v) && v > 0)
              const totalValue = values.reduce((sum, v) => sum + v, 0)
              
              if (totalValue >= 0.1 && totalValue <= 10000) {
                extractedData.pesoGramos = Math.round(totalValue * 100) / 100
                console.log('✅ Peso DIRECTO encontrado:', extractedData.pesoGramos, 'g (valores:', values.join('+'), ') en:', line.substring(0, 80))
                break
              }
            }
          }
        }
      }
      
      // 2. SEGUNDO: Buscar en todo el texto con patrones más generales
      if (!extractedData.pesoGramos) {
        for (const line of commentLines) {
          const lowerLine = line.toLowerCase()
          // Solo buscar en líneas que mencionen filament/material + peso
          if ((lowerLine.includes('filament') || lowerLine.includes('material')) && 
              (lowerLine.includes('weight') || lowerLine.includes('used') || lowerLine.includes('total'))) {
            // Buscar número seguido de g/gr/gram con contexto
            const match = line.match(/[=:]\s*(\d+\.?\d*)\s*(?:g|gr)(?:ams?)?(?:\s|,|;|$)/i)
            if (match) {
              const value = parseFloat(match[1])
              if (value >= 0.1 && value <= 5000) {
                extractedData.pesoGramos = Math.round(value * 100) / 100
                console.log('✅ Peso encontrado (patrón general):', extractedData.pesoGramos, 'g')
                break
              }
            }
          }
        }
      }
      
      // 3. TERCERO: Calcular desde LONGITUD de filamento (Bambu Studio y otros)
      // Solo si no encontramos peso directo
      if (!extractedData.pesoGramos) {
        console.log('🔍 Buscando longitud de filamento...')
        
        // Buscar longitud total de filamento - manejar múltiples valores separados por coma
        for (const line of commentLines) {
          if (extractedData.pesoGramos) break
          const lowerLine = line.toLowerCase()
          
          // Debug: mostrar líneas que contienen "length" o "filament"
          if (lowerLine.includes('length') && lowerLine.includes('filament')) {
            console.log('📏 Línea de longitud encontrada:', line)
          }
          
          // Buscar líneas con "filament" + "length" (en cualquier orden) y "mm" o "[mm]"
          if (lowerLine.includes('filament') && lowerLine.includes('length') &&
              (lowerLine.includes('mm') || lowerLine.includes('[m]'))) {
            
            // Extraer todos los números después de = o :
            const valuesPart = line.split(/[=:]/)[1]
            if (valuesPart) {
              console.log('🔢 Parseando valores de longitud:', valuesPart)
              
              // Separar por comas y parsear cada número
              const parts = valuesPart.split(',')
              let totalLengthMm = 0
              const parsedValues: number[] = []
              const isMeters = lowerLine.includes('[m]') && !lowerLine.includes('[mm]')
              
              for (const part of parts) {
                // Extraer el número de cada parte (manejar formatos como "1772.28" o " 45168.67")
                const numMatch = part.match(/(\d+\.?\d*)/)
                if (numMatch) {
                  let value = parseFloat(numMatch[1])
                  if (isNaN(value)) continue
                  
                  // Convertir metros a mm si es necesario
                  if (isMeters) {
                    value = value * 1000
                  }
                  
                  // Solo aceptar valores razonables
                  if (value > 0 && value < 1000000) {
                    totalLengthMm += value
                    parsedValues.push(value)
                  }
                }
              }
              
              console.log('🔢 Valores parseados:', parsedValues, 'Total:', totalLengthMm, 'mm')
              
              if (totalLengthMm > 100) {
                // Calcular peso: Volumen = longitud × π × (radio)²
                const filamentDiameter = 1.75 // mm estándar
                const radius = filamentDiameter / 2
                const volumeMm3 = totalLengthMm * Math.PI * Math.pow(radius, 2)
                const volumeCm3 = volumeMm3 / 1000
                const densityPLA = 1.24 // g/cm³
                extractedData.pesoGramos = Math.round(volumeCm3 * densityPLA * 100) / 100
                console.log('✅ Peso CALCULADO desde longitud:', extractedData.pesoGramos, 'g (longitud total:', totalLengthMm, 'mm)')
                break
              }
            }
          }
        }
      }
      
      // 4. CUARTO: Buscar volumen en cm³
      if (!extractedData.pesoGramos) {
        for (const line of commentLines) {
          const lowerLine = line.toLowerCase()
          if ((lowerLine.includes('filament') || lowerLine.includes('material') || lowerLine.includes('volume')) && 
              (lowerLine.includes('cm³') || lowerLine.includes('cm3') || lowerLine.includes('cc'))) {
            const match = line.match(/[=:]\s*(\d+\.?\d*)\s*(?:cm[³3]|cc)/i)
            if (match) {
              const volume = parseFloat(match[1])
              if (volume > 0 && volume <= 5000) {
                extractedData.pesoGramos = Math.round(volume * 1.24 * 100) / 100
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
        impresora: detectedPrinter || 'No detectada',
        consumoWatts: detectedPowerWatts || 'No encontrado',
        notasEncontradas: notes.length
      })
      
      // Actualizar state con los datos extraídos
      if (extractedData.pesoGramos || extractedData.horasImpresion) {
        setInputs(prev => ({ 
          ...prev, 
          ...(extractedData.pesoGramos && { pesoGramos: extractedData.pesoGramos }),
          ...(extractedData.horasImpresion && { horasImpresion: Math.round(extractedData.horasImpresion * 100) / 100 }),
          // Auto-completar consumo de watts si se detectó impresora y no hay valor previo
          ...(detectedPowerWatts && prev.consumoWatts === 0 && { consumoWatts: detectedPowerWatts })
        }))
        
        if (notes.length > 0) {
          setSlicerNotes(notes.join('\n'))
        }
        
        // Mensaje de éxito
        const extractedFields = []
        if (extractedData.pesoGramos) extractedFields.push(`Peso: ${extractedData.pesoGramos}g`)
        if (extractedData.horasImpresion) extractedFields.push(`Tiempo: ${extractedData.horasImpresion.toFixed(2)}h`)
        if (detectedPrinter) extractedFields.push(`Impresora: ${detectedPrinter}`)
        if (detectedPowerWatts) extractedFields.push(`Consumo: ${detectedPowerWatts}W`)
        
        // Agregar información sobre múltiples objetos si se detectaron
        let successMsg = `✅ Datos extraídos: ${extractedFields.join(', ')}`
        if (objectCount > 1) {
          successMsg += ` | Este archivo contiene ${objectCount} objetos/placas - los costos mostrados son para la impresión completa`
        }
        
        setErrors({ success: successMsg })
        
        // Track importación exitosa
        trackCustom('executed', {
          fileType: isGcodeContent ? 'gcode' : '3mf',
          fileName: file.name,
          objectCount,
          extractedFields: extractedFields.length,
          hasWeight: !!extractedData.pesoGramos,
          hasTime: !!extractedData.horasImpresion,
          hasPrinter: !!detectedPrinter,
          hasPowerWatts: !!detectedPowerWatts,
          printerName: detectedPrinter || undefined,
          powerWatts: detectedPowerWatts || undefined,
        })
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
      const errorMessage = 'Error al leer el archivo. Verifica que el archivo no esté corrupto.'
      setErrors({ import: errorMessage })
      console.error('❌ Error parsing file:', error)
      
      // Track error de importación
      trackCustom('error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileType: fileExtension,
      })
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
    
    // Validar archivo con seguridad
    const validation = validateFile(file, {
      allowedExtensions: ['.gcode', '.3mf'],
    })
    
    if (!validation.valid) {
      setErrors({ import: validation.errors.join('. ') })
      trackCustom('error', {
        errors: validation.errors,
        fileName: file.name,
        fileSize: file.size,
      })
      return
    }
    
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
    
    // Validar archivo con seguridad
    const validation = validateFile(file, {
      allowedExtensions: ['.stl'],
    })
    
    if (!validation.valid) {
      setErrors({ import: validation.errors.join('. ') })
      trackCustom('error', {
        errors: validation.errors,
        fileName: file.name,
        fileSize: file.size,
      })
      return
    }
    
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
      
      trackCustom('executed', { action: 'import_stl_success', fileName: file.name })
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
      
      // Track evento de ejecución con metadata detallada
      trackExecution({
        pesoGramos: validated.pesoGramos,
        costoTotal: costoTotal,
        conMargen: conMargen,
        costoMaterial,
        costoEnergia,
        costoDepreciacion,
        margenGanancia: validated.margenGanancia,
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
      trackResult({
        costoFinal: conMargen,
      })
      
    } catch (error) {
      // Manejo de errores de validación de Zod
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> }
        const fieldErrors: Record<string, string> = {}
        
        // Mapear errores de Zod a mensajes amigables
        zodError.issues.forEach((issue) => {
          const field = issue.path[0] as string
          
          // Mensajes personalizados por campo
          switch (field) {
            case 'pesoGramos':
              fieldErrors[field] = '⚠️ Te falta llenar el peso en gramos (mínimo 0.1g)'
              break
            case 'precioKgFilamento':
              fieldErrors[field] = '⚠️ Te falta llenar el precio del filamento por kilo'
              break
            case 'horasImpresion':
              fieldErrors[field] = '⚠️ Te falta llenar las horas de impresión (mínimo 0.01h)'
              break
            case 'consumoWatts':
              fieldErrors[field] = '⚠️ Te falta llenar el consumo en watts de tu impresora'
              break
            case 'precioKwh':
              fieldErrors[field] = '⚠️ Te falta llenar el precio del kWh'
              break
            case 'porcentajeMerma':
              fieldErrors[field] = '⚠️ El porcentaje de merma debe estar entre 0 y 100%'
              break
            case 'margenGanancia':
              fieldErrors[field] = '⚠️ El margen de ganancia debe ser un valor válido'
              break
            default:
              fieldErrors[field] = `⚠️ ${issue.message}`
          }
        })
        
        setErrors(fieldErrors)
        trackError(new Error('Validation error: ' + Object.values(fieldErrors).join(', ')))
      } else if (error instanceof Error) {
        setErrors({ general: error.message })
        onError?.(error)
        trackError(error)
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
    
    // Validar archivo con seguridad
    const validation = validateFile(file, {
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      maxSize: 2 * 1024 * 1024, // 2 MB máximo para logos
    })
    
    if (!validation.valid) {
      setErrors({ import: validation.errors.join('. ') })
      trackCustom('error', {
        errors: validation.errors,
        fileName: file.name,
        fileSize: file.size,
      })
      return
    }
    
    if (!file.type.startsWith('image/')) {
      setErrors({ import: 'Por favor selecciona una imagen válida' })
      return
    }
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setBusinessLogo(event.target?.result as string)
      trackCustom('executed', {
        fileSize: file.size,
        fileType: file.type,
      })
    }
    reader.onerror = () => {
      setErrors({ import: 'Error al cargar la imagen' })
    }
    reader.readAsDataURL(file)
  }

  /**
   * Generar PDF de cotización para cliente
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
    const pageWidth = doc.internal.pageSize.width
    
    // Logo y nombre del negocio (si hay)
    if (exportType === 'personalizada' && businessLogo) {
      try {
        doc.addImage(businessLogo, 'PNG', 15, yPosition, 35, 35)
        if (businessName) {
          doc.setFontSize(18)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(41, 98, 255)
          doc.text(businessName, 55, yPosition + 12)
        }
        yPosition += 45
      } catch (error) {
        console.error('Error al agregar logo:', error)
        if (businessName) {
          doc.setFontSize(18)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(41, 98, 255)
          doc.text(businessName, 15, yPosition)
          yPosition += 12
        }
      }
    } else if (exportType === 'personalizada' && businessName) {
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(41, 98, 255)
      doc.text(businessName, 15, yPosition)
      yPosition += 12
    }
    
    // Línea decorativa
    doc.setDrawColor(41, 98, 255)
    doc.setLineWidth(0.5)
    doc.line(15, yPosition, pageWidth - 15, yPosition)
    yPosition += 10
    
    // Título
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Cotización de Impresión 3D', 15, yPosition)
    yPosition += 10
    
    // Fecha y cliente
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(`Fecha: ${fecha}`, 15, yPosition)
    if (clientName) {
      doc.text(`Cliente: ${clientName}`, 15, yPosition + 5)
      yPosition += 5
    }
    yPosition += 12
    
    // Cuadro con detalles de la pieza
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(15, yPosition, pageWidth - 30, 35, 3, 3, 'F')
    
    yPosition += 8
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Detalles de la Pieza:', 20, yPosition)
    yPosition += 7
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    
    const pesoMinutos = `Peso del objeto: ${result.breakdown.pesoUsado}g`
    const tiempoHoras = inputs.horasImpresion >= 1 
      ? `${Math.floor(inputs.horasImpresion)}h ${Math.round((inputs.horasImpresion % 1) * 60)}min`
      : `${Math.round(inputs.horasImpresion * 60)}min`
    const tiempoTexto = `Tiempo de impresión: ${tiempoHoras}`
    
    doc.text(pesoMinutos, 20, yPosition)
    yPosition += 5
    doc.text(`Peso con merma (${result.breakdown.porcentajeMerma}%): ${result.breakdown.pesoReal.toFixed(2)}g`, 20, yPosition)
    yPosition += 5
    doc.text(tiempoTexto, 20, yPosition)
    
    if (stlDimensions.x > 0) {
      yPosition += 5
      doc.text(`Dimensiones: ${stlDimensions.x.toFixed(1)} × ${stlDimensions.y.toFixed(1)} × ${stlDimensions.z.toFixed(1)} mm`, 20, yPosition)
    }
    
    yPosition += 15
    
    // Precio final destacado
    const precioFinal = inputs.margenGanancia > 0 ? result.conMargen : result.costos.total
    
    // Cuadro del precio
    doc.setFillColor(41, 98, 255)
    doc.roundedRect(15, yPosition, pageWidth - 30, 35, 3, 3, 'F')
    
    yPosition += 12
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('PRECIO TOTAL', pageWidth / 2, yPosition, { align: 'center' })
    
    yPosition += 12
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text(`$${precioFinal.toFixed(2)} MXN`, pageWidth / 2, yPosition, { align: 'center' })
    
    yPosition += 20
    
    // Notas adicionales (opcional)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text('* Precio válido por 30 días', 15, yPosition)
    yPosition += 4
    doc.text('* El tiempo de entrega puede variar según disponibilidad', 15, yPosition)
    yPosition += 4
    doc.text('* Cualquier modificación al diseño puede alterar el precio', 15, yPosition)
    
    // Pie de página con línea
    const pageHeight = doc.internal.pageSize.height
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)
    
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    doc.text('Cotización generada con DoferLabs', 15, pageHeight - 12)
    
    if (exportType === 'personalizada' && businessName) {
      doc.text(businessName, pageWidth - 15, pageHeight - 12, { align: 'right' })
    }
    
    // Guardar PDF
    const fileName = clientName
      ? `Cotizacion_${clientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`
      : exportType === 'personalizada' && businessName
      ? `Cotizacion_${businessName.replace(/\s+/g, '_')}_${Date.now()}.pdf`
      : `Cotizacion_Impresion3D_${Date.now()}.pdf`
    
    doc.save(fileName)
    
    // Track export
    trackExport('pdf')
    trackCustom('exported', {
      exportType,
      hasBusinessName: !!businessName,
      hasClientName: !!clientName,
      hasLogo: !!businessLogo,
    })
    
    setShowExportModal(false)
    setClientName('') // Limpiar para próxima vez
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
              {/* Preview Image o Modelo 3D */}
              {threeMFGroup ? (
                <div className="flex-shrink-0 w-40 h-40 rounded-lg border-2 border-emerald-300 bg-white overflow-hidden">
                  <ThreeMFViewer group={threeMFGroup} rotation={stlRotation} />
                </div>
              ) : previewImage ? (
                <div className="flex-shrink-0">
                  <img 
                    src={previewImage} 
                    alt="Preview 3D" 
                    className="w-40 h-40 object-contain rounded-lg border-2 border-emerald-300 bg-white"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-32 h-32 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-5xl">📁</span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 mb-1">Importar desde Slicer</h3>
                <p className="text-sm text-emerald-700 mb-3">
                  Sube tu archivo <strong>.gcode, .3mf o .gcode.3mf</strong> y autocompletaremos los datos
                </p>
                
                {printerName && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-sm px-3 py-1.5 rounded-full">
                      <span>🖨️</span>
                      <span className="font-semibold">{printerName}</span>
                    </div>
                    {inputs.consumoWatts > 0 && (
                      <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-sm px-3 py-1.5 rounded-full">
                        <span>⚡</span>
                        <span className="font-medium">{inputs.consumoWatts}W</span>
                        <span className="text-amber-600 text-xs">(autodetectado)</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Dimensiones del modelo 3MF */}
                {threeMFGroup && stlDimensions.x > 0 && (
                  <div className="mb-3 text-xs text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded inline-block">
                    📐 Dimensiones: {stlDimensions.x} × {stlDimensions.y} × {stlDimensions.z} mm
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
            type="number"
            value={inputs.pesoGramos === 0 ? '' : inputs.pesoGramos}
            onChange={(e) => handleInputChange('pesoGramos', e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
              value={inputs.precioKgFilamento === 0 ? '' : inputs.precioKgFilamento}
              onChange={(e) => handleInputChange('precioKgFilamento', e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
              value={inputs.precioKgFilamento === 0 ? '' : (inputs.precioKgFilamento / 1000)}
              onChange={(e) => {
                if (e.target.value === '') {
                  handleInputChange('precioKgFilamento', 0)
                  return
                }
                const precioGramo = parseFloat(e.target.value) || 0
                handleInputChange('precioKgFilamento', precioGramo * 1000)
              }}
              placeholder="Ej: 0.52"
              className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              min="0.01"
              step="0.01"
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
            value={inputs.porcentajeMerma === 0 ? '' : inputs.porcentajeMerma}
            onChange={(e) => handleInputChange('porcentajeMerma', e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
            Tiempo de impresión (minutos)
            <InfoTooltip text="Duración total de la impresión en minutos. Lo obtienes del slicer antes de imprimir. Ejemplo: 570 minutos = 9h 30min" />
          </label>
          <input
            type="number"
            value={inputs.horasImpresion === 0 ? '' : Math.round(inputs.horasImpresion * 60)}
            onChange={(e) => {
              const minutos = e.target.value === '' ? 0 : parseFloat(e.target.value)
              handleInputChange('horasImpresion', minutos / 60)
            }}
            placeholder="Ej: 570"
            className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
            min="1"
            step="1"
          />
          {inputs.horasImpresion > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md font-medium">
                <span className="text-base">🕐</span>
                <span>{Math.floor(inputs.horasImpresion)}h {Math.round((inputs.horasImpresion % 1) * 60)}min</span>
              </div>
              <span className="text-gray-400">≈</span>
              <div className="text-gray-600">
                {(inputs.horasImpresion / 24).toFixed(1)} días
              </div>
            </div>
          )}
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
                    value={inputs.consumoWatts === 0 ? '' : inputs.consumoWatts}
                    onChange={(e) => handleInputChange('consumoWatts', e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                value={inputs.precioKwh === 0 ? '' : inputs.precioKwh}
                onChange={(e) => handleInputChange('precioKwh', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                placeholder="Ej: 2.5"
                className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                min="0"
                step="0.1"
              />
              {/* Presets de tarifa (México/CFE) */}
              <div className="mt-2">
                <select
                  onChange={(e) => handleInputChange('precioKwh', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  value={inputs.precioKwh === 0 ? '' : String(inputs.precioKwh)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                >
                  <option value="">Seleccionar tarifa CFE (sugerida)</option>
                  <option value="2.5">CFE - Tarifa doméstica estimada ~2.5 MXN/kWh</option>
                  <option value="4.5">CFE - Tarifa promedio (comercial ligera) ~4.5 MXN/kWh</option>
                  <option value="6.5">CFE - Tarifa DAC / alta demanda ~6.5 MXN/kWh</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Precio impresora (MXN) - Opcional
              <InfoTooltip text="Costo de compra de tu impresora 3D. Se usa para calcular depreciación del equipo. Déjalo en blanco si no quieres incluir este costo. Ejemplo: Ender 3 ~$5,000, Bambu Lab A1 ~$11,000" />
            </label>
            <input
              type="number"
              value={inputs.precioImpresora === 0 ? '' : inputs.precioImpresora}
              onChange={(e) => handleInputChange('precioImpresora', e.target.value === '' ? 0 : parseFloat(e.target.value))}
              placeholder="Ej: 10999 (opcional)"
              className="w-full px-4 py-3 text-lg font-semibold text-gray-900 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
              min="0"
              step="100"
            />
            <p className="text-xs text-gray-500">💡 Si incluyes el precio, la depreciación se calculará automáticamente (~2000 horas de vida útil)</p>
          </div>
        </div>

        {/* Margen (opcional) */}
        <div className="space-y-3 border-t pt-4 bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-2xl">💰</span>
            <div className="flex-1">
              <label className="block text-base font-semibold text-gray-800">
                ¿Cuánto quieres ganar por este trabajo?
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Ingresa el porcentaje de ganancia que quieres obtener sobre tus costos de producción
              </p>
            </div>
          </div>

          <div className="relative">
            <input
              type="number"
              value={inputs.margenGanancia === 0 ? '' : inputs.margenGanancia}
              onChange={(e) => handleInputChange('margenGanancia', e.target.value === '' ? 0 : parseFloat(e.target.value))}
              placeholder="Ejemplo: 50"
              className="w-full px-4 py-3 text-xl font-bold text-gray-900 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all"
              min="0"
              step="5"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">%</span>
          </div>

          {/* Preview de la ganancia */}
          {inputs.margenGanancia > 0 && inputs.pesoGramos > 0 && (
            <div className="bg-white border-2 border-green-300 rounded-lg p-4 space-y-3">
              {/* Cálculo rápido */}
              {(() => {
                const pesoReal = inputs.pesoGramos * (1 + inputs.porcentajeMerma / 100)
                const costoMaterial = (pesoReal * inputs.precioKgFilamento) / 1000
                const energiaKwh = (inputs.consumoWatts * inputs.horasImpresion) / 1000
                const costoEnergia = energiaKwh * inputs.precioKwh
                let costoDepreciacion = 0
                if (inputs.precioImpresora && inputs.vidaUtilHoras) {
                  costoDepreciacion = (inputs.precioImpresora / inputs.vidaUtilHoras) * inputs.horasImpresion
                }
                const costoTotal = costoMaterial + costoEnergia + costoDepreciacion
                const ganancia = costoTotal * (inputs.margenGanancia / 100)
                const precioVenta = costoTotal + ganancia

                return (
                  <>
                    <div className="text-center pb-3 border-b border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Te quedarás con</p>
                      <p className="text-3xl font-bold text-green-600">${ganancia.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">de ganancia neta</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600 text-xs mb-1">Tus costos</p>
                        <p className="font-bold text-gray-900">${costoTotal.toFixed(2)}</p>
                      </div>
                      <div className="text-center p-2 bg-green-100 rounded">
                        <p className="text-green-700 text-xs mb-1">Precio a cobrar</p>
                        <p className="font-bold text-green-700">${precioVenta.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-center text-blue-800">
                      📊 Cobrarás <span className="font-bold">${precioVenta.toFixed(2)}</span>, 
                      de los cuales <span className="font-bold">${costoTotal.toFixed(2)}</span> cubren tus costos 
                      y <span className="font-bold text-green-600">${ganancia.toFixed(2)}</span> es tu ganancia ({inputs.margenGanancia}%)
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded p-2">
            <span className="text-sm">💡</span>
            <div className="text-xs text-gray-600 flex-1">
              <span className="font-semibold">Guía de porcentajes:</span>
              <ul className="mt-1 space-y-0.5 ml-2">
                <li>• 25-40%: Piezas simples o producción en serie</li>
                <li>• 50-80%: Piezas estándar con valor agregado</li>
                <li>• 100-200%: Diseños personalizados o trabajos complejos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón calcular */}
        <button
          onClick={calcular}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors"
        >
          Calcular Costos
        </button>

        {/* Errores de validación */}
        {Object.keys(errors).length > 0 && !errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-red-800 mb-2">❌ Revisa los siguientes campos:</p>
            {Object.entries(errors).map(([field, message]) => (
              <div key={field} className="text-red-700 text-sm flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error general */}
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
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Precio de venta (con {inputs.margenGanancia}% de ganancia):</p>
                <p className="text-3xl font-bold text-green-600">${result.conMargen.toFixed(2)} MXN</p>
                <p className="text-xs text-gray-500 mt-1">Tu ganancia: ${(result.conMargen - result.costos.total).toFixed(2)} MXN</p>
              </div>
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
            
            {/* Campo nombre del cliente (siempre visible) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nombre del cliente (opcional)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
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
