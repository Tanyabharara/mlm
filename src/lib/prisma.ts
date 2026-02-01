import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    const client = new PrismaClient({
        log: [
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
        ],
    });
    return client;
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

/** Test DB connection and log result. Call early to surface connection issues. */
export async function logDbConnection(): Promise<boolean> {
    const env = process.env.DATABASE_URL ? 'set' : 'missing';
    console.log('[DB] DATABASE_URL is', env);
    try {
        await prisma.$connect();
        console.log('[DB] Connection OK');
        return true;
    } catch (e: unknown) {
        const err = e as Error & { code?: string; meta?: unknown };
        console.error('[DB] Connection failed:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack,
        });
        return false;
    }
}

// Run connection test on first load (server-side) to surface issues early
if (typeof window === 'undefined') {
    logDbConnection().catch(() => {});
}

export default prisma;
