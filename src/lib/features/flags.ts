/**
 * Sistema de Feature Flags
 * Controla qué features están activas en runtime
 */

export const features = {
  // Monetización
  pro: process.env.NEXT_PUBLIC_ENABLE_PRO === 'true',
  
  // Autenticación
  auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
  
  // Analytics
  analytics: process.env.NEXT_PUBLIC_ANALYTICS === 'true',
  
  // Features específicas (agregar según necesidad)
  exportPDF: false,
  saveResults: false,
  shareResults: false,
} as const

/**
 * Verifica si un feature está activo
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature]
}

/**
 * Obtiene el tier del usuario
 * Por ahora todos son 'free', pero preparado para expansión
 */
export function getUserTier(): 'free' | 'pro' | 'enterprise' {
  // TODO: Obtener del user context cuando tengamos auth
  return 'free'
}

/**
 * Verifica si el usuario puede acceder a un feature por tier
 */
export function canAccessFeature(
  featureTier: 'free' | 'pro' | 'enterprise',
  userTier: 'free' | 'pro' | 'enterprise' = 'free'
): boolean {
  const tierLevels = { free: 0, pro: 1, enterprise: 2 }
  return tierLevels[userTier] >= tierLevels[featureTier]
}
