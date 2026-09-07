'use client';

import { Bell, Menu, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminTopbar({ title = 'Admin', onOpenMenu, theme = 'light', onToggleTheme, onOpenSupport }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/70 backdrop-blur-2xl shadow-sm">
      <div className="flex items-center gap-4 px-4 py-3 md:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden hover:bg-secondary/80 rounded-full" onClick={onOpenMenu}>
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1 lg:flex-none lg:w-64">
          <div className="flex items-center gap-2.5 text-base font-bold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="truncate tracking-tight">{title}</span>
          </div>
        </div>

        <div className="hidden flex-1 md:flex items-center justify-center">
          <label className="relative w-full max-w-xl flex items-center group">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input 
              readOnly 
              value="Search users, references, and operations" 
              className="pl-10 h-10 bg-secondary/50 border-border/50 hover:bg-secondary/80 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm rounded-xl cursor-text" 
            />
          </label>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={onOpenSupport} title="Support inbox" className="relative hover:bg-secondary/80 rounded-full">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="hover:bg-secondary/80 rounded-full text-muted-foreground hover:text-primary transition-colors">
            <Sparkles className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
