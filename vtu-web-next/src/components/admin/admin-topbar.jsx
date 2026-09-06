'use client';

import { Bell, Menu, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminTopbar({ title = 'Admin', onOpenMenu, theme = 'light', onToggleTheme, onOpenSupport }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-4 py-3 md:px-6 lg:px-8">
        <Button variant="secondary" size="icon" className="h-9 w-9 lg:hidden" onClick={onOpenMenu}>
          <Menu className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="truncate">{title}</span>
          </div>
          <div className="hidden text-xs text-muted-foreground md:block">Mele Data internal operations dashboard</div>
        </div>

        <label className="relative hidden w-full max-w-xl items-center md:flex">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input readOnly value="Search users, references, and operations" className="pl-10 text-muted-foreground" />
        </label>

        <Button variant="secondary" size="icon" onClick={onOpenSupport} title="Support inbox">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
