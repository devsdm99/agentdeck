import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const scanId = process.argv[2];
if (!scanId) {
  console.error('usage: node scripts/inspect-scan.mjs <scanId>');
  process.exit(1);
}

const [scan] = await sql`SELECT * FROM scans WHERE id = ${scanId} LIMIT 1`;
console.log('SCAN:', { id: scan.id, status: scan.status, branch: scan.branch, started: scan.started_at, finished: scan.finished_at });

const [stats] = await sql`SELECT * FROM scan_stats WHERE scan_id = ${scanId}`;
console.log('STATS:', stats);

const files = await sql`SELECT path, kind, size_bytes FROM scan_files WHERE scan_id = ${scanId} ORDER BY path`;
console.log('FILES (' + files.length + '):');
for (const f of files) console.log('  -', f.path, '·', f.kind, '·', f.size_bytes, 'bytes');

const agents = await sql`SELECT name, description, model FROM scan_agents WHERE scan_id = ${scanId}`;
console.log('AGENTS (' + agents.length + '):');
for (const a of agents) console.log('  -', a.name, '—', a.description?.slice(0, 80) ?? '(no desc)', a.model ? '· ' + a.model : '');

const skills = await sql`SELECT s.name, s.description, array_agg(t.trigger_text) FILTER (WHERE t.trigger_text IS NOT NULL) AS triggers
                          FROM scan_skills s
                          LEFT JOIN scan_skill_triggers t ON t.skill_id = s.id
                          WHERE s.scan_id = ${scanId}
                          GROUP BY s.id, s.name, s.description`;
console.log('SKILLS (' + skills.length + '):');
for (const s of skills) console.log('  -', s.name, '—', s.description?.slice(0, 80) ?? '(no desc)', '· triggers:', s.triggers ?? []);

const hooks = await sql`SELECT event, matcher, command FROM scan_hooks WHERE scan_id = ${scanId}`;
console.log('HOOKS (' + hooks.length + '):');
for (const h of hooks) console.log('  -', h.event, '· matcher:', h.matcher ?? '(any)', '· cmd:', h.command.slice(0, 60));

await sql.end();
