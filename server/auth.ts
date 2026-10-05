import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db.js";
import * as schema from "./schema.js";
import { authSecret, apiUrl, appUrl, production } from "./config.js";
import { sendMail } from "./mail.js";
export const auth = betterAuth({
  secret: authSecret,
  baseURL: apiUrl,
  basePath: "/api/auth",
  database: drizzleAdapter(db, { provider: "sqlite", schema }),
  trustedOrigins: [appUrl, apiUrl, "propertyportal://"],
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) =>
      sendMail(user.email, "Reset your password", url),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) =>
      sendMail(user.email, "Verify your email", url),
  },
  session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
  advanced: { useSecureCookies: production },
  rateLimit: { enabled: process.env.NODE_ENV !== "test", window: 60, max: 30 },
});
