'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const APP_LINKS = [
  { href: '/subjects', label: 'Subjects' },
  { href: '/tags', label: 'Tags' },
  { href: '/problems', label: 'Problems' },
  { href: '/problem-sets', label: 'Problem Sets' },
] as const;

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        'text-sm text-muted-foreground hover:text-foreground transition-colors',
        active && 'text-foreground font-medium'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      className={cn('w-full', active && 'font-medium text-foreground')}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}

export function AppNavLinks() {
  return (
    <>
      <div className="hidden items-center gap-5 md:flex">
        {APP_LINKS.map(l => (
          <NavLink key={l.href} href={l.href} label={l.label} />
        ))}
      </div>

      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {APP_LINKS.map(l => (
              <DropdownMenuItem key={l.href} asChild>
                <MobileNavLink href={l.href} label={l.label} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
