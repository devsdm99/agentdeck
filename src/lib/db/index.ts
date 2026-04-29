import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { serverEnv } from '@/lib/env';
import * as schema from './schema';

const env = serverEnv();
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });

export type DB = typeof db;
