import { config } from 'dotenv';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const userId = '00000000-0000-0000-0000-000000000001';
const email = 'test@agentdeck.local';

await sql`
  INSERT INTO profiles (id, email)
  VALUES (${userId}, ${email})
  ON CONFLICT (id) DO NOTHING
`;

const slug = 'agentdeck-claude-setup';
const existing = await sql`
  SELECT id FROM repos WHERE user_id = ${userId} AND slug = ${slug} LIMIT 1
`;

let repoId;
if (existing.length > 0) {
  repoId = existing[0].id;
  console.log('repo already exists:', repoId);
} else {
  repoId = randomUUID();
  await sql`
    INSERT INTO repos (id, user_id, name, slug, description)
    VALUES (${repoId}, ${userId}, 'agentdeck-claude-setup', ${slug}, 'Setup repo del propio agentdeck — dogfooding')
  `;
  console.log('repo created:', repoId);
}

console.log('---');
console.log('USER_ID =', userId);
console.log('REPO_ID =', repoId);

await sql.end();
