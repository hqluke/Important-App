import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'fs'
import path from 'path'

function createAdapter() {
  const url = process.env.DATABASE_URL!
  const isProd = process.env.NODE_ENV === 'production'
  const certPath = path.resolve(process.cwd(), 'global-bundle.pem')

  if (isProd && fs.existsSync(certPath)) {
    const ca = fs.readFileSync(certPath).toString()
    return new PrismaPg({
      connectionString: url,
      ssl: { ca, rejectUnauthorized: true },
    })
  }

  const ca = fs.existsSync(certPath) ? fs.readFileSync(certPath).toString() : undefined
  return new PrismaPg({
    connectionString: url,
    ssl: { ca, rejectUnauthorized: false },
  })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    adapter: createAdapter(),
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
