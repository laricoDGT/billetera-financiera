import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { loadEnv } from "vite";

// Load environment variables manually
const env = loadEnv("", process.cwd(), "");
const DATABASE_URL = env.DATABASE_URL || process.env.DATABASE_URL;

// Verify DATABASE_URL is available
if (!DATABASE_URL) {
    console.error("Available env keys:", Object.keys(env).filter(k => k.includes("DATA")));
    throw new Error("DATABASE_URL is not defined in environment variables");
}

console.log("DATABASE_URL configured:", DATABASE_URL.substring(0, 30) + "...");

export const auth = betterAuth({
    database: new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // Neon requires SSL
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        // Add providers here later
    }
});
