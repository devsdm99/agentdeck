import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import { getRepoBySlug } from '@/features/repos/queries';
import { getScanDetail } from '@/features/scans/queries';
import { Card, CardContent } from '@/components/ui/card';
import { formatBytes } from '@/utils/format';

type Params = Promise<{ slug: string; scanId: string; agentId: string }>;

export default async function AgentDetailPage({
  params,
}: {
  params: Params;
}): Promise<React.ReactElement> {
  const user = await requireUser();
  const { slug, scanId, agentId } = await params;

  const repo = await getRepoBySlug(user.id, slug);
  if (!repo) notFound();

  const detail = await getScanDetail(scanId, repo.id);
  if (!detail) notFound();

  const agent = detail.agents.find((a) => a.id === agentId);
  if (!agent) notFound();

  const hasFrontmatter =
    agent.frontmatter !== null &&
    typeof agent.frontmatter === 'object' &&
    Object.keys(agent.frontmatter as Record<string, unknown>).length > 0;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10">
      <header className="flex flex-col gap-3">
        <Link
          href={`/repos/${slug}/scans/${scanId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al scan
        </Link>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Agent
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {agent.name}
          </h1>
          <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{agent.filePath}</span>
            <span aria-hidden>·</span>
            <span className="font-mono tabular-nums">
              {formatBytes(agent.fileSizeBytes)}
            </span>
          </div>
        </div>
      </header>

      {agent.description ? (
        <p className="text-base leading-relaxed text-foreground">
          {agent.description}
        </p>
      ) : null}

      {agent.model || agent.tools.length > 0 ? (
        <section className="flex flex-wrap items-start gap-x-8 gap-y-4">
          {agent.model ? (
            <Meta label="Model">
              <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs">
                {agent.model}
              </span>
            </Meta>
          ) : null}
          {agent.tools.length > 0 ? (
            <Meta label="Tools">
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
            </Meta>
          ) : null}
        </section>
      ) : null}

      {hasFrontmatter ? (
        <SectionBlock title="Frontmatter">
          <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
            {JSON.stringify(agent.frontmatter, null, 2)}
          </pre>
        </SectionBlock>
      ) : null}

      {agent.fileRawContent ? (
        <SectionBlock title="Contenido">
          <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
            {agent.fileRawContent}
          </pre>
        </SectionBlock>
      ) : null}
    </main>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <Card className="border-border/70">
        <CardContent className="p-0">{children}</CardContent>
      </Card>
    </section>
  );
}
