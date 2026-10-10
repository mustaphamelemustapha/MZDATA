'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftRight, LogOut, ShieldCheck, X } from 'lucide-react';
import { adminNav } from '@/lib/admin-nav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function AdminSidebar({ profile, onSignOut, mobile = false, onClose }) {
  const pathname = usePathname();

  // Group nav items
  const mainNav = adminNav.slice(0, 6); // Overview, Finance, Users, Agents, Ambassadors, API Users
  const operationsNav = adminNav.slice(6, 9); // Transactions, Wallets, Services
  const configNav = adminNav.slice(9); // Data Plans, Referrals, Promos, Integrations, Support, Settings

  const NavGroup = ({ title, items }) => (
    <div className="space-y-1 mb-5">
      <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200',
              active
                ? 'text-brand font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            {active && (
              <motion.div
                layoutId="activeAdminNavIndicator"
                className="absolute inset-0 rounded-xl bg-brand/10 border border-brand/20"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={cn('h-4 w-4 relative z-10 transition-colors', active ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground')} />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="flex h-full flex-col bg-card/80 backdrop-blur-xl border-r border-border text-card-foreground">
      <div className="border-b border-border/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <Link href="/admin" className="flex min-w-0 items-center gap-3 group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-brand/20 to-brand/5 ring-1 ring-brand/30 transition-transform group-hover:scale-105">
              <img src="/brand/mzdata-logo.jpg" alt="MZDATA logo" className="h-full w-full object-contain p-0.5 rounded-lg" onError={(e) => { e.target.src = "/brand/meledata-icon.png"; }} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-foreground tracking-tight">MZDATA Admin</div>
              <div className="truncate text-xs text-muted-foreground font-medium">Command Center</div>
            </div>
          </Link>
          {mobile ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-border/50 bg-gradient-to-b from-secondary/50 to-secondary/10 p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center border border-brand/20">
              <span className="text-sm font-bold text-brand">{(profile?.full_name || profile?.email || 'A')[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{profile?.full_name || profile?.email || 'Admin user'}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span className="capitalize">{String(profile?.role || 'admin')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
        <NavGroup title="Analytics & Users" items={mainNav} />
        <NavGroup title="Transactions & Services" items={operationsNav} />
        <NavGroup title="Catalog & Configuration" items={configNav} />
      </nav>

      <div className="border-t border-border/50 p-4 space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2 rounded-xl text-xs h-9" asChild>
          <Link href="/app">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            User Dashboard
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 rounded-xl text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-9"
          onClick={onSignOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
