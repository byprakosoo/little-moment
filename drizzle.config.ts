import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit does not load Next.js' .env.local automatically. Load it first
// so local migrations use the same TiDB credentials as the app.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const configuredDatabaseUrl = process.env.DATABASE_URL?.trim();
const databaseUrl = configuredDatabaseUrl || "mysql://root:root@127.0.0.1:3306/little_moment";

if (configuredDatabaseUrl) {
  try {
    new URL(configuredDatabaseUrl);
  } catch {
    throw new Error(
      "DATABASE_URL tidak valid. Gunakan URI MySQL lengkap dari TiDB Cloud, misalnya mysql://user:password@host.tidbcloud.com:4000/test.",
    );
  }
}

const isTiDBCloud = databaseUrl.includes(".tidbcloud.com");

const dbCredentials = isTiDBCloud || process.env.TIDB_ENABLE_SSL === "true"
  ? (() => {
      const parsed = new URL(databaseUrl);
      const ca = process.env.TIDB_CA_CERT?.replace(/\\n/g, "\n");

      return {
        host: parsed.hostname,
        port: Number(parsed.port || 3306),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: decodeURIComponent(parsed.pathname.replace(/^\//, "")) || "test",
        ssl: {
          rejectUnauthorized: true,
          ...(ca ? { ca } : {}),
        },
      };
    })()
  : { url: databaseUrl };

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials,
  strict: true,
  verbose: true,
});
