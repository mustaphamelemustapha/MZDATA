'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Wallet2, Search, Users, ShieldCheck, User, Briefcase, Layers, TrendingUp } from 'lucide-react';
import { adminGetTransactions, adminGetWallets, adminReconcileDelivered, adminAdjustWallet } from '@/lib/api';
import { ADMIN_NOTES } from '@/lib/admin-placeholders';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PremiumDataTable } from '@/components/admin/premium-data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { motion } from 'framer-motion';

export default function AdminWalletsPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'customer' | 'admin' | 'agent'
  const [walletRows, setWalletRows] = useState([]);
  const [totalWallets, setTotalWallets] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [aggregateBalance, setAggregateBalance] = useState(0);
  const [usersBalance, setUsersBalance] = useState(0);
  const [adminsBalance, setAdminsBalance] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [totalAdminsCount, setTotalAdminsCount] = useState(0);
  
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
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    const requestId = Date.now();
    activeRequestRef.current = requestId;
    setLoading(true);
    try {
      const [walletsRes, ledgerRes] = await Promise.allSettled([
        adminGetWallets({
          page,
          page_size: pageSize,
          q: debouncedQuery || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
        }),
        adminGetTransactions({ page: 1, page_size: 10 }),
      ]);

      if (activeRequestRef.current !== requestId) return;

      if (walletsRes.status === 'fulfilled') {
        const data = walletsRes.value;
        const rows = Array.isArray(data?.items) ? data.items : [];
        setWalletRows(
          rows.map((item) => ({
            id: item.user_id,
            full_name: item.full_name,
            email: item.email,
            phone_number: item.phone_number,
            role: item.role || 'customer',
            isAdmin: Boolean(item.is_admin || item.role === 'admin'),
            balance: Number(item.wallet_balance || 0),
            status: item.is_active ? 'active' : 'suspended',
            updated_at: item.wallet_updated_at,
          }))
        );
        setTotalWallets(Number(data?.total || 0));
        setAggregateBalance(Number(data?.aggregate_balance || 0));
        setUsersBalance(Number(data?.users_balance || 0));
        setAdminsBalance(Number(data?.admins_balance || 0));
        setTotalUsersCount(Number(data?.total_users_count || 0));
        setTotalAdminsCount(Number(data?.total_admins_count || 0));
      }

      if (ledgerRes.status === 'fulfilled') {
        const data = ledgerRes.value;
        setLedgerRows(Array.isArray(data?.items) ? data.items : []);
        setLedgerTotal(Number(data?.total || 0));
      }
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [debouncedQuery, roleFilter, page]);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const columns = [
    { key: 'id', label: 'User ID', sortable: false, render: (row) => <span className="font-mono text-muted-foreground">{row.id}</span> },
    {
      key: 'full_name',
      label: 'Account Holder',
      sortable: false,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.full_name}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Account Type',
      sortable: false,
      render: (row) => {
        if (row.isAdmin || row.role === 'admin') {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              ADMIN
            </span>
          );
        }
        if (row.role === 'agent') {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Briefcase className="h-3.5 w-3.5" />
              AGENT
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <User className="h-3 w-3" />
            CUSTOMER
          </span>
        );
      },
    },
    { key: 'phone_number', label: 'Phone', sortable: false },
    {
      key: 'balance',
      label: 'Wallet Balance',
      sortable: false,
      render: (row) => (
        <span className={`font-semibold ${row.isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-brand'}`}>
          ₦{formatMoney(row.balance || 0)}
        </span>
      ),
    },
    { key: 'status', label: 'Status', sortable: false, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'updated_at', label: 'Last Activity', sortable: false, render: (row) => <span className="text-xs text-muted-foreground">{formatDateTime(row.updated_at)}</span> },
  ];

  return (
    <div className="space-y-6 pb-8">
      <AdminPageHeader
        eyebrow="Financials & Vault"
        title="Wallets & Financial Ledger"
        description="Monitor user balances, admin vault floats, funding inflow, and execute manual wallet operations."
        actions={(
          <Button variant="outline" className="rounded-xl border-border bg-card/50 backdrop-blur-xl hover:bg-secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
            Refresh Data
          </Button>
        )}
      />

      {/* Financial Breakdown Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Customer Balances */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Total Customer Balances</span>
                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Liabilities
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">₦{formatMoney(usersBalance)}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Across {totalUsersCount} customer/agent wallets
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Admin Float / Balances */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Total Admin Balances</span>
                <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  Admin Float
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">₦{formatMoney(adminsBalance)}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Across {totalAdminsCount} admin accounts
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Combined System Aggregate */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Grand Total Balance</span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  System Total
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">₦{formatMoney(aggregateBalance)}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Users (₦{formatMoney(usersBalance)}) + Admin (₦{formatMoney(adminsBalance)})
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tracked Accounts & Ledger */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Tracked Accounts</span>
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {ledgerTotal} Events
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{totalWallets}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalUsersCount} Customers • {totalAdminsCount} Admins
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Account Type Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => { setRoleFilter('all'); setPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            roleFilter === 'all'
              ? 'bg-foreground text-background shadow-sm'
              : 'bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
          }`}
        >
          All Accounts ({totalUsersCount + totalAdminsCount})
        </button>
        <button
          type="button"
          onClick={() => { setRoleFilter('customer'); setPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            roleFilter === 'customer'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
          }`}
        >
          Customers Only ({totalUsersCount})
        </button>
        <button
          type="button"
          onClick={() => { setRoleFilter('admin'); setPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            roleFilter === 'admin'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
          }`}
        >
          Admins Only ({totalAdminsCount})
        </button>
        <button
          type="button"
          onClick={() => { setRoleFilter('agent'); setPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            roleFilter === 'agent'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50'
          }`}
        >
          Agents Only
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="relative">
          <PremiumDataTable 
            data={walletRows} 
            columns={columns} 
            emptyMessage={loading ? 'Loading wallets...' : 'No wallet rows available.'}
            serverPagination={true}
            totalItems={totalWallets}
            currentPage={page}
            itemsPerPage={pageSize}
            onPageChange={setPage}
            isLoading={loading}
            serverSearchTerm={query}
            onServerSearchChange={setQuery}
            searchPlaceholder="Search name, email, phone, or ID"
          />
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full border-amber-300/80 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-500/10 backdrop-blur-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/20 dark:text-amber-200">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-foreground tracking-tight">Manual Adjustments</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ADMIN_NOTES.walletAdjustments}</p>
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
                  className="mt-2 grid gap-4 items-end bg-background/50 p-4 rounded-2xl border border-amber-300/30"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User ID</label>
                      <Input required type="number" placeholder="e.g. 1" value={adjustForm.userId} onChange={e => setAdjustForm(s => ({ ...s, userId: e.target.value }))} className="h-10 rounded-xl bg-background" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</label>
                      <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/50" value={adjustForm.action} onChange={e => setAdjustForm(s => ({ ...s, action: e.target.value }))}>
                        <option value="credit">Credit</option>
                        <option value="debit">Debit</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount (₦)</label>
                      <Input required type="number" step="0.01" min="0" placeholder="0.00" value={adjustForm.amount} onChange={e => setAdjustForm(s => ({ ...s, amount: e.target.value }))} className="h-10 rounded-xl bg-background" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</label>
                      <Input required placeholder="e.g. Refund" value={adjustForm.reason} onChange={e => setAdjustForm(s => ({ ...s, reason: e.target.value }))} className="h-10 rounded-xl bg-background" />
                    </div>
                  </div>
                  <Button type="submit" disabled={adjustForm.loading} className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
                    {adjustForm.loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wallet2 className="mr-2 h-4 w-4" />}
                    Execute Adjustment
                  </Button>
                </form>

                {adjustForm.error && <div className="text-sm font-medium text-destructive px-2">{adjustForm.error}</div>}
                {adjustForm.success && <div className="text-sm font-medium text-green-600 dark:text-green-400 px-2">{adjustForm.success}</div>}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setReconcileForm((s) => ({ ...s, loading: true, error: '', success: '' }));
                    try {
                      const res = await adminReconcileDelivered({
                        reference: reconcileForm.reference,
                        note: reconcileForm.note || undefined,
                      });
                      setReconcileForm((s) => ({ ...s, loading: false, success: `Reconciled ${res.reference} to success.`, reference: '', note: '' }));
                      load();
                    } catch (err) {
                      setReconcileForm((s) => ({ ...s, loading: false, error: err.message || 'Failed to reconcile transaction' }));
                    }
                  }}
                  className="mt-2 grid gap-4 bg-background/50 p-4 rounded-2xl border border-amber-300/30"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Reference</label>
                    <Input required placeholder="e.g. DATA_0A9537269309" value={reconcileForm.reference} onChange={(e) => setReconcileForm((s) => ({ ...s, reference: e.target.value }))} className="h-10 rounded-xl bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Note</label>
                    <Input placeholder="Delivered confirmed by customer" value={reconcileForm.note} onChange={(e) => setReconcileForm((s) => ({ ...s, note: e.target.value }))} className="h-10 rounded-xl bg-background" />
                  </div>
                  <Button type="submit" disabled={reconcileForm.loading} className="w-full h-10 rounded-xl mt-2">
                    {reconcileForm.loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Wallet2 className="mr-2 h-4 w-4" />}
                    Reconcile
                  </Button>
                </form>

                {reconcileForm.error && <div className="text-sm font-medium text-destructive px-2">{reconcileForm.error}</div>}
                {reconcileForm.success && <div className="text-sm font-medium text-green-600 dark:text-green-400 px-2">{reconcileForm.success}</div>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Ledger Events</CardTitle>
              <CardDescription>Latest funding and service debits from transaction rails.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {ledgerRows.map((row) => (
                <div key={row.reference || row.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-background p-4">
                  <div>
                    <div className="font-mono text-xs font-medium text-foreground">{row.reference}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{row.user_email}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(row.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">₦{formatMoney(row.amount || 0)}</div>
                    <div className="mt-1.5"><StatusBadge status={row.status} /></div>
                  </div>
                </div>
              ))}
              {!ledgerRows.length && !loading && (
                <div className="text-sm text-muted-foreground py-8 text-center rounded-2xl border border-dashed border-border">No ledger events available.</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
