'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, CircleDollarSign, Copy, Gift, Landmark, Package2, RefreshCw, Sparkles, Smartphone, Zap, Tv2, GraduationCap } from 'lucide-react';
import { apiFetch, getProfile } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { quickActions } from '@/lib/nav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MetricCard } from '@/components/metric-card';
import { PageHeader } from '@/components/page-header';
import { buildReferralUrl } from '@/lib/site';

function emptyOrRows(value) {
  return Array.isArray(value) ? value : [];
}

const actionDetails = {
  '/buy-data': {
    kicker: 'Most used',
    description: 'Purchase mobile data with a guided flow and clean confirmation.',
    cta: 'Buy data',
    tone: 'from-blue-500/16 via-blue-500/8 to-transparent border-blue-300/70',
    iconTone: 'bg-blue-500 text-white shadow-blue-500/20',
  },
  '/services': {
    kicker: 'Catalog',
    description: 'Browse available MZDATA services from one organized page.',
    cta: 'Open services',
    tone: 'from-sky-500/14 via-sky-500/7 to-transparent border-sky-300/70',
    iconTone: 'bg-sky-500 text-white shadow-sky-500/20',
  },
  '/wallet': {
    kicker: 'Funding',
    description: 'Check balance, view account details, and fund your wallet.',
    cta: 'Open wallet',
    tone: 'from-emerald-500/14 via-emerald-500/7 to-transparent border-emerald-300/70',
    iconTone: 'bg-emerald-500 text-white shadow-emerald-500/20',
  },
  '/history': {
    kicker: 'Records',
    description: 'Review recent purchases, payments, and transaction status.',
    cta: 'View history',
    tone: 'from-amber-500/14 via-amber-500/7 to-transparent border-amber-300/70',
    iconTone: 'bg-amber-500 text-white shadow-amber-500/20',
  },
  '/referrals': {
    kicker: 'Growth',
    description: 'Share your referral code and track invite activity.',
    cta: 'Open referrals',
    tone: 'from-violet-500/14 via-violet-500/7 to-transparent border-violet-300/70',
    iconTone: 'bg-violet-500 text-white shadow-violet-500/20',
  },
  '/profile': {
    kicker: 'Account',
    description: 'Manage your profile, account details, and security settings.',
    cta: 'View profile',
    tone: 'from-slate-500/12 via-slate-500/6 to-transparent border-border',
    iconTone: 'bg-slate-800 text-white shadow-slate-900/10 dark:bg-slate-200 dark:text-slate-950',
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const profile = getProfile();
  const [summary, setSummary] = useState(null);
  const [referrals, setReferrals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    try {
      const [dash, refs] = await Promise.allSettled([
        apiFetch('/dashboard/summary'),
        apiFetch('/referrals/me'),
      ]);
      if (dash.status === 'fulfilled') setSummary(dash.value);
      if (refs.status === 'fulfilled') setReferrals(refs.value);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const wallet = summary?.wallet || {};
  const txs = emptyOrRows(summary?.transactions).slice(0, 6);
  const announcements = emptyOrRows(summary?.announcements).slice(0, 3);
  const bankTransfer = summary?.bank_transfer_accounts || {};
  const primaryFundingAccount = bankTransfer?.accounts?.[0] || null;
  const referralCode = referrals?.referral_code || profile?.referral_code || '—';
  const referralLink = buildReferralUrl(referrals?.referral_code || profile?.referral_code || '');
  const quickStats = useMemo(() => [
    { label: 'Wallet balance', value: `₦${formatMoney(wallet.balance || 0)}`, detail: 'Live available balance', icon: CircleDollarSign, tone: 'brand' },
    { label: 'Rewards earned', value: `₦${formatMoney(referrals?.total_earned ?? 0)}`, detail: 'Referral revenue', icon: Gift, tone: 'violet' },
  ], [wallet.balance, referrals?.total_earned]);

  const copyFundingAccount = useCallback(async () => {
    const accountNumber = primaryFundingAccount?.account_number;
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(String(accountNumber));
      setCopiedAccount(true);
      window.setTimeout(() => setCopiedAccount(false), 1800);
    } catch {
      setCopiedAccount(false);
    }
  }, [primaryFundingAccount?.account_number]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Dashboard"
        title={`Good to see you, ${String(profile?.full_name || profile?.email || 'User').split(' ')[0]}`}
        description="A calm command center for MZDATA operations, balances, and referral activity."
        actions={(
          <>
            <Button variant="secondary" onClick={() => load(true)} className="border-border bg-card text-muted-foreground hover:bg-secondary">
              <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh
            </Button>
            <Button onClick={() => router.push('/buy-data')}>
              <Package2 className="h-4 w-4" />
              Buy Data
            </Button>
          </>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {quickStats.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card shadow-[0_24px_70px_rgba(234,115,69,0.10)]">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-blue-500/20">
              <Landmark className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="axis-label text-primary">Fund your wallet</div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">Dedicated funding account</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Transfer to this account to fund your MZDATA wallet. Copy the account number and send money from your bank app.
              </p>
            </div>
          </div>

          {primaryFundingAccount ? (
            <div className="w-full rounded-3xl border border-border bg-card/85 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:min-w-[390px] md:max-w-[520px]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Account number</div>
                  <div className="mt-2 break-all font-mono text-3xl font-semibold tracking-[0.16em] text-foreground sm:text-4xl">
                    {primaryFundingAccount.account_number}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-11 w-11 shrink-0 border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"
                  onClick={copyFundingAccount}
                  aria-label="Copy funding account number"
                  title="Copy account number"
                >
                  {copiedAccount ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-border bg-secondary p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bank</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{primaryFundingAccount.bank_name || 'Bank account'}</div>
                </div>
                <div className="min-w-0 rounded-2xl border border-border bg-secondary p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Account name</div>
                  <div className="mt-1 break-words text-sm font-semibold text-foreground">{primaryFundingAccount.account_name || 'MZDATA Wallet'}</div>
                </div>
              </div>
              <div className="mt-3 text-xs font-medium text-primary">
                {copiedAccount ? 'Account number copied.' : 'Tap copy, then transfer from your bank app.'}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card/85 p-5 text-sm leading-6 text-muted-foreground md:min-w-[360px]">
              {bankTransfer?.message || 'Wallet transfer account will appear here once it is available.'}
              <Button className="mt-4 w-full" onClick={() => router.push('/wallet')}>
                Open wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-secondary/50 to-card/50 py-4 px-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg font-semibold tracking-tight">Quick Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
              {[
                { label: 'Data', href: '/buy-data', icon: Package2, color: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20' },
                { label: 'Airtime', href: '/airtime', icon: Smartphone, color: 'text-sky-500 bg-sky-500/10 dark:bg-sky-500/20' },
                { label: 'Cable TV', href: '/cable-tv', icon: Tv2, color: 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20' },
                { label: 'Electricity', href: '/electricity', icon: Zap, color: 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20' },
                { label: 'Exam PINs', href: '/exam-pins', icon: GraduationCap, color: 'text-violet-500 bg-violet-500/10 dark:bg-violet-500/20' },
                { label: 'Wallet', href: '/wallet', icon: CircleDollarSign, color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/40 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                  >
                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 ${item.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral position</CardTitle>
            <CardDescription>Invite-first deposit rewards, surfaced directly on the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border bg-secondary p-4">
              <div className="axis-label">Your code</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{referralCode}</div>
              <div className="mt-2 text-sm text-muted-foreground">Share this code with new users to earn rewards after their first deposit.</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => router.push('/profile')} className="border-border bg-card text-muted-foreground hover:bg-secondary">
                View profile
              </Button>
              <Button onClick={() => router.push('/referrals')}>Open referrals</Button>
            </div>
            {referralLink ? <div className="rounded-2xl border border-border bg-card p-3 text-xs text-muted-foreground break-all">{referralLink}</div> : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest wallet and service movements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <div className="text-sm text-muted-foreground">Loading transactions...</div> : null}
            {txs.length === 0 && !loading ? <div className="text-sm text-muted-foreground">No recent activity yet.</div> : null}
            {txs.map((tx) => (
              <div key={tx.reference || tx.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary p-4">
                <div>
                  <div className="text-sm font-medium text-foreground">{String(tx.tx_type || 'Transaction').replace(/_/g, ' ')}</div>
                  <div className="text-xs text-muted-foreground">{String(tx.reference || '—')}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(tx.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">₦{formatMoney(tx.amount || 0)}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{String(tx.status || 'pending')}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Operational updates from the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 ? <div className="text-sm text-muted-foreground">No active announcements.</div> : null}
              {announcements.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-secondary p-4">
                  <div className="text-sm font-medium text-foreground">{item.title || 'Update'}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.message || item.text || ''}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
