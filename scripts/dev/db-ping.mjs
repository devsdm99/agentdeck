import { config } from 'dotenv';
import postgres from 'postgres';
config({ path: '.env.local' });

const url = process.env.DATABASE_URL;
console.log('Pinging:', url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));

const sql = postgres(url, { prepare: false, connect_timeout: 10 });

const t0 = Date.now();
const r = await sql`SELECT 1 as ok, current_database() as db, version() as v`;
console.log('OK in', Date.now() - t0, 'ms');
console.log(r[0]);

const t1 = Date.now();
const tables = await sql`
  SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'
`;
console.log('information_schema query took', Date.now() - t1, 'ms, tables:', tables[0].n);

await sql.end();
