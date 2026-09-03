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
    <aside className="flex h-full flex-col bg-card text-card-foreground">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary ring-1 ring-border">
              <img src="/brand/mzdata-icon.png" alt="MZDATA logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">MZDATA Admin</div>
              <div className="truncate text-xs text-muted-foreground">Operations control center</div>
            </div>
          </Link>
          {mobile ? (
            <Button variant="secondary" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <div className="mt-3 rounded-2xl border border-border bg-secondary p-3">
          <div className="truncate text-sm font-medium text-foreground">{profile?.full_name || profile?.email || 'Admin user'}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Role: {String(profile?.role || 'admin').toLowerCase()}
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {adminNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition',
                active
                  ? 'border-primary/35 bg-primary/10 text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          asChild
          variant="secondary"
          className="mb-2 w-full justify-center border-border bg-card text-foreground hover:bg-secondary"
        >
          <Link href="/dashboard">
            <ArrowLeftRight className="h-4 w-4" />
            User account
          </Link>
        </Button>
        <Button
          variant="destructive"
          className="w-full justify-center"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
