'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen admin-page-bg">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-[264px] flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-3 left-3 z-40 lg:hidden rounded-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm shadow-sm border border-amber-200/40 dark:border-stone-700"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[264px] p-0">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <AdminSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 pt-14 lg:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
