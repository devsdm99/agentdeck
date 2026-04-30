import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { getUser } from '@/features/auth/queries';

export default async function HomePage(): Promise<React.ReactElement> {
  const user = await getUser();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <BackgroundGrid />

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-24 pt-32 sm:pt-40">
        <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
          <span className="size-1.5 rounded-full bg-primary" />
          Build-in-public · Pre-alpha · Semana 2
        </span>

        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Tu setup multi-agente Claude Code,{' '}
          <span className="text-primary">visualizado</span>.
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
          agentdeck escanea cualquier repo con `.claude/agents/`, `.claude/skills/`
          o `.claude/hooks/` y te lo enseña en un dashboard limpio. Sin abrir
          doce markdown a mano para entender qué hace cada agente.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className={buttonVariants({ size: 'lg', className: 'h-11 px-6' })}
            >
              Ir al dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className={buttonVariants({ size: 'lg', className: 'h-11 px-6' })}
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className={buttonVariants({
                  size: 'lg',
                  variant: 'outline',
                  className: 'h-11 px-6',
                })}
              >
                Entrar
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <FeatureCard
            title="Escaneo por URL o zip"
            body="Conecta cualquier repo público de GitHub o sube un .zip. Sin git clone, sin filesystem."
          />
          <FeatureCard
            title="Histórico tipado"
            body="Cada scan es un snapshot inmutable. Diff entre versiones para ver cómo evolucionan tus agentes."
          />
          <FeatureCard
            title="Sin magia"
            body="Todo es tipado, todo es auditable. Ingeniería real, no prompts mágicos."
          />
        </div>

        <p className="mt-20 text-sm text-muted-foreground">
          Construido en público durante 8 semanas en{' '}
          <a
            href="https://sergiodima.dev/multiagente"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            rel="noreferrer"
          >
            la newsletter Multiagente
          </a>
          . Cada martes a las 9:00 CET.
        </p>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  body,
}: {
  title: string;
  body: string;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur transition-colors hover:border-primary/40 hover:bg-card">
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function BackgroundGrid(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,oklch(0.9_0.008_240/0.4)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.9_0.008_240/0.4)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)] dark:[background-image:linear-gradient(to_right,oklch(1_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.06)_1px,transparent_1px)]"
    />
  );
}
