'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  BookOpen,
  FolderOpen,
  BarChart3,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const APP_LINKS = [
  {
    href: '/subjects',
    label: 'Subjects',
    icon: BookOpen,
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    href: '/problem-sets',
    label: 'Problem Sets',
    icon: FolderOpen,
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    href: '/statistics',
    label: 'Statistics',
    icon: BarChart3,
    iconBg: 'bg-green-500/10 dark:bg-green-500/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    href: '/insights',
    label: 'Insights',
    icon: Lightbulb,
    iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
];

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
        'text-base text-muted-foreground hover:text-foreground transition-colors',
        active && 'text-foreground font-medium'
      )}
      aria-current={active ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  iconBg,
  iconColor,
  onClick,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 text-gray-600 dark:text-gray-400',
        active && 'font-semibold text-gray-900 dark:text-white'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          iconBg
        )}
      >
        <Icon className={cn('h-[18px] w-[18px]', iconColor)} />
      </span>
      <span className="text-[15px]">{label}</span>
    </Link>
  );
}

export function AppNavLinks() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden items-center gap-6 md:flex">
        {APP_LINKS.map(l => (
          <NavLink key={l.href} href={l.href} label={l.label} />
        ))}
      </div>

      <div className="md:hidden">
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-full space-y-2 rounded-xl border-amber-200/40 p-2 dark:border-amber-800/30"
          >
            {APP_LINKS.map(l => (
              <DropdownMenuItem
                key={l.href}
                asChild
                className="rounded-lg px-2.5 py-2.5 focus:bg-amber-50/80 dark:focus:bg-amber-900/20"
              >
                <MobileNavLink
                  href={l.href}
                  label={l.label}
                  icon={l.icon}
                  iconBg={l.iconBg}
                  iconColor={l.iconColor}
                  onClick={() => setOpen(false)}
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
