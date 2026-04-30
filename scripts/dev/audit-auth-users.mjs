import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const rows = await sql`
  SELECT
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.id IS NOT NULL AS has_profile
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC
`;

console.log('AUTH USERS (' + rows.length + '):');
for (const r of rows) {
  console.log('  -', r.id, '·', r.email, '· confirmed:', r.email_confirmed_at ? 'yes' : 'NO', '· profile:', r.has_profile ? 'yes' : 'NO', '· created:', r.created_at.toISOString());
}

await sql.end();
