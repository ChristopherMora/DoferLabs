/**
 * Validadores de archivos para seguridad
 */

// Límites de tamaño por tipo
export const FILE_SIZE_LIMITS = {
  // Archivos de impresión 3D
  gcode: 50 * 1024 * 1024, // 50 MB
  '3mf': 50 * 1024 * 1024,  // 50 MB
  stl: 100 * 1024 * 1024,   // 100 MB (pueden ser grandes)
  
  // Imágenes
  image: 5 * 1024 * 1024,   // 5 MB
  logo: 2 * 1024 * 1024,    // 2 MB
  
  // Default
  default: 10 * 1024 * 1024, // 10 MB
}

// MIME types permitidos
export const ALLOWED_MIME_TYPES = {
  gcode: ['text/plain', 'application/octet-stream'],
  '3mf': ['application/vnd.ms-package.3dmanufacturing-3dmodel+xml', 'application/octet-stream', 'application/zip'],
  stl: ['application/vnd.ms-pki.stl', 'application/octet-stream', 'model/stl'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
}

// Extensiones permitidas
export const ALLOWED_EXTENSIONS = {
  printing: ['.gcode', '.3mf', '.stl'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  pdf: ['.pdf'],
}

/**
 * Valida el tamaño de un archivo
 */
export function validateFileSize(file: File, maxSize?: number): { valid: boolean; error?: string } {
  const extension = file.name.toLowerCase().split('.').pop() || ''
  const limit = maxSize || FILE_SIZE_LIMITS[extension as keyof typeof FILE_SIZE_LIMITS] || FILE_SIZE_LIMITS.default
  
  if (file.size > limit) {
    const limitMB = (limit / (1024 * 1024)).toFixed(1)
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `Archivo demasiado grande (${sizeMB}MB). Máximo permitido: ${limitMB}MB`,
    }
  }
  
  return { valid: true }
}

/**
 * Valida el tipo MIME de un archivo
 */
export function validateFileMimeType(file: File): { valid: boolean; error?: string } {
  const extension = file.name.toLowerCase().split('.').pop() || ''
  
  // Verificar si la extensión está permitida
  const isExtensionAllowed = Object.values(ALLOWED_EXTENSIONS).some(exts =>
    exts.includes(`.${extension}`)
  )
  
  if (!isExtensionAllowed) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: .${extension}`,
    }
  }
  
  // Verificar MIME type si está disponible
  if (file.type) {
    const allowedMimes = Object.entries(ALLOWED_MIME_TYPES).find(([key]) =>
      key === extension || key === 'image' && ALLOWED_EXTENSIONS.image.includes(`.${extension}`)
    )?.[1]
    
    if (allowedMimes && !allowedMimes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo MIME no válido para .${extension}`,
      }
    }
  }
  
  return { valid: true }
}

/**
 * Valida nombre de archivo (previene path traversal)
 */
export function validateFileName(fileName: string): { valid: boolean; error?: string } {
  // Caracteres peligrosos
  const dangerousChars = /[<>:"|?*\x00-\x1f]/g
  const hasNullByte = fileName.includes('\0')
  const hasPathTraversal = fileName.includes('..') || fileName.includes('/')
  
  if (hasNullByte || hasPathTraversal || dangerousChars.test(fileName)) {
    return {
      valid: false,
      error: 'Nombre de archivo contiene caracteres no permitidos',
    }
  }
  
  // Longitud máxima
  if (fileName.length > 255) {
    return {
      valid: false,
      error: 'Nombre de archivo demasiado largo (máximo 255 caracteres)',
    }
  }
  
  return { valid: true }
}

/**
 * Validación completa de archivo
 */
export function validateFile(file: File, options?: {
  maxSize?: number
  allowedExtensions?: string[]
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validar nombre
  const nameValidation = validateFileName(file.name)
  if (!nameValidation.valid && nameValidation.error) {
    errors.push(nameValidation.error)
  }
  
  // Validar tamaño
  const sizeValidation = validateFileSize(file, options?.maxSize)
  if (!sizeValidation.valid && sizeValidation.error) {
    errors.push(sizeValidation.error)
  }
  
  // Validar tipo MIME
  const mimeValidation = validateFileMimeType(file)
  if (!mimeValidation.valid && mimeValidation.error) {
    errors.push(mimeValidation.error)
  }
  
  // Validar extensión personalizada si se especifica
  if (options?.allowedExtensions) {
    const extension = file.name.toLowerCase().split('.').pop()
    if (!options.allowedExtensions.includes(`.${extension}`)) {
      errors.push(`Extensión no permitida. Solo se permiten: ${options.allowedExtensions.join(', ')}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitiza nombre de archivo
 */
export function sanitizeFileName(fileName: string): string {
  // Remover caracteres peligrosos
  let sanitized = fileName.replace(/[<>:"|?*\x00-\x1f]/g, '')
  
  // Remover path traversal
  sanitized = sanitized.replace(/\.\./g, '')
  
  // Normalizar espacios
  sanitized = sanitized.replace(/\s+/g, '_')
  
  // Limitar longitud
  if (sanitized.length > 255) {
    const extension = sanitized.split('.').pop()
    const nameWithoutExt = sanitized.slice(0, -(extension?.length || 0) - 1)
    sanitized = nameWithoutExt.slice(0, 200) + '.' + extension
  }
  
  return sanitized
}
