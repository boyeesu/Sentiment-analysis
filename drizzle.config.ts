import { defineConfig } from "drizzle-kit";

// Note: This config is for future database use. The app is currently stateless.
// If you need to use the database, set DATABASE_URL environment variable.
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Database features will be unavailable.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://placeholder",
  },
});
