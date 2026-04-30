import Link from 'next/link';
import { BrandMark } from '@/components/layout/brand-mark';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <BrandMark />
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <a
            href="https://sergiodima.dev/multiagente"
            className="hidden hover:text-foreground sm:inline"
            rel="noreferrer"
          >
            Newsletter
          </a>
          <Link href="/login" className="hover:text-foreground">
            Entrar
          </Link>
        </nav>
      </header>
      <div className="flex flex-1">{children}</div>
    </div>
  );
}
