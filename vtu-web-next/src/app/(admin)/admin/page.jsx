'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, CreditCard, Gift, ReceiptText, RefreshCw, ShieldAlert, TrendingUp, UserCheck, Users } from 'lucide-react';
import { adminGetAnalytics, adminGetTransactions, adminGetReports } from '@/lib/api';
import { formatMoney, formatDateTime } from '@/lib/format';
import { asMoney, percent, safeList, startCase } from '@/lib/admin-utils';
import { adminQuickLinks } from '@/lib/admin-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminMetricCard } from '@/components/admin/admin-metric-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { EmptyState } from '@/components/admin/empty-state';

export default function AdminOverviewPage() {
  const [analytics, setAnalytics] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, txRes, reportsRes] = await Promise.allSettled([
        adminGetAnalytics(),
        adminGetTransactions({ page: 1, page_size: 8 }),
        adminGetReports({ page: 1, page_size: 8 }),
      ]);

      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);
      if (txRes.status === 'fulfilled') setRecentTx(safeList(txRes.value?.items));
      if (reportsRes.status === 'fulfilled') setReports(safeList(reportsRes.value?.items));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const statusCounts = useMemo(() => {
    const initial = { success: 0, failed: 0, pending: 0 };
    for (const row of recentTx) {
      const status = String(row?.status || '').toLowerCase();
      if (status.includes('success')) initial.success += 1;
      else if (status.includes('fail')) initial.failed += 1;
      else initial.pending += 1;
    }
    return initial;
  }, [recentTx]);

  const metrics = [
    { label: 'Total users', value: Number(analytics?.total_users || 0).toLocaleString('en-NG'), detail: 'Registered accounts', icon: Users, tone: 'brand' },
    {
      label: 'Active users',
      value: Number(analytics?.active_users !== undefined ? analytics.active_users : (analytics?.total_users || 0)).toLocaleString('en-NG'),
      detail: analytics?.active_users !== undefined ? 'Active accounts' : 'Active-state estimate',
      icon: UserCheck,
      tone: 'success'
    },
    { label: 'Today transactions', value: Number(analytics?.daily_transactions || 0).toLocaleString('en-NG'), detail: 'Attempts today', icon: ReceiptText, tone: 'warning' },
    { label: 'Total revenue', value: `₦${formatMoney(analytics?.total_revenue || 0)}`, detail: `Margin ${percent(analytics?.gross_margin_pct)}`, icon: CircleDollarSign, tone: 'brand' },
    {
      label: 'Successful tx',
      value: analytics?.today_successful_tx !== undefined
        ? Number(analytics.today_successful_tx).toLocaleString('en-NG')
        : String(statusCounts.success),
      detail: analytics?.today_successful_tx !== undefined
        ? 'Successful transactions today'
        : 'From latest transaction window',
      icon: CreditCard,
      tone: 'success'
    },
    {
      label: 'Failed tx',
      value: analytics?.today_failed_tx !== undefined
        ? Number(analytics.today_failed_tx).toLocaleString('en-NG')
        : String(statusCounts.failed),
      detail: analytics?.today_failed_tx !== undefined
        ? 'Failed transactions today'
        : 'Needs operational review',
      icon: ShieldAlert,
      tone: 'danger'
    },
    {
      label: 'Pending tx',
      value: analytics?.today_pending_tx !== undefined
        ? Number(analytics.today_pending_tx).toLocaleString('en-NG')
        : String(statusCounts.pending),
      detail: analytics?.today_pending_tx !== undefined
        ? 'Pending transactions today'
        : 'Awaiting provider callback',
      icon: TrendingUp,
      tone: 'warning'
    },
    { label: 'Support issues', value: String(analytics?.reports_open ?? reports.length), detail: 'Open disputes and reports', icon: Gift, tone: 'danger' },
  ];

  const periodCards = analytics?.profit_period_estimates || {};
  const periodRows = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <AdminPageHeader
        eyebrow="Admin"
        title="MZDATA operations center"
        description="Track users, transactions, support pressure, and margins from one internal dashboard."
        actions={(
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <AdminMetricCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue and margin pulse</CardTitle>
            <CardDescription>Estimate based on backend analytics and provider cost snapshots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {periodRows.map((item) => {
              const row = periodCards[item.key] || {};
              const revenue = asMoney(row.revenue);
              const cost = asMoney(row.cost_estimate);
              const profit = asMoney(row.profit_estimate);
              const width = revenue > 0 ? Math.max(10, Math.min(100, (profit / revenue) * 100)) : 0;
              return (
                <div key={item.key} className="rounded-2xl border border-border bg-secondary p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{Number(row.tx_count || 0)} tx</div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-card">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${width}%` }} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>Revenue: ₦{formatMoney(revenue)}</div>
                    <div>Cost: ₦{formatMoney(cost)}</div>
                    <div>Profit: ₦{formatMoney(profit)}</div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick controls</CardTitle>
            <CardDescription>Jump into high-frequency admin workspaces.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {adminQuickLinks.map((item) => (
              <Button key={item.href} asChild variant="secondary" className="justify-between">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Latest operations touching payment rails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTx.length === 0 ? (
              <EmptyState
                title="No transactions"
                description="Transactions will appear here once admin endpoints return data."
                action={<Button asChild variant="secondary"><Link href="/admin/transactions">Open transactions</Link></Button>}
              />
            ) : recentTx.map((tx) => (
              <div key={tx.reference || tx.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{tx.reference || 'Reference unavailable'}</div>
                  <div className="text-xs text-muted-foreground">{startCase(tx.tx_type)} • {formatDateTime(tx.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">₦{formatMoney(tx.amount || 0)}</div>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support load snapshot</CardTitle>
            <CardDescription>Dispute and complaint queue health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.length === 0 ? (
              <EmptyState
                title="No open support items"
                description="Support cases are clear or endpoint data is not available yet."
                action={<Button asChild variant="secondary"><Link href="/admin/support">Open support inbox</Link></Button>}
              />
            ) : reports.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-secondary p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-foreground">{item.transaction_reference || `Issue #${item.id}`}</div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.reason || 'No reason provided'}</p>
                <div className="mt-1 text-xs text-muted-foreground">{item.user_email || 'Unknown user'} • {formatDateTime(item.created_at)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
