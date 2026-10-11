'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  CircleDollarSign,
  Clock3,
  Code2,
  GraduationCap,
  Gauge,
  Headphones,
  LogOut,
  Menu,
  Package2,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv2,
  UserCircle2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { appNav } from '@/lib/nav';
import { clearAuth, apiFetch, getProfile, getToken, setProfile } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrandLoader } from '@/components/brand-loader';

function brandInitials(profile) {
  const name = String(profile?.full_name || profile?.email || 'MZDATA').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]).join('');
  return (letters || 'AX').toUpperCase();
}

const mobilePrimaryMenu = [
  { label: 'Dashboard', href: '/dashboard', icon: Gauge },
  { label: 'Data', href: '/buy-data', icon: Package2 },
  { label: 'Airtime', href: '/airtime', icon: Smartphone },
  { label: 'Cable TV', href: '/cable-tv', icon: Tv2 },
  { label: 'Electricity', href: '/electricity', icon: Zap },
  { label: 'Education', href: '/exam-pins', icon: GraduationCap },
  { label: 'Wallet', href: '/wallet', icon: CircleDollarSign },
  { label: 'Referrals', href: '/referrals', icon: Users },
  { label: 'API Documentation', href: '/api-docs', icon: Code2 },
  { label: 'Transaction history', href: '/history', icon: Clock3 },
];

const mobileSettingsMenu = [
  { label: 'Profile', href: '/profile', icon: UserCircle2 },
  { label: 'Security', href: '/profile#security', icon: ShieldCheck },
  { label: 'Support', href: 'mailto:mzdatamzdata2@gmail.com', icon: Headphones, external: true },
  { label: 'WhatsApp Channel', href: 'https://whatsapp.com/channel/0029VbCanujEawdvqLAYu83T', icon: Headphones, external: true },
  { label: 'TikTok Page', href: 'https://www.tiktok.com/@mzdata_ng', icon: Tv2, external: true },
];

