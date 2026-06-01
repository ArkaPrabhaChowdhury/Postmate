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

  // For pooled Postgres endpoints in serverless, keep connections minimal,
  // allow a longer initial connect window, and disable prepared statements
  // where the pooler requires it.
  const isPostgres = parsed.protocol === "postgres:" || parsed.protocol === "postgresql:";
  const isNeonPooler = parsed.hostname.endsWith(".neon.tech") && parsed.hostname.includes("-pooler.");
  const isSupabaseTransactionPooler =
    (parsed.hostname.endsWith(".pooler.supabase.com") || parsed.hostname.endsWith(".supabase.co")) &&
    parsed.port === "6543";

  if (isPostgres && (isNeonPooler || isSupabaseTransactionPooler)) {
    if (!parsed.searchParams.has("pgbouncer")) parsed.searchParams.set("pgbouncer", "true");
    if (!parsed.searchParams.has("pool_timeout")) parsed.searchParams.set("pool_timeout", "0");
    if (!parsed.searchParams.has("connect_timeout")) parsed.searchParams.set("connect_timeout", "30");

    if (isSupabaseTransactionPooler) {
      const currentLimit = Number(parsed.searchParams.get("connection_limit") ?? "0");
      if (!Number.isFinite(currentLimit) || currentLimit < 5) {
        parsed.searchParams.set("connection_limit", "5");
      }
    } else if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "1");
    }

    // Avoid passing uncommon params that can break some poolers/clients.
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
