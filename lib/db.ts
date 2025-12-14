import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Create Prisma client with error handling for build-time when client may not be generated
let prismaInstance: PrismaClient | null = null;

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
} catch (error) {
  console.warn('⚠️  Prisma client not initialized. Database operations will fail at runtime.');
  console.warn('   Run "npx prisma generate" to initialize the client.');
}

// Export prisma client (may be null if generation failed)
export const prisma = prismaInstance as PrismaClient;
