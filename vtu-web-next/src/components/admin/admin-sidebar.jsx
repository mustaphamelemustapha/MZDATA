'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftRight, LogOut, ShieldCheck, X } from 'lucide-react';
import { adminNav } from '@/lib/admin-nav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminSidebar({ profile, onSignOut, mobile = false, onClose }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col bg-card/60 backdrop-blur-3xl text-card-foreground border-r border-border/40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      <div className="border-b border-border/40 p-5">
        <div className="flex items-center justify-between gap-2">
          <Link href="/admin" className="flex min-w-0 items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary/80 ring-1 ring-border/50 shadow-sm transition-transform group-hover:scale-105">
              <img src="/brand/meledata-icon.png" alt="MZDATA logo" className="h-full w-full object-contain p-1" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-bold text-foreground">MZDATA Admin</div>
              <div className="truncate text-[11px] font-medium tracking-wide text-primary/80 uppercase mt-0.5">Control Center</div>
            </div>
          </Link>
          {mobile ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-secondary" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <div className="mt-5 rounded-2xl border border-border/30 bg-secondary/40 backdrop-blur-md p-3.5 shadow-inner">
          <div className="truncate text-sm font-semibold text-foreground">{profile?.full_name || profile?.email || 'Admin User'}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Role: <span className="capitalize">{String(profile?.role || 'admin')}</span>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-4 custom-scrollbar">
        {adminNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-all duration-200',
                active
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/40 p-4 space-y-2">
        <Button
          asChild
          variant="outline"
          className="w-full justify-start gap-3 rounded-xl border-border/50 bg-card/50 text-foreground hover:bg-secondary/80 backdrop-blur-md transition-all"
        >
          <Link href="/dashboard">
            <ArrowLeftRight className="h-4 w-4" />
            Switch to User App
          </Link>
        </Button>
        <Button
          variant="destructive"
          className="w-full justify-start gap-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-transparent hover:border-destructive transition-all"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out securely
        </Button>
      </div>
    </aside>
  );
}
