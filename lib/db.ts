import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/little_moment";
const isTiDBCloud = connectionString.includes(".tidbcloud.com");
const tidbTlsEnabled = process.env.TIDB_ENABLE_SSL === "true" || isTiDBCloud;
const tidbCa = process.env.TIDB_CA_CERT?.replace(/\\n/g, "\n");

const globalForDb = globalThis as unknown as { littleMomentPool?: mysql.Pool };
const pool = globalForDb.littleMomentPool ?? mysql.createPool({
  uri: connectionString,
  connectionLimit: 5,
  ...(tidbTlsEnabled ? {
    ssl: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
      ...(tidbCa ? { ca: tidbCa } : {}),
    },
  } : {}),
});
if (process.env.NODE_ENV !== "production") globalForDb.littleMomentPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);
