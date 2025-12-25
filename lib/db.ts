import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Create Prisma client with error handling for build-time when client may not be generated
let prismaInstance: PrismaClient | null = null;
let initError: Error | null = null;

try {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
} catch (error) {
  initError = error as Error;
  console.error('❌ Prisma client initialization failed:', error);
  console.error('   This will cause all database operations to fail.');
  console.error('   Make sure to run "npx prisma generate" and "npx prisma migrate deploy"');
}

// Create a Proxy that throws helpful errors if Prisma isn't initialized
const prismaProxy = new Proxy(prismaInstance || {}, {
  get(target, prop) {
    if (!prismaInstance) {
      throw new Error(
        `Prisma client is not initialized. ${initError ? `Error: ${initError.message}` : 'Database operations cannot be performed.'}\n` +
        'Please ensure:\n' +
        '1. DATABASE_URL is set correctly\n' +
        '2. "npx prisma generate" has been run\n' +
        '3. "npx prisma migrate deploy" has been run\n' +
        '4. The database schema matches the Prisma schema'
      );
    }
    return (target as any)[prop];
  }
});

// Export prisma client with proxy for better error messages
export const prisma = prismaProxy as PrismaClient;
