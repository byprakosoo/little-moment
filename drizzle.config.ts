import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit does not load Next.js' .env.local automatically. Load it first
// so local migrations use the same TiDB credentials as the app.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/little_moment";
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
