'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, CircleDollarSign, Copy, Gift, Landmark, Package2, RefreshCw, Sparkles, Smartphone, Zap, Tv2, GraduationCap } from 'lucide-react';
import { apiFetch, getProfile } from '@/lib/api';
import { formatDateTime, formatMoney, formatBankDisplayName, getBankAppSearchHint, formatAccountNumber, sortFundingAccounts, getBankStyle } from '@/lib/format';
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
    description: 'Browse available VTU services from one organized page.',
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
  const [fastWallet, setFastWallet] = useState(null);
  const [referrals, setReferrals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;


  const [refreshing, setRefreshing] = useState(false);
  const [copiedAccountId, setCopiedAccountId] = useState(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) {
      try {
        const cachedDash = localStorage.getItem('cached_dashboard');
        const cachedRefs = localStorage.getItem('cached_referrals');
        const cachedWallet = localStorage.getItem('cached_wallet');
        let hasCache = false;
        if (cachedDash) { setSummary(JSON.parse(cachedDash)); hasCache = true; }
        if (cachedRefs) { setReferrals(JSON.parse(cachedRefs)); }
        if (cachedWallet) { setFastWallet(JSON.parse(cachedWallet)); hasCache = true; }
        
        if (hasCache) {
          setLoading(false);
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      } catch (e) {
        setLoading(true);
      }
    } else {
      setRefreshing(true);
    }

    apiFetch('/wallet/me').then(val => {
      setFastWallet(val);
      localStorage.setItem('cached_wallet', JSON.stringify(val));
    }).catch(() => {});

    try {
      const [dash, refs] = await Promise.allSettled([
        apiFetch('/dashboard/summary'),
        apiFetch('/referrals/me'),
      ]);
      if (dash.status === 'fulfilled') {
        setSummary(dash.value);
        localStorage.setItem('cached_dashboard', JSON.stringify(dash.value));
      }
      if (refs.status === 'fulfilled') {
        setReferrals(refs.value);
        localStorage.setItem('cached_referrals', JSON.stringify(refs.value));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const wallet = fastWallet || summary?.wallet || {};
  const txs = emptyOrRows(summary?.transactions);
  
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return txs.slice(start, start + itemsPerPage);
  }, [txs, currentPage]);

  const totalPages = Math.ceil(txs.length / itemsPerPage);
  const announcements = emptyOrRows(summary?.announcements).slice(0, 3);
  const bankTransfer = summary?.bank_transfer_accounts || {};
  const sortedFundingAccounts = useMemo(() => sortFundingAccounts(bankTransfer?.accounts || []), [bankTransfer?.accounts]);
  const primaryFundingAccount = sortedFundingAccounts[0] || null;
  const referralCode = referrals?.referral_code || profile?.referral_code || '—';
  const referralLink = buildReferralUrl(referrals?.referral_code || profile?.referral_code || '');
  const quickStats = useMemo(() => [
    { label: 'Wallet balance', value: wallet.balance !== undefined ? `₦${formatMoney(wallet.balance || 0)}` : '₦...', detail: 'Live available balance', icon: CircleDollarSign, tone: 'brand' },
    { label: 'Rewards earned', value: loading && !referrals ? '₦...' : `₦${formatMoney(referrals?.total_earned ?? 0)}`, detail: 'Referral revenue', icon: Gift, tone: 'violet' },
  ], [wallet.balance, referrals?.total_earned, loading, referrals]);

  const copyFundingAccount = useCallback(async (accountNumber) => {
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(String(accountNumber));
      setCopiedAccountId(accountNumber);
      window.setTimeout(() => setCopiedAccountId(null), 1800);
    } catch {
      setCopiedAccountId(null);
    }
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Dashboard"
        title={`Good to see you, ${String(profile?.full_name || profile?.email || 'User').split(' ')[0]}`}
        description="A calm command center for your operations, balances, and referral activity."
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

      <div className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between px-2">
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-foreground">Instant Top-up Accounts</h2>
            <p className="text-xs text-muted-foreground">Transfer to any of these dedicated bank accounts from your banking app or POS — your balance updates automatically within seconds.</p>
          </div>
          <Link href="/wallet" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto">
            Wallet &amp; Ledger <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {sortedFundingAccounts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedFundingAccounts.map((acc, i) => {
              const bankName = formatBankDisplayName(acc.bank_name);
              const searchHint = getBankAppSearchHint(acc.bank_name);
              const formattedAccNum = formatAccountNumber(acc.account_number);
              const style = getBankStyle(acc.bank_name);
              const isCopied = copiedAccountId === acc.account_number;

              return (
                <div
                  key={acc.account_number}
                  className="group relative flex flex-col justify-between rounded-[1.25rem] border border-border/50 bg-gradient-to-br from-card/85 via-card/50 to-card/30 backdrop-blur-xl p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  {/* Bank Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-inner ${style.iconBg}`}>
                          <Landmark className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Bank Name</div>
                          <div className="text-[15px] font-extrabold text-foreground tracking-tight leading-tight">
                            {bankName}
                          </div>
                        </div>
                      </div>
                      {i === 0 ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black tracking-wider px-2 py-0.5 shadow-none">
                          RECOMMENDED
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border/60">
                          AUTOMATED
                        </Badge>
                      )}
                    </div>

                    {/* Local Bank App Search Hint */}
                    <div className="mt-3 rounded-lg bg-secondary/50 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 border border-border/40">
                      <span className="text-primary font-bold">ℹ️</span>
                      <span className="truncate">{searchHint}</span>
                    </div>

                    {/* Account Number */}
                    <div className="mt-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Account Number</div>
                      <div className="mt-1 font-mono text-2xl font-black tracking-[0.14em] text-foreground select-all">
                        {formattedAccNum}
                      </div>
                    </div>

                    {/* Account Name */}
                    {acc.account_name && (
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        Account Name: <span className="font-bold text-foreground/90">{acc.account_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Instant Badge */}
                  <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Instant Auto-Credit
                    </span>
                    <Button
                      variant={isCopied ? "default" : "secondary"}
                      size="sm"
                      className={`rounded-xl px-4 h-9 font-bold text-xs transition-all ${
                        isCopied ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : 'hover:bg-primary hover:text-primary-foreground'
                      }`}
                      onClick={() => copyFundingAccount(acc.account_number)}
                    >
                      {isCopied ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copy Number
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
            {bankTransfer?.message || 'No wallet transfer accounts available right now. Tap to refresh or contact support.'}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card className="relative overflow-hidden border border-border/40 bg-card/40 backdrop-blur-2xl shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[4rem] -z-10" />
          <CardHeader className="relative z-10 border-b border-white/5 bg-gradient-to-r from-secondary/30 to-transparent py-4 px-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-bold tracking-tight">Quick Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
                    className="group relative overflow-hidden flex flex-col items-center justify-center rounded-[1.5rem] border border-white/10 bg-background/40 p-5 text-center transition-all duration-400 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 from-white/5 to-transparent" />
                    <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-[1.2rem] shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${item.color}`}>
                      <Icon className="h-7 w-7 drop-shadow-sm" />
                    </div>
                    <span className="relative z-10 text-sm font-bold tracking-tight text-foreground/90 transition-colors duration-200 group-hover:text-primary">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

              </div>

      <div className="space-y-6">
        <Card className="relative overflow-hidden border border-border/40 bg-card/40 backdrop-blur-2xl shadow-xl">
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-[4rem] -z-10" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-bold tracking-tight">Recent Activity</CardTitle>
            <CardDescription>Latest wallet and service movements.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            {loading ? <div className="text-sm text-muted-foreground p-4">Loading transactions...</div> : null}
            {txs.length === 0 && !loading ? <div className="text-sm text-muted-foreground p-4">No recent activity yet.</div> : null}
            
            {txs.length > 0 && (
              <div className="w-full overflow-x-auto pb-2">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Phone / Recipient</th>
                      <th className="px-4 py-3 font-semibold">Capacity / Plan</th>
                      <th className="px-4 py-3 font-semibold">Network</th>
                      <th className="px-4 py-3 font-semibold">When</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Tx ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {paginatedTransactions.map((tx, idx) => {
                      const isSuccess = tx.status === 'success' || tx.status === 'delivered';
                      const isPending = tx.status === 'pending' || tx.status === 'processing';
                      const statusColor = isSuccess ? 'text-emerald-500' : isPending ? 'text-amber-500' : 'text-red-500';
                      const statusBg = isSuccess ? 'bg-emerald-500/10' : isPending ? 'bg-amber-500/10' : 'bg-red-500/10';
                      
                      const tType = String(tx.tx_type || '').toLowerCase();
                      const meta = tx.meta || {};
                      
                      let recipient = tx.customer || tx.recipient_phone || meta.recipient_phone || meta.phone_number || meta.phone || meta.smartcard_number || meta.meter_number || '—';
                      if (tType === 'wallet_fund' || tType === 'fund') recipient = 'Wallet Funding';
                      if (tType === 'referral_bonus' || tType === 'referral') recipient = 'Referral Bonus';
                      
                      let capacity = '—';
                      if (tType === 'data') {
                        const rawPlan = String(meta.plan_name || meta.package_name || meta.description || tx.data_plan_code || meta.package_code || '');
                        const match = rawPlan.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|TB))/i);
                        capacity = match ? match[1].toUpperCase().replace(/\s/g, '') : (rawPlan || '—');
                      } else if (tType === 'cable') {
                        capacity = meta.plan_name || meta.package_name || tx.data_plan_code || meta.package_code || '—';
                      } else {
                        capacity = `₦${formatMoney(tx.amount || 0)}`;
                      }

                      let network = (tx.network || meta.network || meta.provider || meta.disco || meta.exam || '—').toString().toUpperCase();
                      if (tType === 'wallet_fund' || tType === 'fund') network = 'DEPOSIT';
                      if (tType === 'referral_bonus' || tType === 'referral') network = 'REWARD';
                      let netColor = 'text-foreground';
                      let netDot = 'bg-foreground';
                      if (network === 'MTN') { netColor = 'text-yellow-500'; netDot = 'bg-yellow-500'; }
                      else if (network === 'GLO') { netColor = 'text-green-500'; netDot = 'bg-green-500'; }
                      else if (network === 'AIRTEL') { netColor = 'text-red-500'; netDot = 'bg-red-500'; }
                      else if (network === '9MOBILE') { netColor = 'text-emerald-700'; netDot = 'bg-emerald-700'; }
                      else if (network === 'DEPOSIT') { netColor = 'text-blue-500'; netDot = 'bg-blue-500'; }
                      else if (network === 'REWARD') { netColor = 'text-violet-500'; netDot = 'bg-violet-500'; }

                      const d = new Date(tx.created_at || tx.timestamp);
                      const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString("en-GB").replace(/\//g, '-') : '—';
                      const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : '';

                      return (
                        <tr key={tx.reference || tx.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4 text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 py-4 font-bold text-foreground">{recipient}</td>
                          <td className="px-4 py-4 font-bold text-foreground">{capacity}</td>
                          <td className="px-4 py-4">
                            {network !== '—' ? (
                              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-2.5 py-0.5 text-xs font-semibold shadow-sm">
                                <div className={`h-1.5 w-1.5 rounded-full ${netDot}`} />
                                <span className={netColor}>{network}</span>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-foreground">{dateStr}</div>
                            <div className="text-xs text-muted-foreground">{timeStr}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusColor} ${statusBg}`}>
                              {String(tx.status || 'pending')}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs font-mono text-muted-foreground">
                            #{String(tx.reference || '').substring(0, 8)}...
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
