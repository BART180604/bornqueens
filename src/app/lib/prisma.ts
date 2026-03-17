// src/app/lib/prisma.ts
//Singleton Prisma Client (pattern anti-hot-reload)
import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma