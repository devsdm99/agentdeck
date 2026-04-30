import { config } from 'dotenv';
import postgres from 'postgres';
import { readFileSync } from 'node:fs';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/dev/apply-trigger.mjs <path-to-sql>');
  process.exit(1);
}

const content = readFileSync(file, 'utf8');
console.log('Applying:', file);
await sql.unsafe(content);
console.log('Applied OK');

await sql.end();
