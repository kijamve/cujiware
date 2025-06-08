import { PrismaClient } from '@prisma/client'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 segundo

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: ['error', 'warn', 'info'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Función para ejecutar consultas con retry
  const executeWithRetry = async (fn: () => Promise<any>) => {
    let lastError: any
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error
        if (error.code === 'P1001') {
          console.warn(`Intento ${i + 1} fallido, reintentando en ${RETRY_DELAY}ms...`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
          continue
        }
        throw error
      }
    }
    throw lastError
  }

  // Proxy para interceptar las llamadas a Prisma
  return new Proxy(client, {
    get: (target, prop) => {
      const value = target[prop as keyof typeof target]
      if (typeof value === 'function') {
        return async (...args: any[]) => {
          return executeWithRetry(() => value.apply(target, args))
        }
      }
      return value
    }
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export default prisma
