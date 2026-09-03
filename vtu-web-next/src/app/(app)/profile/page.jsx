'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, LogOut, ShieldCheck, Users } from 'lucide-react';
import { apiFetch, clearAuth, getProfile, setProfile } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { buildReferralUrl } from '@/lib/site';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfileState] = useState(getProfile());
  const [referrals, setReferrals] = useState(null);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState({ current_password: '', new_password: '' });
  const [loading, setLoading] = useState(true);



  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, refRes] = await Promise.allSettled([
        apiFetch('/auth/me'),
        apiFetch('/referrals/me')
      ]);
      if (meRes.status === 'fulfilled') {
        setProfile(meRes.value);
        setProfileState(meRes.value);
      }
      if (refRes.status === 'fulfilled') setReferrals(refRes.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);



  const saveDetails = async () => {
    setSaving(true);
    try {
      const data = await apiFetch('/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: profile.full_name, phone_number: profile.phone_number || null }),
      });
      setProfile(data);
      setProfileState(data);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(password),
    });
    setPassword({ current_password: '', new_password: '' });
  };

  const copyReferral = async () => {
    await navigator.clipboard.writeText(String(buildReferralUrl(referrals?.referral_code || profile?.referral_code || '')));
  };

  const referralUrl = buildReferralUrl(referrals?.referral_code || profile?.referral_code || '');

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Profile"
        title="Account, security, and referral controls"
        description="Everything the operator needs in one calm, desktop-native profile workspace."
        actions={(
          <Button variant="secondary" onClick={() => load()}>
            Reload
          </Button>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Card id="profile">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>Update identity information from the existing backend profile endpoint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <div className="axis-label">Full name</div>
                <Input value={profile.full_name || ''} onChange={(e) => setProfileState((prev) => ({ ...prev, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <div className="axis-label">Email</div>
                <Input value={profile.email || ''} readOnly />
              </div>
              <div className="space-y-2">
                <div className="axis-label">Phone number</div>
                <Input value={profile.phone_number || ''} onChange={(e) => setProfileState((prev) => ({ ...prev, phone_number: e.target.value }))} />
              </div>
            </div>
            <Button onClick={saveDetails} disabled={saving}>{saving ? 'Saving...' : 'Save details'}</Button>
          </CardContent>
        </Card>

          <Card id="referrals">
            <CardHeader>
              <CardTitle>Referral status</CardTitle>
              <CardDescription>Invite-first flow with first-deposit rewards already wired on the backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border bg-secondary p-4">
              <div className="axis-label">Referral code</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{referrals?.referral_code || profile?.referral_code || '—'}</div>
              <div className="mt-2 text-sm text-muted-foreground">Share this code from the dashboard or registration link.</div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="secondary" onClick={copyReferral}><Copy className="h-4 w-4" />Copy code</Button>
              <Button variant="secondary" onClick={() => referralUrl && window.open(referralUrl, '_blank', 'noopener,noreferrer')} disabled={!referralUrl}>Open link</Button>
            </div>
            {referralUrl ? <div className="rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground break-all">{referralUrl}</div> : null}
            <Button variant="secondary" className="w-full border-border bg-card text-muted-foreground hover:bg-secondary" onClick={() => router.push('/referrals')}>
              Open referral workspace
            </Button>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="axis-label">Total referrals</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">{referrals?.total_referrals ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="axis-label">Total earned</div>
                <div className="mt-2 text-2xl font-semibold text-foreground">₦{formatMoney(referrals?.total_earned || 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.2fr]">
        <Card id="security">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Password update and account protection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="axis-label">Current password</div>
              <Input type="password" value={password.current_password} onChange={(e) => setPassword((prev) => ({ ...prev, current_password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <div className="axis-label">New password</div>
              <Input type="password" value={password.new_password} onChange={(e) => setPassword((prev) => ({ ...prev, new_password: e.target.value }))} />
            </div>
            <Button onClick={changePassword}><ShieldCheck className="h-4 w-4" />Update password</Button>
          </CardContent>
        </Card>

        <Card id="support">
          <CardHeader>
            <CardTitle>Account actions</CardTitle>
            <CardDescription>Session and workspace-level controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                clearAuth();
                router.replace('/');
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
            <div className="rounded-2xl border border-dashed border-border bg-secondary p-4 text-sm text-muted-foreground">
              Desktop profile surface is intentionally calm so support, security, and referral workflows stay obvious.
            </div>
          </CardContent>
        </Card>

        <Card id="developer">
          <CardHeader>
            <CardTitle>Developer API</CardTitle>
            <CardDescription>Automate purchases by integrating our API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-dashed border-border bg-secondary p-4 text-sm text-muted-foreground">
              We provide a robust REST API for developers to connect and resell MZDATA services.
            </div>
            <Button className="w-full" variant="outline" onClick={() => router.push('/developer')}>
              Open Developer Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
