import { redirect } from 'next/navigation';
import { getUser } from '@/features/auth/queries';
import { logoutAction } from '@/features/auth/actions';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/layout/brand-mark';

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
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/80 px-6 py-3 backdrop-blur sm:px-10">
        <BrandMark href="/dashboard" size="sm" />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.email}
          </span>
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
