import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import { getRepoBySlug } from '@/features/repos/queries';
import {
  getScanSummary,
  type ScanAgentSummary,
  type ScanHookSummary,
  type ScanSkillSummary,
} from '@/features/scans/queries';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatBytes, formatDateTime } from '@/utils/format';

type Params = Promise<{ slug: string; scanId: string }>;

export default async function ScanDetailPage({
  params,
}: {
  params: Params;
}): Promise<React.ReactElement> {
  const user = await requireUser();
  const { slug, scanId } = await params;

  const repo = await getRepoBySlug(user.id, slug);
  if (!repo) notFound();

  const summary = await getScanSummary(scanId, repo.id);
  if (!summary) notFound();

  const { scan, stats, agents, skills, hooks } = summary;
  const totalFiles = stats?.totalFiles ?? 0;
  const totalSize = stats?.totalSizeBytes ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-3">
        <Link
          href={`/repos/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a {repo.name}
        </Link>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Scan
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatDateTime(scan.startedAt)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <StatusPill status={scan.status} />
          {scan.branch ? (
            <span className="font-mono">· {scan.branch}</span>
          ) : null}
          <span className="uppercase tracking-wider">· {scan.trigger}</span>
          {scan.commitSha ? (
            <span className="font-mono">· {scan.commitSha.slice(0, 7)}</span>
          ) : null}
        </div>
        {scan.errorMessage ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {scan.errorMessage}
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums">{totalFiles}</span>{' '}
          {totalFiles === 1 ? 'archivo' : 'archivos'} ·{' '}
          {formatBytes(totalSize)} ·{' '}
          <span className="tabular-nums">{agents.length}</span>{' '}
          {agents.length === 1 ? 'agent' : 'agents'} ·{' '}
          <span className="tabular-nums">{skills.length}</span>{' '}
          {skills.length === 1 ? 'skill' : 'skills'} ·{' '}
          <span className="tabular-nums">{hooks.length}</span>{' '}
          {hooks.length === 1 ? 'hook' : 'hooks'}
        </p>
      </header>

      {agents.length === 0 && skills.length === 0 && hooks.length === 0 ? (
        <EmptyContent />
      ) : null}

      {agents.length > 0 ? (
        <Section title="Agents" count={agents.length}>
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/repos/${slug}/scans/${scanId}/agents/${agent.id}`}
              className="group block focus:outline-none"
            >
              <AgentCard agent={agent} />
            </Link>
          ))}
        </Section>
      ) : null}

      {skills.length > 0 ? (
        <Section title="Skills" count={skills.length}>
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </Section>
      ) : null}

      {hooks.length > 0 ? (
        <Section title="Hooks" count={hooks.length}>
          {hooks.map((hook) => (
            <HookCard key={hook.id} hook={hook} />
          ))}
        </Section>
      ) : null}
    </main>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">
        {title}{' '}
        <span className="text-base font-normal tabular-nums text-muted-foreground">
          ({count})
        </span>
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function EmptyContent(): React.ReactElement {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">
          Este scan no encontró agentes, skills ni hooks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          El repo escaneado no tiene un directorio{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            .claude/
          </code>{' '}
          en esta rama, o sus archivos no siguen el formato esperado por
          agentdeck. Próximamente: detección de layouts alternativos.
        </p>
      </CardContent>
    </Card>
  );
}

function AgentCard({
  agent,
}: {
  agent: ScanAgentSummary;
}): React.ReactElement {
  return (
    <Card className="border-border/70 transition-colors group-hover:border-primary/40 group-focus-visible:border-primary/60 group-focus-visible:ring-3 group-focus-visible:ring-ring/30">
      <CardHeader className="gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-base">{agent.name}</CardTitle>
          <span className="font-mono text-xs text-muted-foreground">
            {formatBytes(agent.fileSizeBytes)}
          </span>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {agent.filePath}
        </p>
      </CardHeader>
      {agent.description || agent.model || agent.tools.length > 0 ? (
        <CardContent className="flex flex-col gap-4">
          {agent.description ? (
            <p className="text-sm text-foreground">{agent.description}</p>
          ) : null}
          {agent.model ? (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Pill label="model" value={agent.model} />
            </div>
          ) : null}
          {agent.tools.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tools
              </span>
              <div className="flex flex-wrap gap-1.5">
                {agent.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md border border-border bg-muted/50 px-2 py-0.5 font-mono text-xs"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

function SkillCard({
  skill,
}: {
  skill: ScanSkillSummary;
}): React.ReactElement {
  return (
    <Card className="border-border/70">
      <CardHeader className="gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-base">{skill.name}</CardTitle>
          <span className="font-mono text-xs text-muted-foreground">
            {formatBytes(skill.fileSizeBytes)}
          </span>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {skill.filePath}
        </p>
      </CardHeader>
      {skill.description || skill.triggers.length > 0 ? (
        <CardContent className="flex flex-col gap-4">
          {skill.description ? (
            <p className="text-sm text-foreground">{skill.description}</p>
          ) : null}
          {skill.triggers.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Triggers
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skill.triggers.map((trigger, idx) => (
                  <span
                    key={idx}
                    className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

function HookCard({ hook }: { hook: ScanHookSummary }): React.ReactElement {
  return (
    <Card className="border-border/70">
      <CardHeader className="gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-base">
            <span className="font-mono">{hook.event}</span>
          </CardTitle>
          {hook.timeoutMs ? (
            <span className="font-mono text-xs text-muted-foreground">
              timeout {hook.timeoutMs}ms
            </span>
          ) : null}
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {hook.filePath}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {hook.matcher ? (
          <div className="flex items-baseline gap-2 text-xs">
            <span className="font-medium uppercase tracking-wider text-muted-foreground">
              matcher
            </span>
            <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 font-mono">
              {hook.matcher}
            </span>
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            command
          </span>
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
            {hook.command}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

function Pill({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs">
      <span className="uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono">{value}</span>
    </span>
  );
}

function StatusPill({
  status,
}: {
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
}): React.ReactElement {
  const map: Record<typeof status, { dot: string; label: string }> = {
    success: { dot: 'bg-primary', label: 'Success' },
    failed: { dot: 'bg-destructive', label: 'Failed' },
    running: { dot: 'bg-amber-500 animate-pulse', label: 'Running' },
    pending: { dot: 'bg-muted-foreground/40', label: 'Pending' },
    cancelled: { dot: 'bg-muted-foreground/40', label: 'Cancelled' },
  };
  const { dot, label } = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 font-medium uppercase tracking-wider">
      <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
