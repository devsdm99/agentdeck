import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/features/auth/queries';
import { logoutAction } from '@/features/auth/actions';
import { Button } from '@/components/ui/button';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <Link href="/dashboard" className="text-sm font-semibold">
          agentdeck
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </header>
      <div className="flex flex-1">{children}</div>
    </div>
  );
}
