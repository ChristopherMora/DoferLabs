# Dofer Labs

**Herramientas gratuitas y prácticas para makers.**

Plataforma de herramientas web construida con Next.js 15, diseñada específicamente para makers con enfoque en 0 fricción, analytics no invasivos, y arquitectura preparada para monetización freemium.

---

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de PostgreSQL

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones (cuando tengas DB configurada)
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

---

## 📦 Stack Tecnológico

### Core
- **Next.js 15** - React framework con App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **PostgreSQL** - Base de datos
- **Prisma** - ORM

### Arquitectura Especial
- **Tool Registry** - Sistema de plugins autocontenidos
- **Zod** - Validación de schemas
- **DOMPurify** - Sanitización XSS
- **Feature Flags** - Control de features (Pro/Free)

### Preparado para (no implementado en MVP):
- **tRPC** - API type-safe
- **Zustand** - State management
- **Upstash Redis** - Rate limiting
- **Sentry** - Error tracking
- **Next-Auth** - Autenticación

---

## 🏗️ Arquitectura del Proyecto

```
/doferlabs
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── hub/                      # Hub de herramientas
│   │   ├── page.tsx              # Listado de tools (ISR)
│   │   └── [tool]/page.tsx       # Tool individual (dynamic)
│   └── legal/                    # Páginas legales
│
├── src/
│   ├── tools/                    # 🔥 NÚCLEO: Sistema de herramientas
│   │   ├── types.ts              # Tipos & interfaces
│   │   ├── registry.ts           # Registry de herramientas
│   │   ├── index.ts              # Inicializador
│   │   └── [tool-name]/          # Herramienta individual
│   │       ├── tool.config.ts    # Config & metadata
│   │       ├── schema.ts         # Validación Zod
│   │       ├── index.tsx         # Componente React
│   │       └── actions.ts        # Server Actions (futuro)
│   │
│   ├── lib/
│   │   ├── db/prisma.ts          # Prisma client
│   │   ├── analytics/            # Event tracking
│   │   ├── validation/           # Sanitización
│   │   └── features/             # Feature flags
│   │
│   └── components/               # Componentes compartidos
│       ├── ui/                   # Primitivos
│       └── tool-shell/           # Layout de herramientas
│
├── prisma/
│   └── schema.prisma             # Schema DB (Users, Events, Leads)
│
└── .env                          # Variables de entorno
```

---

## 🔨 Cómo Agregar una Nueva Herramienta

### 1. Crear Estructura

```bash
mkdir -p src/tools/mi-herramienta
cd src/tools/mi-herramienta
```

### 2. Crear `tool.config.ts`

```typescript
import { ToolConfig } from '../types'

export const config: ToolConfig = {
  id: 'mi-herramienta',
  name: 'Mi Herramienta',
  description: 'Descripción corta y clara',
  category: 'utilidades', // costos | calidad | materiales | diseño | utilidades
  status: 'beta',          // beta | stable | deprecated
  tier: 'free',            // free | pro | enterprise
  icon: '🔧',
  color: '#3b82f6',
  
  features: {
    exportable: false,
    saveable: false,
    shareable: false,
  },
  
  seo: {
    title: 'Mi Herramienta | Dofer Labs',
    description: 'SEO description...',
    keywords: ['keyword1', 'keyword2'],
  },
}
```

### 3. Crear `schema.ts` (validación)

```typescript
import { z } from 'zod'

export const inputSchema = z.object({
  campo1: z.string().min(1),
  campo2: z.number().min(0),
})

export type Input = z.infer<typeof inputSchema>

export interface Result {
  // Define tu output
}
```

### 4. Crear `index.tsx` (componente)

```typescript
'use client'

import { useState } from 'react'
import { useTrackEvent } from '@/lib/analytics/hooks'
import type { ToolProps } from '../types'
import { inputSchema, type Input, type Result } from './schema'
import { config } from './tool.config'

export default function MiHerramienta({ onComplete, onError }: ToolProps) {
  const tracker = useTrackEvent()
  const [result, setResult] = useState<Result | null>(null)

  const handleCalculate = () => {
    try {
      const validated = inputSchema.parse(inputs)
      // Lógica aquí
      tracker.toolExecuted(config.id, { /* metadata */ })
      tracker.resultViewed(config.id)
    } catch (error) {
      tracker.error(config.id, error as Error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Tu UI aquí */}
    </div>
  )
}
```

