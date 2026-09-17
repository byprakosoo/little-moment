import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: { url: process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/little_moment" },
  strict: true,
  verbose: true,
});
