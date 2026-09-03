'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { adminFailAndRefundPending, adminFailAndRefundPendingBulk, adminGetAuditLogs, adminGetTransactionDetails, adminGetTransactions, adminReconcileDelivered, adminReconcileDeliveredBulk } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { startCase } from '@/lib/admin-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { FilterBar } from '@/components/admin/filter-bar';
import { AdminTable } from '@/components/admin/admin-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

const STATUS_FILTERS = ['', 'success', 'pending', 'failed', 'refunded'];
const TYPE_FILTERS = ['', 'data', 'airtime', 'electricity', 'cable', 'exam', 'deposit'];
const ADMIN_PAGE_SIZE = 200;

export default function AdminTransactionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [selectedDetailsLoading, setSelectedDetailsLoading] = useState(false);
  const [selectedDetailsError, setSelectedDetailsError] = useState('');
  const [reconcileNote, setReconcileNote] = useState('');
  const [reconcileConfirmOpen, setReconcileConfirmOpen] = useState(false);
  const [reconcileBusy, setReconcileBusy] = useState(false);
  const [reconcileError, setReconcileError] = useState('');
  const [reconcileSuccess, setReconcileSuccess] = useState('');
  const [bulkReferences, setBulkReferences] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkFailBusy, setBulkFailBusy] = useState(false);
  const [bulkFailError, setBulkFailError] = useState('');
  const [bulkFailSuccess, setBulkFailSuccess] = useState('');
  const [failRefundConfirmOpen, setFailRefundConfirmOpen] = useState(false);
  const [failRefundBusy, setFailRefundBusy] = useState(false);
  const [failRefundError, setFailRefundError] = useState('');
  const [failRefundSuccess, setFailRefundSuccess] = useState('');

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
      const txParams = {
        q: debouncedQuery || undefined,
        status: status || undefined,
        tx_type: type || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page: 1,
        page_size: ADMIN_PAGE_SIZE,
      };
      const firstPage = await adminGetTransactions(txParams);
      if (activeRequestRef.current !== requestId) return;

      const allTransactions = Array.isArray(firstPage?.items) ? [...firstPage.items] : [];
      const expectedTotal = Number(firstPage?.total || allTransactions.length || 0);
      let currentPage = 1;

      while (allTransactions.length < expectedTotal) {
        currentPage += 1;
        const pageResult = await adminGetTransactions({ ...txParams, page: currentPage });
        if (activeRequestRef.current !== requestId) return;
        const pageItems = Array.isArray(pageResult?.items) ? pageResult.items : [];
        if (!pageItems.length) break;
        allTransactions.push(...pageItems);
      }

      setRows(allTransactions);
      setTotalRows(expectedTotal);
    } catch (err) {
      if (activeRequestRef.current === requestId) {
        setRows([]);
        setTotalRows(0);
      }
      console.error('Admin transactions load failed:', err);
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [debouncedQuery, fromDate, status, toDate, type]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const columns = useMemo(() => [
    { key: 'reference', label: 'Reference' },
    { key: 'user_email', label: 'User' },
    { key: 'tx_type', label: 'Service', render: (row) => startCase(row.tx_type) },
    { key: 'network', label: 'Provider/Network', render: (row) => row.network || '—' },
    { key: 'amount', label: 'Amount', render: (row) => `₦${formatMoney(row.amount || 0)}` },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'created_at', label: 'Date/time', render: (row) => formatDateTime(row.created_at) },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            setSelected(row);
            setSelectedDetails(null);
            setSelectedDetailsError('');
            setSelectedDetailsLoading(true);
            try {
              const [details, auditRes] = await Promise.allSettled([
                adminGetTransactionDetails(row.reference),
                adminGetAuditLogs({ reference: row.reference, page_size: 5 }),
              ]);
              const detailsData = details.status === 'fulfilled' ? (details.value || null) : null;
              const latestAudit = auditRes.status === 'fulfilled'
                ? (Array.isArray(auditRes.value?.items) ? auditRes.value.items[0] || null : null)
                : null;
              setSelectedDetails(detailsData ? { ...detailsData, audit: latestAudit } : null);
              if (details.status === 'rejected') {
                setSelectedDetailsError(details.reason?.message || 'Unable to load provider details.');
              }
            } catch (err) {
              setSelectedDetailsError(err?.message || 'Unable to load provider details.');
            } finally {
              setSelectedDetailsLoading(false);
            }
          }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View details
        </Button>
      ),
    },
  ], []);

  return (
    <div className="space-y-5 pb-8">
      <AdminPageHeader
        title="Transactions management"
        description={`Inspect status, provider, references, and audit activity. Showing ${loading ? '...' : totalRows} transactions.`}
        actions={(
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
        )}
      />

      <FilterBar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search by reference or user email">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-2xl border border-border bg-card px-3 text-sm text-foreground">
          {STATUS_FILTERS.map((value) => (
            <option key={value || 'all'} value={value}>{value ? startCase(value) : 'All status'}</option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-11 rounded-2xl border border-border bg-card px-3 text-sm text-foreground">
          {TYPE_FILTERS.map((value) => (
            <option key={value || 'all'} value={value}>{value ? startCase(value) : 'All services'}</option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11 rounded-2xl border border-border bg-card px-3 text-sm text-foreground" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-11 rounded-2xl border border-border bg-card px-3 text-sm text-foreground" />
      </FilterBar>

      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="text-base font-semibold text-foreground">Bulk reconcile delivered</h3>
        <p className="mt-1 text-sm text-muted-foreground">Paste references (one per line). Use only when customers confirmed delivery.</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_280px_auto]">
          <textarea
            value={bulkReferences}
            onChange={(e) => setBulkReferences(e.target.value)}
            placeholder={'DATA_ABC...\nDATA_DEF...\nDATA_XYZ...'}
            className="min-h-[110px] rounded-2xl border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Input
            value={bulkNote}
            onChange={(e) => setBulkNote(e.target.value)}
            placeholder="Audit note (optional)"
          />
          <Button
            variant="default"
            disabled={bulkBusy}
            onClick={async () => {
              const refs = bulkReferences
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean);
              if (!refs.length) {
                setBulkError('Please add at least one reference.');
                setBulkSuccess('');
                return;
              }
              setBulkBusy(true);
              setBulkError('');
              setBulkSuccess('');
              try {
                const result = await adminReconcileDeliveredBulk({
                  references: refs,
                  note: bulkNote || undefined,
                });
                setBulkSuccess(`Processed ${result?.processed || refs.length}. Succeeded: ${result?.succeeded || 0}, Failed: ${result?.failed || 0}.`);
                await load();
              } catch (err) {
                setBulkError(err?.message || 'Bulk reconcile failed.');
              } finally {
                setBulkBusy(false);
              }
            }}
          >
            {bulkBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Run bulk reconcile
          </Button>
        </div>
        {bulkError ? <div className="mt-2 text-xs font-medium text-destructive">{bulkError}</div> : null}
        {bulkSuccess ? <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">{bulkSuccess}</div> : null}
        <div className="mt-5 border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground">Bulk fail + refund pending</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Use only for provider-confirmed failures that are still pending. This refunds user wallets.
          </p>
          <div className="mt-3 flex justify-end">
            <Button
              variant="destructive"
              disabled={bulkFailBusy}
              onClick={async () => {
                const refs = bulkReferences
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean);
                if (!refs.length) {
                  setBulkFailError('Please add at least one reference.');
                  setBulkFailSuccess('');
                  return;
                }
                setBulkFailBusy(true);
                setBulkFailError('');
                setBulkFailSuccess('');
                try {
                  const result = await adminFailAndRefundPendingBulk({
                    references: refs,
                    note: bulkNote || undefined,
                  });
                  let msg = `Processed ${result?.processed || refs.length}. Succeeded: ${result?.succeeded || 0}, Failed: ${result?.failed || 0}.`;
                  if (result?.failed > 0 && Array.isArray(result.results)) {
                    const errs = result.results.filter(r => !r.ok).map(r => `${r.reference}: ${r.detail}`).join(' | ');
                    msg += ` Errors: ${errs}`;
                  }
                  setBulkFailSuccess(msg);
                  await load();
                } catch (err) {
                  setBulkFailError(err?.message || 'Bulk fail + refund failed.');
                } finally {
                  setBulkFailBusy(false);
                }
              }}
            >
              {bulkFailBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              Run bulk fail + refund
            </Button>
          </div>
          {bulkFailError ? <div className="mt-2 text-xs font-medium text-destructive">{bulkFailError}</div> : null}
          {bulkFailSuccess ? <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-300">{bulkFailSuccess}</div> : null}
        </div>
      </div>

      <AdminTable columns={columns} rows={rows} empty={loading ? 'Loading transactions...' : 'No transactions for this filter.'} />

      {selected ? (
        <div className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Transaction details</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelected(null);
                setSelectedDetails(null);
                setSelectedDetailsError('');
              }}
            >
              Close
            </Button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(selected).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-border bg-secondary p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{startCase(key)}</div>
                <div className="mt-1 text-sm text-foreground break-all">{value == null || value === '' ? '—' : String(value)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl border border-dashed border-border bg-secondary p-3 text-sm text-muted-foreground">
            Use reconciliation only when customer confirms service delivery but system status is wrong.
          </div>
          <div className="mt-3 rounded-2xl border border-border bg-secondary p-3">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Provider raw response</div>
            {selectedDetailsLoading ? (
              <div className="mt-2 text-sm text-muted-foreground">Loading provider payload...</div>
            ) : selectedDetailsError ? (
              <div className="mt-2 text-sm font-medium text-destructive">{selectedDetailsError}</div>
            ) : selectedDetails?.provider_payload_pretty ? (
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-border bg-background p-3 text-xs leading-5 text-foreground">
                {selectedDetails.provider_payload_pretty}
              </pre>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">No provider payload captured for this transaction.</div>
            )}
          </div>
          <div className="mt-3 rounded-2xl border border-border bg-secondary p-3">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Latest audit</div>
            {selectedDetailsLoading ? (
              <div className="mt-2 text-sm text-muted-foreground">Loading audit...</div>
            ) : selectedDetails?.audit ? (
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <div className="text-sm text-foreground">
                  <span className="text-muted-foreground">Action: </span>
                  {startCase(selectedDetails.audit.action || 'updated')}
                </div>
                <div className="text-sm text-foreground">
                  <span className="text-muted-foreground">Time: </span>
                  {formatDateTime(selectedDetails.audit.created_at)}
                </div>
                <div className="text-sm text-foreground md:col-span-2 break-all">
                  <span className="text-muted-foreground">Admin: </span>
                  {selectedDetails.audit.admin_email || '—'}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">No audit entry recorded for this reference yet.</div>
            )}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Audit note</div>
              <Input
                value={reconcileNote}
                onChange={(e) => setReconcileNote(e.target.value)}
                placeholder="Delivered confirmed by customer"
              />
              {reconcileError ? <div className="text-xs font-medium text-destructive">{reconcileError}</div> : null}
              {reconcileSuccess ? <div className="text-xs font-medium text-emerald-600 dark:text-emerald-300">{reconcileSuccess}</div> : null}
              {failRefundError ? <div className="text-xs font-medium text-destructive">{failRefundError}</div> : null}
              {failRefundSuccess ? <div className="text-xs font-medium text-emerald-600 dark:text-emerald-300">{failRefundSuccess}</div> : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="secondary"
                disabled={failRefundBusy || reconcileBusy || !selected?.reference || String(selected?.status || '').toLowerCase() !== 'pending'}
                onClick={() => {
                  setFailRefundError('');
                  setFailRefundSuccess('');
                  setFailRefundConfirmOpen(true);
                }}
              >
                Fail + refund pending
              </Button>
              <Button
                variant="default"
                disabled={reconcileBusy || failRefundBusy || !selected?.reference}
                onClick={() => {
                  setReconcileError('');
                  setReconcileSuccess('');
                  setReconcileConfirmOpen(true);
                }}
              >
                Reconcile delivered
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={reconcileConfirmOpen}
        title="Reconcile transaction to success?"
        description="This will mark the transaction as delivered success. If it was refunded, wallet refund reversal will be attempted and logged."
        confirmLabel="Yes, reconcile"
        busy={reconcileBusy}
        onCancel={() => setReconcileConfirmOpen(false)}
        onConfirm={async () => {
          if (!selected?.reference) return;
          setReconcileBusy(true);
          setReconcileError('');
          setReconcileSuccess('');
          try {
            const result = await adminReconcileDelivered({
              reference: selected.reference,
              note: reconcileNote || undefined,
            });
            setSelected((prev) => (prev ? { ...prev, status: result.new_status } : prev));
            setReconcileSuccess(`Reconciled ${result.reference} successfully.`);
            setReconcileConfirmOpen(false);
            await load();
          } catch (err) {
            setReconcileError(err?.message || 'Failed to reconcile this transaction.');
          } finally {
            setReconcileBusy(false);
          }
        }}
      />
      <ConfirmDialog
        open={failRefundConfirmOpen}
        title="Fail and refund this pending transaction?"
        description="This action is for provider-confirmed failures. It will credit user wallet and mark the transaction as refunded."
        confirmLabel="Yes, fail + refund"
        busy={failRefundBusy}
        onCancel={() => setFailRefundConfirmOpen(false)}
        onConfirm={async () => {
          if (!selected?.reference) return;
          setFailRefundBusy(true);
          setFailRefundError('');
          setFailRefundSuccess('');
          try {
            const result = await adminFailAndRefundPending({
              reference: selected.reference,
              note: reconcileNote || undefined,
            });
            setSelected((prev) => (prev ? { ...prev, status: result.new_status } : prev));
            setFailRefundSuccess(`Marked ${result.reference} as refunded.`);
            setFailRefundConfirmOpen(false);
            await load();
          } catch (err) {
            setFailRefundError(err?.message || 'Failed to fail/refund this transaction.');
          } finally {
            setFailRefundBusy(false);
          }
        }}
      />
    </div>
  );
}
