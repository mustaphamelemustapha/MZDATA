'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ADMIN_NOTES } from '@/lib/admin-placeholders';
import { formatDateTime, formatMoney } from '@/lib/format';
import { adminGetReferrals } from '@/lib/api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminTable } from '@/components/admin/admin-table';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';

export default function AdminReferralsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminGetReferrals({ page: 1, page_size: 60 });
      setRows(Array.isArray(response?.items) ? response.items : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5 pb-8">
      <AdminPageHeader
        title="Referral management"
        description="Audit referral rewards, qualifying deposits, and duplicate reward protection status."
        actions={(
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
        )}
      />

      <Card className="border-amber-300/80 bg-amber-50/70 dark:border-amber-400/30 dark:bg-amber-500/10">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-card text-amber-700 dark:border-amber-400/30 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <p className="text-sm leading-6 text-muted-foreground">{ADMIN_NOTES.referrals}</p>
        </CardContent>
      </Card>

      <AdminTable
        columns={[
          { key: 'referral_code', label: 'Referral code', render: (row) => row.referrer?.referral_code || 'N/A' },
          { key: 'referrer', label: 'Referrer', render: (row) => row.referrer?.email || 'Unknown' },
          { key: 'referred_user', label: 'Referred user', render: (row) => row.referred_user?.email || 'Unknown' },
          { key: 'status', label: 'Reward status', render: (row) => <StatusBadge status={row.reward_status} /> },
          { key: 'rewarded_at', label: 'Rewarded date', render: (row) => formatDateTime(row.created_at) },
        ]}
        rows={rows}
        empty={loading ? "Loading referrals..." : "No referral rows available yet."}
      />
    </div>
  );
}
