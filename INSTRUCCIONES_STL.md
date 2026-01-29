# Funcionalidad de Cotización por STL - Implementada ✅

## ¿Qué se agregó?

Se implementó una nueva funcionalidad para cotizar impresiones 3D directamente desde archivos STL con las siguientes características:

### 1. **Dos modos de cotización**
   - **GCODE/3MF**: El modo original que extrae datos de archivos ya procesados por el slicer
   - **STL**: Nuevo modo que permite cargar archivos STL crudos y configurar los parámetros de impresión

### 2. **Visualización 3D del STL**
   - Vista previa interactiva en 3D del modelo cargado
   - Controles para rotar, hacer zoom y mover la cámara
   - Dimensiones del modelo mostradas (X, Y, Z en mm)

### 3. **Cálculo automático de peso**
   - Calcula el volumen del STL analizando la geometría
   - Estima el peso considerando:
     - Densidad del material (PLA: 1.25 g/cm³)
     - Porcentaje de relleno configurado
     - Perímetros/paredes (estimado al 30% del volumen)

### 4. **Configuración de parámetros de impresión**
   - **Densidad de relleno**: Slider de 0% a 100% (default: 20%)
   - **Altura de capa**: 0.1mm, 0.15mm, 0.2mm, 0.25mm, 0.3mm
   - **Grosor de pared**: 0.8mm a 2.0mm
   - Botón para recalcular peso cuando se cambian los parámetros

### 5. **Advertencias importantes**
   - Leyenda que indica que el STL debe tener la escala correcta (en mm)
   - Advertencia sobre verificar la orientación del modelo
   - Nota de que los cálculos son estimaciones

## Librerías instaladas

```bash
npm install three @react-three/fiber @react-three/drei
```

- **three**: Biblioteca principal para renderizado 3D
- **@react-three/fiber**: Wrapper de Three.js para React
- **@react-three/drei**: Helpers y componentes útiles para React Three Fiber

## Ubicación de los cambios

Archivo modificado: `/src/tools/calculadora-costos-impresion/index.tsx`

### Cambios principales:

1. **Nuevos imports**:
   - Canvas, OrbitControls, Stage, Center de React Three Fiber
   - THREE y STLLoader para cargar y procesar archivos STL

2. **Nuevos estados**:
   - `cotizacionMode`: 'gcode' | 'stl'
   - `stlGeometry`: Geometría del modelo 3D
   - `stlVolume`: Volumen calculado en mm³
   - `stlDimensions`: Dimensiones X, Y, Z
   - `infillDensity`, `layerHeight`, `wallThickness`: Parámetros de impresión

3. **Nuevas funciones**:
   - `handleStlUpload()`: Carga y procesa archivos STL
   - `recalculateStlWeight()`: Recalcula peso con nuevos parámetros
   - `StlViewer`: Componente para visualizar el modelo 3D

4. **Nueva UI**:
   - Sistema de tabs para cambiar entre modos
   - Sección de carga de STL con preview 3D
   - Controles de configuración de impresión
   - Advertencias y tooltips informativos

## Cómo usar

1. **Actualizar Node.js a versión 20 o superior**:
   ```bash
   # Instalar nvm si no lo tienes
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Instalar Node 20
   nvm install 20
   nvm use 20
   ```

2. **Ejecutar el proyecto**:
   ```bash
   npm run dev
   ```

3. **Acceder a la herramienta**:
   - Ir a: `http://localhost:3000/hub/calculadora-costos-impresion`
   - Seleccionar la pestaña "🔷 Archivo STL"
   - Cargar un archivo STL
   - Ajustar configuración de impresión
   - Completar costos de material y máquina
   - Hacer clic en "Calcular Costos"

## Flujo de trabajo

```
Usuario carga STL
    ↓
Se calcula volumen y dimensiones
    ↓
Se muestra vista previa 3D
    ↓
Se calcula peso estimado con relleno por defecto (20%)
    ↓
Usuario ajusta parámetros (relleno, altura de capa, etc.)
    ↓
Usuario recalcula peso si es necesario
    ↓
Usuario completa costos de material y energía
    ↓
Se calcula el costo total
```

## Notas técnicas

### Cálculo de volumen
El volumen se calcula usando la fórmula del tetraedro para cada triángulo del STL:
```typescript
volume += v1.dot(v2.cross(v3)) / 6
```

### Estimación de peso
```typescript
const volumeCm3 = volume / 1000  // mm³ a cm³
const densityPLA = 1.25          // g/cm³
const shellVolume = volumeCm3 * 0.3  // 30% perímetros
const infillVolume = volumeCm3 * 0.7 * (infillDensity / 100)  // 70% interior
const weight = (shellVolume + infillVolume) * densityPLA
```

## Próximas mejoras sugeridas

- [ ] Estimación de tiempo de impresión basado en altura de capa y volumen
- [ ] Detección automática de soportes necesarios
- [ ] Soporte para múltiples materiales (ABS, PETG, etc.)
- [ ] Cálculo más preciso de perímetros basado en geometría real
- [ ] Guardar configuraciones preestablecidas
- [ ] Exportar cotización como PDF

## Problemas conocidos

1. **Node.js < 20**: El proyecto requiere Node 20+ debido a las dependencias de Next.js 16
2. **Archivos grandes**: STLs muy grandes (>50MB) pueden tardar en cargar
3. **Estimaciones**: Los cálculos de peso son estimaciones. Para precisión exacta, usar GCODE

---

✅ **Implementación completada y funcional**