### 5. Registrar en `src/tools/index.ts`

```typescript
import { config as miHerramientaConfig } from './mi-herramienta/tool.config'

export function registerAllTools() {
  // ... otras herramientas
  
  toolRegistry.register({
    ...miHerramientaConfig,
    path: `/hub/${miHerramientaConfig.id}`,
    component: () => import('./mi-herramienta'),
  })
}
```

¡Listo! Tu herramienta aparecerá automáticamente en el Hub.

---

## 📊 Sistema de Analytics

### Eventos Disponibles

```typescript
import { useTrackEvent } from '@/lib/analytics/hooks'

const tracker = useTrackEvent()

// Eventos automáticos
tracker.toolOpened('tool-id')       // Al abrir herramienta
tracker.toolExecuted('tool-id', {}) // Al ejecutar
tracker.resultViewed('tool-id')     // Al ver resultado

// Eventos opcionales
tracker.resultExported('tool-id', 'pdf')
tracker.resultSaved('tool-id')
tracker.error('tool-id', error)
```

### Configuración

En `.env`:
```bash
NEXT_PUBLIC_ANALYTICS="false"  # Activar cuando tengas analytics configurado
```

---

## 🗄️ Base de Datos

### Modelos Principales

1. **User** - Usuarios (preparado para Next-Auth)
2. **Event** - Analytics propio (sin PII en MVP)
3. **SavedResult** - Resultados guardados (feature Pro)
4. **Lead** - Soft opt-ins

### Comandos Prisma

```bash
# Generar cliente
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Ver DB en browser
npx prisma studio

# Reset DB (⚠️ borra datos)
npx prisma migrate reset
```

---

## 🎯 Feature Flags

Sistema de control de features en `src/lib/features/flags.ts`:

```typescript
import { features } from '@/lib/features/flags'

if (features.pro) {
  // Lógica Pro
}

if (features.auth) {
  // Mostrar login
}
```

Configurar en `.env`:
```bash
NEXT_PUBLIC_ENABLE_PRO="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ANALYTICS="false"
```

---

## 🚢 Deployment

### Vercel (Recomendado)

1. Push a GitHub
2. Importar en Vercel
3. Configurar variables de entorno
4. Deploy automático

### Variables de Entorno Necesarias

```bash
DATABASE_URL="postgresql://..."  # Vercel Postgres o Supabase
NEXTAUTH_SECRET="..."            # Cuando actives auth
NEXTAUTH_URL="https://..."       # URL de producción
```

---

## 🔐 Seguridad

### Implementado

✅ Validación con Zod  
✅ Sanitización DOMPurify  
✅ Feature flags por tier  
✅ Schema Prisma seguro  

### Por Implementar (Fase 2)

⏳ Rate limiting con Upstash  
⏳ CSRF protection  
⏳ Row-level security en DB  
⏳ Verificación de tier en API  

---

## 📈 Roadmap

### MVP (Actual)
- [x] Arquitectura base
- [x] Sistema de herramientas plugin-style
- [x] Analytics básico
- [x] Feature flags
- [x] 1 herramienta ejemplo (calculadora costos)

### Fase 2 (Próximo)
- [ ] 5-10 herramientas funcionales
- [ ] tRPC setup
- [ ] Zustand state management
- [ ] Rate limiting con Upstash
- [ ] Sentry error tracking

### Fase 3 (Monetización)
- [ ] Next-Auth + Google OAuth
- [ ] Sistema Pro/Free activo
- [ ] Guardar resultados (Pro)
- [ ] Exportar PDF (Pro)
- [ ] Stripe integración

---

## 🤝 Contribuir

Este proyecto está diseñado para ser fácilmente extensible.  
Patrón para agregar herramientas:

1. Copia template de herramienta existente
2. Modifica config, schema y componente
3. Registra en `index.ts`
4. ¡Funciona!

---

## 📝 Licencia

MIT - Úsalo libremente.

---

## 💡 Filosofía del Proyecto

**"Primero utilidad, luego todo lo demás"**

- ❌ No bloqueos
- ❌ No funnels
- ❌ No ventas agresivas
- ✅ Valor inmediato
- ✅ Fricción mínima
- ✅ Métricas útiles

---

## 📞 Contacto

- Email: hola@dofer.com.mx
- Sitio: doferlabs.dofer.com.mx (pronto)

---

**Hecho con ❤️ para la comunidad maker.**
