import Link from 'next/link';

export function BrandMark({
  href = '/',
  size = 'default',
}: {
  href?: string;
  size?: 'sm' | 'default';
}): React.ReactElement {
  const wrapperClasses =
    size === 'sm'
      ? 'inline-flex items-center gap-2 text-sm font-semibold tracking-tight'
      : 'inline-flex items-center gap-2 text-base font-semibold tracking-tight';
  const dotClasses =
    size === 'sm'
      ? 'size-3 rounded-[6px] bg-primary shadow-[0_0_0_3px_oklch(var(--primary)/0.18)]'
      : 'size-3.5 rounded-[7px] bg-primary shadow-[0_0_0_3px_oklch(var(--primary)/0.18)]';

  return (
    <Link href={href} className={wrapperClasses}>
      <span aria-hidden className={dotClasses} />
      <span>agentdeck</span>
    </Link>
  );
}