function MobileMenuLink({ item, activePath }) {
  const Icon = item.icon;
  const active = !item.external && (activePath === item.href || activePath.startsWith(`${item.href}/`));
  const className = cn(
    'group flex items-center gap-2.5 rounded-xl border px-2.5 py-2.5 font-medium transition',
    active
      ? 'border-primary/30 bg-primary/10 text-foreground shadow-sm'
      : 'border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground'
  );
  const content = (
    <>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition',
          active
            ? 'border-primary/25 bg-primary text-primary-foreground'
            : 'border-border bg-card text-muted-foreground group-hover:text-primary'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 truncate text-[13px]">{item.label}</span>
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

export function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState(getProfile());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  const handleSignOut = useCallback(() => {
    clearAuth();
    router.replace('/');
  }, [router]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/');
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const me = await apiFetch('/auth/me');
        if (!mounted) return;
        setProfile(me);
        setProfileState(me);
      } catch {
        clearAuth();
        router.replace('/');
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(current);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const activePath = useMemo(() => pathname || '/dashboard', [pathname]);
  const activePage = useMemo(
    () => appNav.find((item) => activePath === item.href || activePath.startsWith(`${item.href}/`)),
    [activePath]
  );

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(next);
      window.localStorage.setItem('axis-theme', next);
      return next;
    });
  }, []);

  if (!ready) {
    return (
      <BrandLoader
        message="Loading MZ DATA"
        subtitle="Synchronizing your account and wallet balance..."
      />
    );
  }

  const initials = brandInitials(profile);

  return (
    <div className="axis-shell grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden border-r border-border bg-card p-5 text-card-foreground lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-y-auto">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            <img src="/brand/meledata-icon.png" alt="MZDATA logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">MZDATA</div>
            <div className="text-xs text-muted-foreground">Fintech dashboard</div>
          </div>
        </Link>

        <nav className="mt-8 space-y-2">
          {appNav.map((item) => {
            const Icon = item.icon;
            const active = activePath === item.href || activePath.startsWith(`${item.href}/`);
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </a>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition',
                  active
                    ? 'border-primary/35 bg-primary/12 text-foreground shadow-lg shadow-blue-500/10'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 rounded-3xl border border-border bg-secondary p-4">
          <div className="grid gap-2">
            {profile?.role === 'admin' && (
              <Button variant="secondary" className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" onClick={() => router.push('/admin')}>
                <Settings2 className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Button>
            )}
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 bg-background">
        <header
          className="sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 px-3 py-2.5 md:px-6 md:py-3 lg:px-8">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                'h-9 w-9 shrink-0 rounded-xl md:hidden',
                'border-border bg-card text-foreground hover:bg-secondary'
              )}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              title="Menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1 md:hidden">
              <div className="truncate text-sm font-semibold text-foreground">
                {activePage?.label || 'MZDATA'}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                MZDATA
              </div>
            </div>
            <div className="hidden h-11 flex-1 items-center gap-3 rounded-2xl border border-border bg-card px-4 md:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Search transactions, wallets, or beneficiaries</span>
            </div>
            <Button
              variant="secondary"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => router.push('/notifications')}
              aria-label="Open notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => router.push('/profile')}
              aria-label="Open profile"
              title="Profile"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                'h-9 w-9 shrink-0 rounded-xl md:hidden',
                'border-border bg-card text-foreground hover:bg-secondary'
              )}
              onClick={() => router.push('/notifications')}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                'h-9 w-9 shrink-0 rounded-xl md:hidden',
                'border-amber-200/80 bg-gradient-to-br from-amber-50 via-blue-50 to-card text-primary shadow-[0_8px_24px_rgba(234,115,69,0.14)] hover:border-primary/40 hover:bg-primary/10 dark:border-blue-400/20 dark:from-blue-500/15 dark:via-amber-500/10 dark:to-card'
              )}
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Theme"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              className="hidden md:inline-flex"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>
        <div className="px-4 py-5 md:px-6 lg:px-8 xl:px-10">{children}</div>
      </main>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.button
              type="button"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="relative flex h-dvh w-[68vw] min-w-[256px] max-w-[300px] flex-col overflow-hidden border-r border-border bg-card text-card-foreground shadow-2xl"
              initial={{ x: '-104%' }}
              animate={{ x: 0 }}
              exit={{ x: '-104%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="shrink-0 border-b border-border p-3">
                <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary via-card to-primary/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card ring-1 ring-border">
                        <img src="/brand/meledata-icon.png" alt="MZDATA logo" className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold tracking-tight text-foreground">MZDATA</div>
                        <div className="truncate text-[11px] text-muted-foreground">{profile.full_name || profile.email || 'Wallet workspace'}</div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-xl"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="mt-3 inline-flex h-8 items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-2.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Theme
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="axis-label mb-2">Menu</div>
                <nav className="space-y-1">
                  {mobilePrimaryMenu.map((item) => (
                    <MobileMenuLink key={item.label} item={item} activePath={activePath} />
                  ))}
                </nav>

                <div className="mt-5 border-t border-border pt-4">
                  <div className="axis-label mb-2">Personal settings</div>
                  <nav className="space-y-1">
                    {profile?.role === 'admin' && (
                      <MobileMenuLink key="Admin Dashboard" item={{ label: 'Admin Dashboard', href: '/admin', icon: Settings2 }} activePath={activePath} />
                    )}
                    {mobileSettingsMenu.map((item) => (
                      <MobileMenuLink key={item.label} item={item} activePath={activePath} />
                    ))}
                  </nav>
                </div>
              </div>

              <div className="shrink-0 border-t border-border bg-card p-3">
                <Button
                  variant="secondary"
                  className="h-11 w-full justify-center border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-500/12 dark:text-rose-100 dark:hover:bg-rose-500/18"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
