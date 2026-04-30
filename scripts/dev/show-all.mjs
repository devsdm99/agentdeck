import { config } from 'dotenv';
import postgres from 'postgres';
config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

console.log('═══ PROFILES ═══');
const profiles = await sql`SELECT id, email, created_at FROM profiles`;
console.table(profiles);

console.log('\n═══ REPOS ═══');
const repos = await sql`SELECT id, name, slug, visibility, is_archived FROM repos`;
console.table(repos);

console.log('\n═══ REPO_SOURCES ═══');
const sources = await sql`SELECT id, repo_id, kind, url, default_branch, is_primary FROM repo_sources`;
console.table(sources);

console.log('\n═══ SCANS ═══');
const scans = await sql`SELECT id, repo_id, status, trigger, branch, started_at, finished_at FROM scans ORDER BY started_at DESC`;
console.table(scans);

console.log('\n═══ SCAN_STATS (último scan) ═══');
const lastScan = scans[0];
if (lastScan) {
  const stats = await sql`SELECT * FROM scan_stats WHERE scan_id = ${lastScan.id}`;
  console.table(stats);

  console.log('\n═══ SCAN_FILES (último scan) ═══');
  const files = await sql`SELECT path, kind, size_bytes FROM scan_files WHERE scan_id = ${lastScan.id} ORDER BY path`;
  console.table(files);

  console.log('\n═══ SCAN_AGENTS (último scan) ═══');
  const agents = await sql`SELECT name, description, model FROM scan_agents WHERE scan_id = ${lastScan.id}`;
  console.table(agents);

  console.log('\n═══ SCAN_SKILLS (último scan) ═══');
  const skills = await sql`SELECT name, substring(description for 80) AS description FROM scan_skills WHERE scan_id = ${lastScan.id}`;
  console.table(skills);

  console.log('\n═══ SCAN_HOOKS (último scan) ═══');
  const hooks = await sql`SELECT event, matcher, command, timeout_ms, run_order FROM scan_hooks WHERE scan_id = ${lastScan.id}`;
  console.table(hooks);
}

await sql.end();
