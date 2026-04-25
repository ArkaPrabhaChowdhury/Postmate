import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function normalizeDatabaseUrl(url: string | undefined) {
  if (!url) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  // Prisma + Neon pooled endpoint uses PgBouncer.
  // In serverless, it’s safer to keep connections minimal and avoid pool timeouts.
  const isPostgres = parsed.protocol === "postgres:" || parsed.protocol === "postgresql:";
  const isNeon = parsed.hostname.endsWith(".neon.tech");
  const isPooler = parsed.hostname.includes("-pooler.");

  if (isPostgres && isNeon && isPooler) {
    if (!parsed.searchParams.has("pgbouncer")) parsed.searchParams.set("pgbouncer", "true");
    if (!parsed.searchParams.has("connection_limit")) parsed.searchParams.set("connection_limit", "1");
    if (!parsed.searchParams.has("pool_timeout")) parsed.searchParams.set("pool_timeout", "0");
    if (!parsed.searchParams.has("connect_timeout")) parsed.searchParams.set("connect_timeout", "30");

    // Avoid passing uncommon params that can break older poolers/clients.
    if (parsed.searchParams.has("channel_binding")) parsed.searchParams.delete("channel_binding");
  }

  return parsed.toString();
}

const datasourceUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(datasourceUrl
      ? {
          datasources: {
            db: { url: datasourceUrl },
          },
        }
      : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
