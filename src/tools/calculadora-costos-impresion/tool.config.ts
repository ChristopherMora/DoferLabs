import { ToolConfig } from '../types'

export const config: ToolConfig = {
  id: 'calculadora-costos-impresion',
  name: 'Calculadora de Costos de Impresión 3D',
  description: 'Calcula el costo real de tus impresiones 3D considerando material, tiempo y energía',
  category: 'costos',
  status: 'stable',
  tier: 'free',
  icon: '🧮',
  color: '#3b82f6',
  
  features: {
    exportable: true,
    saveable: false, // Pro feature en futuro
    shareable: false,
    versionable: false,
  },
  
  seo: {
    title: 'Calculadora de Costos de Impresión 3D | Dofer Labs',
    description: 'Calcula cuánto cuesta realmente imprimir en 3D. Incluye material, electricidad y tiempo.',
    keywords: ['impresión 3D', 'costos', 'calculadora', 'PLA', 'filamento', 'makers'],
  },
}
