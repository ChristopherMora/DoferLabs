import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // En Prisma 7, necesitamos usar un adaptador para conexiones directas
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.warn('DATABASE_URL not set, Prisma client may not work')
    // Retornar cliente sin adaptador para build time
    return new PrismaClient()
  }
  
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
