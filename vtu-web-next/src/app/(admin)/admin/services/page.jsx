'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Cable, GraduationCap, RefreshCw, Smartphone, Wifi, Zap } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { filterAllowedAmigoPlans } from '@/lib/amigo-plan-policy';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminTable } from '@/components/admin/admin-table';
import { StatusBadge } from '@/components/admin/status-badge';

function isEnabled(list) {
  return Array.isArray(list) && list.length > 0;
}

export default function AdminServicesPage() {
  const [catalog, setCatalog] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogRes, plansRes] = await Promise.allSettled([
        apiFetch('/services/catalog'),
        apiFetch('/data/plans'),
      ]);

      if (catalogRes.status === 'fulfilled') setCatalog(catalogRes.value || {});
      if (plansRes.status === 'fulfilled') {
        const source = Array.isArray(plansRes.value)
          ? plansRes.value
          : plansRes.value?.data ?? plansRes.value?.items ?? plansRes.value?.plans ?? [];
        const next = filterAllowedAmigoPlans(Array.isArray(source) ? source : []);
        setPlans(next);
        setLastSync(new Date().toISOString());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const rows = useMemo(() => {
    const plansByNetwork = Array.isArray(plans)
      ? plans.reduce((acc, item) => {
          const key = String(item?.network || '').toLowerCase() || 'other';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {})
      : {};

    return [
      {
        id: 'data',
        icon: Wifi,
        service: 'Data',
        enabled: isEnabled(plans),
        providerStatus: Object.keys(plansByNetwork).length ? 'connected' : 'degraded',
        failureRate: Object.keys(plansByNetwork).length ? 'Low' : 'Unknown',
        lastSync,
      },
      {
        id: 'airtime',
        icon: Smartphone,
        service: 'Airtime',
        enabled: isEnabled(catalog?.airtime_networks),
        providerStatus: isEnabled(catalog?.airtime_networks) ? 'connected' : 'degraded',
        failureRate: 'Low',
        lastSync,
      },
      {
        id: 'electricity',
        icon: Zap,
        service: 'Electricity',
        enabled: isEnabled(catalog?.electricity_discos),
        providerStatus: isEnabled(catalog?.electricity_discos) ? 'connected' : 'degraded',
        failureRate: 'Medium',
        lastSync,
      },
      {
        id: 'cable',
        icon: Cable,
        service: 'Cable TV',
        enabled: isEnabled(catalog?.cable_providers),
        providerStatus: isEnabled(catalog?.cable_providers) ? 'connected' : 'degraded',
        failureRate: 'Low',
        lastSync,
      },
      {
        id: 'exam',
        icon: GraduationCap,
        service: 'Exam PINs',
        enabled: isEnabled(catalog?.exam_types),
        providerStatus: isEnabled(catalog?.exam_types) ? 'connected' : 'degraded',
        failureRate: 'Low',
        lastSync,
      },
    ];
  }, [catalog?.airtime_networks, catalog?.cable_providers, catalog?.electricity_discos, catalog?.exam_types, lastSync, plans]);

  return (
    <div className="space-y-5 pb-8">
      <AdminPageHeader
        title="Services management"
        description="Control service states, provider health visibility, and operational sync status."
        actions={(
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh services
          </Button>
        )}
      />

      <AdminTable
        columns={[
          {
            key: 'service',
            label: 'Service',
            render: (row) => {
              const Icon = row.icon;
              return (
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-foreground">{row.service}</span>
                </div>
              );
            },
          },
          { key: 'enabled', label: 'Enabled/Disabled', render: (row) => <StatusBadge status={row.enabled ? 'enabled' : 'disabled'} /> },
          { key: 'providerStatus', label: 'Provider connection', render: (row) => <StatusBadge status={row.providerStatus} /> },
          { key: 'lastSync', label: 'Last sync', render: (row) => formatDateTime(row.lastSync) },
          { key: 'failureRate', label: 'Failure rate', render: (row) => row.failureRate },
          {
            key: 'actions',
            label: 'Actions',
            render: () => (
              <div className="flex flex-wrap gap-1.5">
                <Button variant="secondary" size="sm" disabled>Enable/Disable</Button>
                <Button variant="secondary" size="sm" disabled>Provider diagnostics</Button>
              </div>
            ),
          },
        ]}
        rows={rows}
        empty={loading ? 'Loading service statuses...' : 'No services available.'}
      />

      <Card className="border-amber-300/80 bg-amber-50/70 dark:border-amber-400/30 dark:bg-amber-500/10">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-card text-amber-700 dark:border-amber-400/30 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <p className="text-sm leading-6 text-muted-foreground">
            Service toggles and hard provider failover controls are intentionally locked in UI until dedicated backend endpoints are exposed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
