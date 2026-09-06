'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Megaphone, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.notifications)) return value.notifications;
  if (Array.isArray(value?.announcements)) return value.announcements;
  if (value && typeof value === 'object') return [value];
  return [];
}

function normalizeNotification(item, index) {
  return {
    id: item.id || item.reference || `notification-${index}`,
    title: item.title || item.subject || item.heading || 'Platform notification',
    message: item.message || item.body || item.text || item.description || 'No message body available.',
    created_at: item.created_at || item.createdAt || item.date || item.published_at || null,
    status: item.status || item.type || item.category || 'update',
  };
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [broadcastRes, summaryRes] = await Promise.allSettled([
        apiFetch('/notifications/broadcast'),
        apiFetch('/dashboard/summary'),
      ]);

      const broadcastItems = broadcastRes.status === 'fulfilled' ? asArray(broadcastRes.value) : [];
      const summaryItems = summaryRes.status === 'fulfilled' ? asArray(summaryRes.value?.announcements) : [];
      const merged = [...broadcastItems, ...summaryItems]
        .map(normalizeNotification)
        .filter((item, index, list) => list.findIndex((entry) => entry.id === item.id && entry.title === item.title) === index);

      setItems(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const latest = useMemo(() => items.slice(0, 8), [items]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Notifications"
        title="Platform notifications"
        description="Important MZDATA updates, broadcast messages, and service announcements in one place."
        actions={(
          <Button variant="secondary" onClick={() => load()}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="flex items-start gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Notification center</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use this section for platform messages instead of mixing notifications into transaction history.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="axis-label">Visible updates</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{latest.length}</div>
            <div className="mt-2 text-sm text-muted-foreground">Broadcasts and announcements</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest notifications</CardTitle>
          <CardDescription>Messages shown here come from the backend notification and announcement feeds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <div className="text-sm text-muted-foreground">Loading notifications...</div> : null}
          {latest.length === 0 && !loading ? (
            <div className="rounded-3xl border border-dashed border-border bg-secondary p-6 text-sm text-muted-foreground">
              No notifications yet. New platform updates will appear here.
            </div>
          ) : null}
          {latest.map((item) => (
            <div key={item.id} className="rounded-3xl border border-border bg-secondary p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card text-primary ring-1 ring-border">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</div>
                    {item.created_at ? <div className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</div> : null}
                  </div>
                </div>
                <Badge tone="neutral" className="w-fit capitalize">{String(item.status).replace(/_/g, ' ')}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
