import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch for serverless environments (Vercel)
// ssl: 'require' needed for Supabase
const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: 1,
});

export const db = drizzle(client, { schema });
