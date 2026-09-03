'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { 
  adminGetBroadcasts, 
  adminGetReports, 
  adminUpdateReport, 
  adminCreateBroadcast, 
  adminUpdateBroadcast 
} from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { startCase } from '@/lib/admin-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { FilterBar } from '@/components/admin/filter-bar';
import { AdminTable } from '@/components/admin/admin-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const STATUS_OPTIONS = ['', 'open', 'resolved', 'rejected'];

export default function AdminSupportPage() {
  const [reports, setReports] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('');

  // Create Announcement Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newLevel, setNewLevel] = useState('info');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newStartsAt, setNewStartsAt] = useState('');
  const [newEndsAt, setNewEndsAt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeRequestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    const requestId = Date.now();
    activeRequestRef.current = requestId;
    setLoading(true);
    try {
      const [reportsRes, broadcastsRes] = await Promise.allSettled([
        adminGetReports({ q: debouncedQuery || undefined, status: status || undefined, page: 1, page_size: 80 }),
        adminGetBroadcasts(),
      ]);

      if (activeRequestRef.current !== requestId) return;

      if (reportsRes.status === 'fulfilled') setReports(Array.isArray(reportsRes.value?.items) ? reportsRes.value.items : []);
      if (broadcastsRes.status === 'fulfilled') setBroadcasts(Array.isArray(broadcastsRes.value) ? broadcastsRes.value : []);
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [debouncedQuery, status]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const markStatus = useCallback(async (report, nextStatus) => {
    setBusyId(report.id);
    try {
      await adminUpdateReport(report.id, { status: nextStatus });
      await load();
    } finally {
      setBusyId(null);
    }
  }, [load]);

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      alert('Title and Message are required.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        title: newTitle.trim(),
        message: newMessage.trim(),
        level: newLevel,
        is_active: newIsActive,
      };
      if (newStartsAt) {
        payload.starts_at = new Date(newStartsAt).toISOString();
      }
      if (newEndsAt) {
        payload.ends_at = new Date(newEndsAt).toISOString();
      }
      await adminCreateBroadcast(payload);
      
      // Reset form
      setNewTitle('');
      setNewMessage('');
      setNewLevel('info');
      setNewIsActive(true);
      setNewStartsAt('');
      setNewEndsAt('');
      setShowCreateModal(false);
      await load();
    } catch (err) {
      alert(err.message || 'Failed to create announcement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBroadcastStatus = async (item) => {
    setBusyId(item.id);
    try {
      await adminUpdateBroadcast(item.id, { is_active: !item.is_active });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to update broadcast status');
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo(() => [
    { key: 'user_email', label: 'User' },
    { key: 'transaction_reference', label: 'Subject', render: (row) => row.transaction_reference || `Issue #${row.id}` },
    { key: 'reason', label: 'Message', render: (row) => <span className="line-clamp-2">{row.reason || 'No message'}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'created_at', label: 'Created', render: (row) => formatDateTime(row.created_at) },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <Button variant="secondary" size="sm" disabled={busyId === row.id} onClick={() => markStatus(row, 'open')}>Open</Button>
          <Button variant="secondary" size="sm" disabled={busyId === row.id} onClick={() => markStatus(row, 'resolved')}>Resolve</Button>
          <Button variant="secondary" size="sm" disabled={busyId === row.id} onClick={() => markStatus(row, 'rejected')}>Reject</Button>
        </div>
      ),
    },
  ], [busyId, markStatus]);

  return (
    <div className="space-y-5 pb-8 relative">
      <AdminPageHeader
        title="Support inbox"
        description="Handle reported issues, complaints, and admin communication queue."
        actions={(
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
        )}
      />

      <FilterBar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search by reference, reason, or user email">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-2xl border border-border bg-card px-3 text-sm text-foreground">
          {STATUS_OPTIONS.map((value) => (
            <option key={value || 'all'} value={value}>{value ? startCase(value) : 'All statuses'}</option>
          ))}
        </select>
      </FilterBar>

      <AdminTable columns={columns} rows={reports} empty={loading ? 'Loading support cases...' : 'No support issues found.'} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Broadcast announcements</CardTitle>
            <CardDescription>Messages sent to users from admin notification controls.</CardDescription>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            + New Announcement
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {broadcasts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No broadcast messages created yet.</div>
          ) : broadcasts.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-secondary p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-foreground">{item.title || 'Broadcast'}</div>
                  <Badge tone={item.level === 'critical' ? 'danger' : item.level === 'warning' ? 'warning' : item.level === 'success' ? 'success' : 'neutral'}>
                    {item.level || 'info'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={busyId === item.id}
                    onClick={() => handleToggleBroadcastStatus(item)}
                  >
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.message || ''}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/40 pt-2">
                <div>Created: {formatDateTime(item.created_at)}</div>
                {item.created_by_email && <div>By: {item.created_by_email}</div>}
                {item.starts_at && <div>Starts: {formatDateTime(item.starts_at)}</div>}
                {item.ends_at && <div>Ends: {formatDateTime(item.ends_at)}</div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div>
                <CardTitle className="text-lg">New Broadcast Announcement</CardTitle>
                <CardDescription>Send platform-wide broadcast alerts to users.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowCreateModal(false)} disabled={isSaving}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCreateBroadcast}>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="E.g., System Maintenance"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    required
                    minLength={6}
                    maxLength={2000}
                    placeholder="Enter the broadcast message detail..."
                    className="w-full min-h-[100px] rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Severity Level</label>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="w-full h-11 rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isSaving}
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="success">Success (Green)</option>
                      <option value="warning">Warning (Amber)</option>
                      <option value="critical">Critical (Red)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Initial Status</label>
                    <select
                      value={newIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setNewIsActive(e.target.value === 'active')}
                      className="w-full h-11 rounded-2xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isSaving}
                    >
                      <option value="active">Active (Live)</option>
                      <option value="inactive">Inactive (Draft)</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Starts At (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={newStartsAt}
                      onChange={(e) => setNewStartsAt(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ends At (Optional)</label>
                    <Input
                      type="datetime-local"
                      value={newEndsAt}
                      onChange={(e) => setNewEndsAt(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 border-t border-border/50 bg-secondary/20">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Creating...' : 'Create Announcement'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

