import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Create Prisma client with proper configuration
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
