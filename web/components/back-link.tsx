import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackLinkProps {
  /** Renders as a Next.js Link when provided */
  href?: string;
  /** Renders as a button with onClick when provided (used with router.push) */
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BackLink({
  href,
  onClick,
  children,
  className,
}: BackLinkProps) {
  const classes = cn('back-link', className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        <ArrowLeft className="h-3.5 w-3.5" />
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      <ArrowLeft className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
