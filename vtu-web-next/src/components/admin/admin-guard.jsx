'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert } from 'lucide-react';
import { apiFetch, clearAuth, getProfile, getToken, setProfile } from '@/lib/api';
import { Button } from '@/components/ui/button';

function isAdminUser(profile) {
  const role = String(profile?.role || '').toLowerCase();
  return role === 'admin';
}

export function AdminGuard({ children, onProfile }) {
  const router = useRouter();
  const [state, setState] = useState('loading');
  const [profile, setProfileState] = useState(getProfile());

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
        if (onProfile) onProfile(me);
        setState(isAdminUser(me) ? 'allowed' : 'denied');
      } catch {
        clearAuth();
        router.replace('/');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [onProfile, router]);

  const unauthorized = useMemo(() => {
    const role = String(profile?.role || 'user').toLowerCase();
    return `This workspace is restricted to admin accounts. Current role: ${role}.`;
  }, [profile?.role]);

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="rounded-3xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground">Checking admin access...</div>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 text-center shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/12 dark:text-rose-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Unauthorized admin access</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{unauthorized}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/dashboard">Open user dashboard</Link>
            </Button>
            <Button onClick={() => { clearAuth(); router.replace('/'); }}>
              <Lock className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
