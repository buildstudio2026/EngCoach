import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, '')

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

// Netlify build fix: Strip search params for the Pool constructor if they cause issues
const poolConfig = {
  connectionString: connectionString.split('?')[0], // Simplified URL for the pool
  ssl: {
    rejectUnauthorized: false
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
  const pool = new Pool(poolConfig as any)
  const adapter = new PrismaPg(pool as any)
  return new PrismaClient({
    adapter: adapter as any,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

