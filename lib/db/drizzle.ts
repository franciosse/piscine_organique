import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;

export const client = postgres(connectionString, {
  prepare: false, // Important pour les fonctions serverless
  max: 1, // Limite à 1 connexion pour Vercel
  idle_timeout: 20,
  connect_timeout: 60,
});

export const db = drizzle(client, { schema });