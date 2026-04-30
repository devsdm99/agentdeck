import { config } from 'dotenv';
import postgres from 'postgres';
config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const rows = await sql`
  SELECT a.name, t.tool_name
  FROM scan_agents a
  JOIN scan_agent_tools t ON t.agent_id = a.id
  WHERE a.scan_id = ${process.argv[2]}
  ORDER BY a.name, t.tool_name`;
console.log('AGENT TOOLS (' + rows.length + '):');
for (const r of rows) console.log('  -', r.name, '·', r.tool_name);
await sql.end();
