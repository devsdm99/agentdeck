import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { getUser } from '@/features/auth/queries';

export default async function HomePage(): Promise<React.ReactElement> {
  const user = await getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex w-full max-w-2xl flex-col items-start gap-6">
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Build-in-public · Pre-alpha
        </span>

        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Tu setup multi-agente Claude Code, visualizado.
        </h1>

        <p className="text-lg text-muted-foreground">
          agentdeck escanea cualquier repositorio con `.claude/agents/`,
          `.claude/skills/` o `.claude/hooks/` y te lo enseña en un
          dashboard limpio. Sin abrir doce markdown a mano.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <Link href="/dashboard" className={buttonVariants({ size: 'lg' })}>
              Ir al dashboard
            </Link>
          ) : (
            <>
              <Link href="/signup" className={buttonVariants({ size: 'lg' })}>
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ size: 'lg', variant: 'secondary' })}
              >
                Entrar
              </Link>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Construido en público durante 8 semanas en{' '}
          <a
            href="https://sergiodima.dev/multiagente"
            className="underline"
            rel="noreferrer"
          >
            la newsletter Multiagente
          </a>
          .
        </p>
      </div>
    </main>
  );
}
