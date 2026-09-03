'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Link2, RefreshCw, Share2, Users } from 'lucide-react';
import { apiFetch, getProfile } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { buildReferralUrl } from '@/lib/site';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';

function referralTone(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'rewarded') return 'success';
  if (normalized === 'qualified') return 'warning';
  return 'neutral';
}

export default function ReferralsPage() {
  const profile = getProfile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/referrals/me');
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const referralCode = data?.referral_code || profile?.referral_code || '—';
  const referralLink = data?.referral_link || buildReferralUrl(referralCode === '—' ? '' : referralCode);
  const rows = Array.isArray(data?.referrals) ? data.referrals : [];

  const stats = useMemo(
    () => [
      { label: 'Total referrals', value: data?.total_referrals ?? 0 },
      { label: 'Rewarded referrals', value: data?.rewarded_referrals ?? 0 },
      { label: 'Total earned', value: `₦${formatMoney(data?.total_earned || 0)}` },
      { label: 'Reward rule', value: '2% of first deposit' },
    ],
    [data?.rewarded_referrals, data?.total_earned, data?.total_referrals]
  );

  const copy = async (value) => {
    if (!value) return;
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const { chartData, statusSplit } = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6 = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = months[d.getMonth()];
      const year = d.getFullYear();
      const key = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      last6.push({ label, year, key, signups: 0, earnings: 0 });
    }

    let rewardedCount = 0;
    let qualifiedCount = 0;
    let pendingCount = 0;

    rows.forEach((item) => {
      const status = String(item.status || '').toLowerCase();
      if (status === 'rewarded') rewardedCount++;
      else if (status === 'qualified') qualifiedCount++;
      else pendingCount++;

      if (item.created_at) {
        const cDate = new Date(item.created_at);
        if (!isNaN(cDate.getTime())) {
          const key = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}`;
          const bucket = last6.find((m) => m.key === key);
          if (bucket) {
            bucket.signups++;
          }
        }
      }

      if (status === 'rewarded' && item.rewarded_at) {
        const rDate = new Date(item.rewarded_at);
        if (!isNaN(rDate.getTime())) {
          const key = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, '0')}`;
          const bucket = last6.find((m) => m.key === key);
          if (bucket) {
            bucket.earnings += Number(item.reward_amount || 0);
          }
        }
      }
    });

    const total = rewardedCount + qualifiedCount + pendingCount;
    const split = {
      rewarded: { count: rewardedCount, pct: total ? Math.round((rewardedCount / total) * 100) : 0 },
      qualified: { count: qualifiedCount, pct: total ? Math.round((qualifiedCount / total) * 100) : 0 },
      pending: { count: pendingCount, pct: total ? Math.round((pendingCount / total) * 100) : 0 },
    };

    return { chartData: last6, statusSplit: split };
  }, [rows]);

  const maxSignups = Math.max(...chartData.map((d) => d.signups), 4);
  const maxEarnings = Math.max(...chartData.map((d) => d.earnings), 1000);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Growth"
        title="Referrals"
        description="Share your referral code, track first-deposit qualification, and monitor earned rewards."
        actions={
          <Button variant="secondary" onClick={load} className="border-border bg-card text-muted-foreground hover:bg-secondary">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <div className="axis-label">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Analytics Panel */}
      {!loading && rows.length > 0 ? (
        <Card className="overflow-hidden border-border bg-card">
          <CardHeader className="border-b border-border bg-secondary/10 px-6 py-4">
            <CardTitle className="text-base font-semibold text-foreground">Analytics & Insights</CardTitle>
            <CardDescription className="text-xs">Performance trends and invitation pipeline breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Status Split */}
              <div className="rounded-2xl border border-border bg-secondary p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-4">Invite pipeline split</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Rewarded (2% Paid)</span>
                        <span className="text-foreground font-semibold">{statusSplit.rewarded.count} ({statusSplit.rewarded.pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${statusSplit.rewarded.pct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Qualified (First Deposit)</span>
                        <span className="text-foreground font-semibold">{statusSplit.qualified.count} ({statusSplit.qualified.pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${statusSplit.qualified.pct}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Pending (Registered Only)</span>
                        <span className="text-foreground font-semibold">{statusSplit.pending.count} ({statusSplit.pending.pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${statusSplit.pending.pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
                  <span>Total conversion rate:</span>
                  <span className="font-semibold text-foreground">
                    {rows.length ? Math.round(((statusSplit.rewarded.count + statusSplit.qualified.count) / rows.length) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Signups Bar Chart */}
              <div className="rounded-2xl border border-border bg-secondary p-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-foreground">Signups trend (6m)</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-card border border-border px-2 py-0.5 rounded-full">Invites</span>
                </div>
                <div className="relative flex-1 min-h-[160px] flex items-end justify-between px-2 pt-4">
                  {chartData.map((d, idx) => {
                    const pct = (d.signups / maxSignups) * 100;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 group relative">
                        <div className="absolute -top-6 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.signups}
                        </div>
                        <div 
                          className="w-8 bg-primary/20 group-hover:bg-primary/30 border border-primary/20 rounded-t-lg transition-all"
                          style={{ height: `${Math.max(pct, 6)}%` }}
                        />
                        <span className="text-[10px] font-semibold text-muted-foreground mt-2">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Earnings Line Chart */}
              <div className="rounded-2xl border border-border bg-secondary p-5 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold text-foreground">Earnings growth (6m)</h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-card border border-border px-2 py-0.5 rounded-full">₦ Naira</span>
                </div>
                <div className="relative flex-1 min-h-[160px] flex flex-col justify-between">
                  <div className="relative w-full h-[120px] pt-4">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M 0,100 ${chartData.map((d, idx) => {
                          const x = idx * 60;
                          const y = 100 - (d.earnings / maxEarnings) * 85;
                          return `L ${x},${y}`;
                        }).join(' ')} L 300,100 Z`}
                        fill="url(#chart-glow)"
                      />
                      <path
                        d={chartData.map((d, idx) => {
                          const x = idx * 60;
                          const y = 100 - (d.earnings / maxEarnings) * 85;
                          return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="absolute inset-0 flex justify-between px-0">
                      {chartData.map((d, idx) => {
                        const pct = (d.earnings / maxEarnings) * 85;
                        return (
                          <div key={idx} className="flex flex-col items-center flex-1 group relative justify-end">
                            <div className="absolute bottom-[calc(100%-8px)] mb-2 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              ₦{formatMoney(d.earnings)}
                            </div>
                            <div 
                              className="absolute w-2 h-2 rounded-full bg-primary border-2 border-background cursor-pointer group-hover:scale-125 transition-transform"
                              style={{ bottom: `calc(${pct}% - 4px)`, left: 'calc(50% - 4px)' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-between px-2">
                    {chartData.map((d, idx) => (
                      <span key={idx} className="text-[10px] font-semibold text-muted-foreground w-12 text-center">{d.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Referral history</CardTitle>
            <CardDescription>Qualification and reward status for invited users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!rows.length ? (
              <div className="rounded-2xl border border-dashed border-border bg-secondary px-4 py-4 text-sm text-muted-foreground">
                No referrals yet. Share your code to start tracking rewards.
              </div>
            ) : null}

            {rows.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-secondary p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{item.referred_user_name || 'New user'}</div>
                    <div className="text-xs text-muted-foreground">Code used: {item.referral_code_used || '—'}</div>
                  </div>
                  <Badge tone={referralTone(item.status)}>{item.status || 'pending'}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">First deposit</div>
                    <div className="font-medium text-foreground">₦{formatMoney(item.first_deposit_amount || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Reward</div>
                    <div className="font-medium text-foreground">₦{formatMoney(item.reward_amount || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Updated</div>
                    <div className="font-medium text-foreground">{formatDateTime(item.updated_at || item.created_at)}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Share your code</CardTitle>
            <CardDescription>Invite new users and earn after their first deposit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Your referral code</div>
                  <div className="text-xl font-semibold tracking-tight text-foreground">{referralCode}</div>
                </div>
              </div>
            </div>

            <Button variant="secondary" onClick={() => copy(referralCode)} className="w-full border-border bg-card text-muted-foreground hover:bg-secondary">
              <Copy className="h-4 w-4" />
              Copy code
            </Button>

            <Button variant="secondary" onClick={() => copy(referralLink)} className="w-full border-border bg-card text-muted-foreground hover:bg-secondary">
              <Link2 className="h-4 w-4" />
              Copy link
            </Button>

            <Button onClick={() => window.open(referralLink, '_blank', 'noopener,noreferrer')} className="w-full">
              <Share2 className="h-4 w-4" />
              Open referral link
            </Button>

            <div className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground break-all">
              {referralLink || 'Referral link is not available yet.'}
            </div>

            {copied ? <div className="text-xs font-medium text-primary">Copied to clipboard.</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
