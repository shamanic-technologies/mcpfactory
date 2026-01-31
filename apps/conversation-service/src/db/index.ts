import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.CONVERSATION_SERVICE_DATABASE_URL;

if (!connectionString) {
  throw new Error("CONVERSATION_SERVICE_DATABASE_URL is not set");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
