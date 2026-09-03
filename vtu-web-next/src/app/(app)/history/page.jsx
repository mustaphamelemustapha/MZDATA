'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileClock, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, reportRes] = await Promise.allSettled([
        apiFetch('/transactions/me'),
        apiFetch('/transactions/reports/me'),
      ]);
      if (txRes.status === 'fulfilled') setTransactions(Array.isArray(txRes.value) ? txRes.value : []);
      if (reportRes.status === 'fulfilled') setReports(Array.isArray(reportRes.value) ? reportRes.value : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const summary = useMemo(() => {
    const success = transactions.filter((item) => String(item.status || '').toLowerCase() === 'success').length;
    const pending = transactions.filter((item) => String(item.status || '').toLowerCase() === 'pending').length;
    const total = transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { success, pending, total };
  }, [transactions]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="History"
        title="Operations timeline"
        description="A compact audit trail for wallet funding, data purchases, and service activity."
        actions={(
          <Button variant="secondary" onClick={() => load()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Successful', value: String(summary.success) },
          { label: 'Pending', value: String(summary.pending) },
          { label: 'Volume', value: `₦${formatMoney(summary.total)}` },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <div className="axis-label">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Latest movements from the backend timeline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <div className="text-sm text-muted-foreground">Loading history...</div> : null}
          {transactions.length === 0 && !loading ? <div className="text-sm text-muted-foreground">No transactions yet.</div> : null}
          {transactions.map((tx) => (
            <div key={tx.reference || tx.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary p-4">
              <div>
                <div className="text-sm font-medium text-foreground">{String(tx.tx_type || 'Transaction').replace(/_/g, ' ')}</div>
                <div className="mt-1 text-xs text-muted-foreground">{tx.reference || '—'} • {formatDateTime(tx.created_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={String(tx.status || '').toLowerCase() === 'success' ? 'success' : String(tx.status || '').toLowerCase() === 'failed' ? 'danger' : 'warning'}>{tx.status || 'pending'}</Badge>
                <div className="text-sm font-semibold text-foreground">₦{formatMoney(tx.amount || 0)}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Service-level issue tracking and support history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.length === 0 ? <div className="text-sm text-muted-foreground">No support reports yet.</div> : null}
          {reports.map((report) => (
            <div key={report.id} className="rounded-2xl border border-border bg-secondary p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-foreground">Report #{report.id}</div>
                <Badge tone={String(report.status || '').toLowerCase() === 'resolved' ? 'success' : 'warning'}>{report.status || 'open'}</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{report.message || report.summary || 'Support report details available in backend.'}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
