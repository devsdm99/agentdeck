import { config } from 'dotenv';
import type { Config as DrizzleConfig } from 'drizzle-kit';

// drizzle-kit no es Next.js: tenemos que cargar .env.local a mano
config({ path: '.env.local' });

// Tanto drizzle-kit como la app usan DATABASE_URL (Supavisor pooler en
// puerto 6543). La conexión directa al puerto 5432 (DIRECT_URL) solo
// funciona desde redes con IPv6 público, lo cual NO es el caso desde
// la mayoría de ISPs domésticos en España. El pooler responde por IPv4
// y soporta DDL en mode `session` (modo por defecto del Supavisor de
// Supabase con la URL "Transaction pooler").
//
// LESSON #2 (2026-04-29): Supabase direct host es IPv6-only desde Q4 2024.
// Si tu red no tiene IPv6 público, drizzle-kit push se cuelga
// indefinidamente en "Pulling schema". Solución: usar siempre la URL
// del pooler para todo (runtime + migraciones).
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('Falta DATABASE_URL en .env.local');
}

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
} satisfies DrizzleConfig;
