'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, CreditCard, Gift, ReceiptText, RefreshCw, ShieldAlert, TrendingUp, UserCheck, Users, Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { adminGetAnalytics, adminGetTransactions, adminGetReports } from '@/lib/api';
import { formatMoney, formatDateTime } from '@/lib/format';
import { asMoney, percent, safeList, startCase } from '@/lib/admin-utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AdminMetricCard } from '@/components/admin/admin-metric-card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { PremiumDataTable } from '@/components/admin/premium-data-table';
import { ProfitMetricsCard } from '@/components/admin/profit-metrics-card';
import { AnalyticsChart } from '@/components/admin/analytics-chart';
import { ProviderBalancesWidget } from '@/components/admin/provider-balances-widget';
import { motion } from 'framer-motion';

export default function AdminOverviewPage() {
  const [analytics, setAnalytics] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txDate, setTxDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, txRes, reportsRes] = await Promise.allSettled([
        adminGetAnalytics(),
        adminGetTransactions({ page: 1, page_size: 10, from_date: txDate || undefined, to_date: txDate || undefined }),
        adminGetReports({ page: 1, page_size: 10 }),
      ]);

      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);
      if (txRes.status === 'fulfilled') setRecentTx(safeList(txRes.value?.items));
      if (reportsRes.status === 'fulfilled') setReports(safeList(reportsRes.value?.items));
    } finally {
      setLoading(false);
    }
  }, [txDate]);

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

  // Extract all time revenue from the newly added endpoint property, or fallback
  const totalRevenueAllTime = analytics?.profit_period_estimates?.all_time?.revenue || analytics?.total_revenue || 0;
  const totalProfitAllTime = analytics?.profit_period_estimates?.all_time?.profit_estimate || (analytics?.gross_profit_estimate || 0) + (analytics?.service_profit_estimate || 0);

  const mainMetrics = [
    { 
      label: 'Total Platform Revenue', 
      value: `₦${formatMoney(totalRevenueAllTime)}`, 
      detail: 'All-time gross revenue across all services', 
      icon: CircleDollarSign, 
      tone: 'success' 
    },
    { 
      label: 'Estimated Profit', 
      value: `₦${formatMoney(totalProfitAllTime)}`, 
      detail: 'All-time gross profit margin', 
      icon: TrendingUp, 
      tone: 'brand' 
    },
    { 
      label: 'Active Users', 
      value: Number(analytics?.active_users !== undefined ? analytics.active_users : (analytics?.total_users || 0)).toLocaleString('en-NG'), 
      detail: `Out of ${Number(analytics?.total_users || 0).toLocaleString('en-NG')} total registered accounts`, 
      icon: Users, 
      tone: 'brand' 
    },
    { 
      label: 'Today\'s Activity', 
      value: String(analytics?.daily_transactions || 0), 
      detail: `${analytics?.today_successful_tx || 0} success, ${analytics?.today_failed_tx || 0} failed`, 
      icon: RefreshCw, 
      tone: 'warning' 
    },
  ];

  const secondaryMetrics = [
    { label: 'Data Revenue', value: `₦${formatMoney(analytics?.data_revenue || 0)}`, detail: 'Current period' },
    { label: 'Service Revenue', value: `₦${formatMoney(analytics?.service_revenue || 0)}`, detail: 'Current period' },
    { label: 'API Health', value: percent(analytics?.api_success, (analytics?.api_success || 0) + (analytics?.api_failed || 0)), detail: 'Success rate' },
    { label: 'Support Issues', value: String(analytics?.reports_open ?? reports.length), detail: 'Open tickets' },
  ];

  const transactionColumns = [
    { key: 'reference', label: 'Reference', render: (row) => <span className="font-mono text-xs">{row.reference || 'N/A'}</span> },
    { key: 'user', label: 'User', render: (row) => <span className="text-sm">{row.user_email || `User #${row.user_id}`}</span> },
    { key: 'tx_type', label: 'Type', render: (row) => startCase(row.tx_type) },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-semibold">₦{formatMoney(row.amount || 0)}</span> },
    { key: 'created_at', label: 'Date', render: (row) => <span className="text-muted-foreground">{formatDateTime(row.created_at)}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const DateFilter = (
    <div className="relative">
      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input 
        type="date" 
        value={txDate} 
        onChange={(e) => setTxDate(e.target.value)} 
        className="h-10 rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/50" 
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Command Center"
        description="Real-time operations, transaction monitoring, and platform analytics."
        actions={(
          <Button variant="outline" className="rounded-xl border-border/50 bg-card/50 backdrop-blur-sm hover:bg-secondary" onClick={load} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Refresh Data
          </Button>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mainMetrics.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <AdminMetricCard {...item} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-4 px-1">
        {secondaryMetrics.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 + (idx * 0.05) }}
            className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm"
          >
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</div>
              <div className="text-sm font-semibold text-foreground mt-0.5">{item.value}</div>
            </div>
            <div className="text-[10px] text-muted-foreground text-right w-16 leading-tight">{item.detail}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="h-full"
        >
          <ProfitMetricsCard profitData={analytics?.profit_period_estimates} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="h-full"
        >
          <AnalyticsChart data={analytics?.monthly_trends} />
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="min-w-0"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Recent Transactions</h3>
              <p className="text-sm text-muted-foreground">Latest operations touching payment rails.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-brand">
              <Link href="/admin/transactions">View All</Link>
            </Button>
          </div>
          <PremiumDataTable 
            data={recentTx} 
            columns={transactionColumns} 
            searchKey="reference"
            emptyMessage="Transactions will appear here once admin endpoints return data."
            headerActions={DateFilter}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <ProviderBalancesWidget />
        </motion.div>
      </div>
    </div>
  );
}
