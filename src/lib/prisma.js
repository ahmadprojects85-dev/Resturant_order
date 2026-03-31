import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    // 🚀 Docker Build Fix: If DATABASE_URL is missing during build, provide a dummy string
    // so Prisma doesn't crash the entire build. It will use the real one once live.
    const dbUrl = process.env.DATABASE_URL || "postgresql://dummy:password@localhost:5432/db";

    return new PrismaClient({
        datasources: {
            db: {
                url: dbUrl,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
