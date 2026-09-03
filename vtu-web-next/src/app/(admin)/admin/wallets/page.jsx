'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Wallet2 } from 'lucide-react';
import { adminGetTransactions, adminGetWallets, adminReconcileDelivered } from '@/lib/api';
import { ADMIN_NOTES } from '@/lib/admin-placeholders';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminAdjustWallet } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminTable } from '@/components/admin/admin-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { StatusBadge } from '@/components/admin/status-badge';

export default function AdminWalletsPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [walletRows, setWalletRows] = useState([]);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aggregateBalance, setAggregateBalance] = useState(0);
  const [adjustForm, setAdjustForm] = useState({
    userId: '',
    amount: '',
    action: 'credit',
    reason: '',
    loading: false,
    error: '',
    success: '',
  });
  const [reconcileForm, setReconcileForm] = useState({
    reference: '',
    note: '',
    loading: false,
    error: '',
    success: '',
  });

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
      const pageSize = 100;
      const maxPages = 20;
      let page = 1;
      const allRows = [];
      let aggregate = 0;

      while (page <= maxPages) {
        const wallets = await adminGetWallets({ page, page_size: pageSize, q: debouncedQuery || undefined });
        if (activeRequestRef.current !== requestId) return;
        const rows = Array.isArray(wallets?.items) ? wallets.items : [];
        if (Number(wallets?.aggregate_balance || 0)) aggregate = Number(wallets.aggregate_balance);
        allRows.push(...rows);

        const hasNext =
          wallets?.has_next === true ||
          wallets?.next_page != null ||
          (typeof wallets?.total_pages === 'number' && page < wallets.total_pages) ||
          rows.length === pageSize;
        if (!hasNext) break;
        page += 1;
      }

      const normalizedQuery = String(debouncedQuery || '').trim().toLowerCase();
      const visibleRows = normalizedQuery
        ? allRows.filter((item) => {
            const text = `${item?.full_name || ''} ${item?.email || ''} ${item?.phone_number || ''} ${item?.user_id || ''}`.toLowerCase();
            return text.includes(normalizedQuery);
          })
        : allRows;

      setWalletRows(
        visibleRows.map((item) => ({
          id: item.user_id,
          full_name: item.full_name,
          email: item.email,
          phone_number: item.phone_number,
          balance: Number(item.wallet_balance || 0),
          status: item.is_active ? 'active' : 'suspended',
          updated_at: item.wallet_updated_at,
        })),
      );
      setAggregateBalance(aggregate);

      // Load full ledger history (all pages), not only recent rows.
      const ledgerPageSize = 200;
      let ledgerPage = 1;
      const ledgerAllRows = [];
      let ledgerExpectedTotal = 0;
      while (ledgerPage <= 200) {
        const ledger = await adminGetTransactions({ page: ledgerPage, page_size: ledgerPageSize });
        if (activeRequestRef.current !== requestId) return;
        const ledgerItems = Array.isArray(ledger?.items) ? ledger.items : [];
        ledgerExpectedTotal = Number(ledger?.total || ledgerExpectedTotal || 0);
        if (!ledgerItems.length) break;
        ledgerAllRows.push(...ledgerItems);
        if (ledgerExpectedTotal > 0 && ledgerAllRows.length >= ledgerExpectedTotal) break;
        ledgerPage += 1;
      }
      setLedgerRows(ledgerAllRows);
      setLedgerTotal(ledgerExpectedTotal || ledgerAllRows.length);
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [debouncedQuery]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const totalBalance = useMemo(
    () => (aggregateBalance ? aggregateBalance : walletRows.reduce((sum, row) => sum + Number(row.balance || 0), 0)),
    [aggregateBalance, walletRows],
  );

  return (
    <div className="space-y-5 pb-8">
      <AdminPageHeader
        title="Wallets and ledger"
        description="Monitor user balances, credit/debit events, funding inflow, and audit-sensitive wallet operations."
        actions={(
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="axis-label">Tracked wallets</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{walletRows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="axis-label">Aggregate balance</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">₦{formatMoney(totalBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="axis-label">Ledger records</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{ledgerTotal || ledgerRows.length}</div>
          </CardContent>
        </Card>
      </div>

      <FilterBar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search by user name, email, phone, or user ID"
      />

      <AdminTable
        columns={[
          { key: 'id', label: 'User ID' },
          { key: 'full_name', label: 'User' },
          { key: 'email', label: 'Email' },
          { key: 'phone_number', label: 'Phone' },
          { key: 'balance', label: 'Wallet balance', render: (row) => `₦${formatMoney(row.balance || 0)}` },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          { key: 'updated_at', label: 'Updated', render: (row) => formatDateTime(row.updated_at) },
        ]}
        rows={walletRows}
        empty={loading ? 'Loading wallets...' : 'No wallet rows available.'}
      />

      <Card>
        <CardHeader>
          <CardTitle>Ledger events</CardTitle>
          <CardDescription>Funding events, service debits, and referral rewards from transaction rails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ledgerRows.map((row) => (
            <div key={row.reference || row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary p-3">
              <div>
                <div className="text-sm font-medium text-foreground">{row.reference}</div>
                <div className="text-xs text-muted-foreground">{row.user_email} • {formatDateTime(row.created_at)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">₦{formatMoney(row.amount || 0)}</div>
                <StatusBadge status={row.status} />
              </div>
            </div>
          ))}
          {!ledgerRows.length && !loading ? <div className="text-sm text-muted-foreground">No ledger rows available.</div> : null}
        </CardContent>
      </Card>

      <Card className="border-amber-300/80 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-500/10">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300 bg-card text-amber-700 dark:border-amber-400/30 dark:text-amber-200">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-foreground">Manual wallet adjustment (protected)</div>
                <p className="text-sm text-muted-foreground">{ADMIN_NOTES.walletAdjustments}</p>
              </div>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setAdjustForm(s => ({ ...s, loading: true, error: '', success: '' }));
                try {
                  await adminAdjustWallet({
                    user_id: parseInt(adjustForm.userId, 10),
                    amount: parseFloat(adjustForm.amount),
                    action: adjustForm.action,
                    reason: adjustForm.reason,
                  });
                  setAdjustForm(s => ({ ...s, loading: false, success: 'Wallet adjusted successfully', userId: '', amount: '', reason: '' }));
                  load();
                } catch (err) {
                  setAdjustForm(s => ({ ...s, loading: false, error: err.message || 'Failed to adjust wallet' }));
                }
              }}
              className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end"
            >
              <div className="space-y-2">
                <label className="text-xs font-medium">User ID</label>
                <Input 
                  required 
                  type="number" 
                  placeholder="e.g. 1" 
                  value={adjustForm.userId}
                  onChange={e => setAdjustForm(s => ({ ...s, userId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Action</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={adjustForm.action}
                  onChange={e => setAdjustForm(s => ({ ...s, action: e.target.value }))}
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Amount (₦)</label>
                <Input 
                  required 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00" 
                  value={adjustForm.amount}
                  onChange={e => setAdjustForm(s => ({ ...s, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Reason</label>
                <Input 
                  required 
                  placeholder="e.g. Refund" 
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm(s => ({ ...s, reason: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={adjustForm.loading} className="w-full">
                {adjustForm.loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wallet2 className="mr-2 h-4 w-4" />}
                Submit
              </Button>
            </form>

            {adjustForm.error && (
              <div className="text-sm font-medium text-destructive mt-2">{adjustForm.error}</div>
            )}
            {adjustForm.success && (
              <div className="text-sm font-medium text-green-600 dark:text-green-400 mt-2">{adjustForm.success}</div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setReconcileForm((s) => ({ ...s, loading: true, error: '', success: '' }));
                try {
                  const res = await adminReconcileDelivered({
                    reference: reconcileForm.reference,
                    note: reconcileForm.note || undefined,
                  });
                  setReconcileForm((s) => ({
                    ...s,
                    loading: false,
                    success: `Reconciled ${res.reference} to success.`,
                    reference: '',
                    note: '',
                  }));
                  load();
                } catch (err) {
                  setReconcileForm((s) => ({
                    ...s,
                    loading: false,
                    error: err.message || 'Failed to reconcile transaction',
                  }));
                }
              }}
              className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end"
            >
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-medium">Transaction reference</label>
                <Input
                  required
                  placeholder="e.g. DATA_0A95372693093E3AA2A466C5"
                  value={reconcileForm.reference}
                  onChange={(e) => setReconcileForm((s) => ({ ...s, reference: e.target.value }))}
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-medium">Admin note</label>
                <Input
                  placeholder="Delivered confirmed by customer"
                  value={reconcileForm.note}
                  onChange={(e) => setReconcileForm((s) => ({ ...s, note: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={reconcileForm.loading} className="w-full">
                {reconcileForm.loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wallet2 className="mr-2 h-4 w-4" />}
                Reconcile
              </Button>
            </form>

            {reconcileForm.error && (
              <div className="text-sm font-medium text-destructive mt-2">{reconcileForm.error}</div>
            )}
            {reconcileForm.success && (
              <div className="text-sm font-medium text-green-600 dark:text-green-400 mt-2">{reconcileForm.success}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
