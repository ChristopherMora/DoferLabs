import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: pg.Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada')
  }

  let pgUrl = connectionString
  
  // Si es URL de Prisma Postgres local (desarrollo), extraer la URL real
  if (connectionString.startsWith('prisma+postgres://')) {
    try {
      const url = new URL(connectionString)
      const apiKey = url.searchParams.get('api_key')
      if (apiKey) {
        const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString('utf-8'))
        pgUrl = decoded.databaseUrl
      }
    } catch {
      pgUrl = connectionString
    }
  }
  
  // Crear pool de conexiones
  const pool = globalForPrisma.pool ?? new Pool({ 
    connectionString: pgUrl,
    max: 10,
    idleTimeoutMillis: 30000,
  })
  
  // Guardar pool globalmente para reutilizar conexiones
  globalForPrisma.pool = pool
  
  // Usar adaptador para conectar Prisma con el pool
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Guardar cliente globalmente para reutilizar
globalForPrisma.prisma = prisma
