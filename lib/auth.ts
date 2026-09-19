import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";

const socialProviders = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
  : undefined;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "mysql", schema }),
  secret: process.env.BETTER_AUTH_SECRET || "little-moment-local-development-secret-change-me",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3010",
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010"],
  socialProviders,
  emailAndPassword: { enabled: true },
  session: {
    // Keep the primary session cookie valid for 30 days so returning users do
    // not need to authenticate every time they reopen the app.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Cache the signed/encrypted session payload for five minutes. The family
    // membership is still checked from MySQL by every family API route. Do not
    // enable refreshCache here: Better Auth reserves it for stateless setups.
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: "jwe",
    },
  },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
});
