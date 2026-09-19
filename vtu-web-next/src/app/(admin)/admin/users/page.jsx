'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Eye, PauseCircle, PlayCircle, RefreshCw, Wallet, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  adminActivateUser,
  adminDeleteUser,
  adminGetUserDetails,
  adminGetUsers,
  adminSuspendUser,
  adminUpdateUserRole,
} from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { FilterBar } from '@/components/admin/filter-bar';
import { AdminTable } from '@/components/admin/admin-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL State
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || 'all';
  const status = searchParams.get('status') || 'all';

  // Component State
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(search);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dataPlans, setDataPlans] = useState([]);
  const [pricingOverrides, setPricingOverrides] = useState([]);
  const [overrideForm, setOverrideForm] = useState({ data_plan_id: '', custom_price: '' });
  const [overrideBusy, setOverrideBusy] = useState(false);

  const activeRequestRef = useRef(0);

  // Sync debounced search to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== search) {
        updateURL({ search: query, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const updateURL = useCallback((updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all' || (key === 'page' && value === 1)) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }, [searchParams, pathname, router]);

  const loadUsers = useCallback(async () => {
    const requestId = Date.now();
    activeRequestRef.current = requestId;
    setLoading(true);
    try {
      const response = await adminGetUsers({ 
        q: search || undefined, 
        role: role !== 'all' ? role : undefined,
        status: status !== 'all' ? status : undefined,
        page, 
        page_size: 50 
      });
      if (activeRequestRef.current !== requestId) return;
      setUsers(Array.isArray(response?.items) ? response.items : []);
      setTotal(response?.total || 0);
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [search, role, status, page]);

  useEffect(() => {
    loadUsers().catch(() => setLoading(false));
  }, [loadUsers]);

  const openUser = useCallback(async (user) => {
    setSelectedUser(user);
    setSelectedDetails(null);
    try {
      const details = await adminGetUserDetails(user.id);
      setSelectedDetails(details);
      
      const { adminGetPricingOverrides, adminGetDataPlans } = await import('@/lib/api');
      try {
        const overrides = await adminGetPricingOverrides(user.id);
        setPricingOverrides(overrides || []);
      } catch (err) {
        console.error("Failed to load pricing overrides", err);
      }
      
      if (!dataPlans.length) {
        try {
          const plans = await adminGetDataPlans();
          setDataPlans(plans?.items || []);
        } catch (err) {
          console.error("Failed to load data plans", err);
        }
      }
    } catch {
      setSelectedDetails({ user, wallet: { balance: 0 }, recent_transactions: [] });
    }
  }, [dataPlans.length]);

  const runAction = useCallback(async () => {
    if (!confirmAction) return;
    setBusy(true);
    try {
      if (confirmAction.type === 'suspend') {
        await adminSuspendUser(confirmAction.user.id);
      } else if (confirmAction.type === 'delete') {
        await adminDeleteUser(confirmAction.user.id);
      } else if (confirmAction.type === 'upgrade_reseller' || confirmAction.type === 'downgrade_user') {
        await adminUpdateUserRole({ 
          user_id: confirmAction.user.id, 
          role: confirmAction.type === 'upgrade_reseller' ? 'reseller' : 'user' 
        });
      } else if (confirmAction.type === 'approve_developer') {
        const { adminApproveDeveloper } = await import('@/lib/api');
        await adminApproveDeveloper(confirmAction.user.id);
      } else if (confirmAction.type === 'suspend_developer') {
        const { adminSuspendDeveloper } = await import('@/lib/api');
        await adminSuspendDeveloper(confirmAction.user.id);
      } else if (confirmAction.type === 'upgrade_developer') {
        const { adminUpgradeDeveloper } = await import('@/lib/api');
        await adminUpgradeDeveloper(confirmAction.user.id);
        alert('Successfully upgraded user to Developer!');
      } else {
        await adminActivateUser(confirmAction.user.id);
      }
      await loadUsers();
      if (selectedUser?.id === confirmAction.user.id) {
        const details = await adminGetUserDetails(confirmAction.user.id);
        setSelectedDetails(details);
      }
      setConfirmAction(null);
    } finally {
      setBusy(false);
    }
  }, [confirmAction, loadUsers, selectedUser?.id]);

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!overrideForm.data_plan_id || !overrideForm.custom_price || !selectedUser) return;
    
    setOverrideBusy(true);
    try {
      const { adminSetPricingOverride, adminGetPricingOverrides } = await import('@/lib/api');
      await adminSetPricingOverride(selectedUser.id, {
        data_plan_id: parseInt(overrideForm.data_plan_id, 10),
        custom_price: parseFloat(overrideForm.custom_price)
      });
      const overrides = await adminGetPricingOverrides(selectedUser.id);
      setPricingOverrides(overrides || []);
      setOverrideForm({ data_plan_id: '', custom_price: '' });
    } catch (err) {
      console.error("Failed to save pricing override", err);
    } finally {
      setOverrideBusy(false);
    }
  };

  const columns = useMemo(() => [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone_number', label: 'Phone' },
    {
      key: 'wallet_balance',
      label: 'Wallet balance',
      render: (row) => <span className="font-medium">{selectedDetails?.user?.id === row.id ? `₦${formatMoney(selectedDetails?.wallet?.balance || 0)}` : 'Open user'}</span>,
    },
    {
      key: 'total_spending',
      label: 'Total spending',
      render: (row) => <span className="font-semibold text-emerald-600">₦{formatMoney(row.total_spending || 0)}</span>,
    },
    {
      key: 'referral_count',
      label: 'Referrals',
      render: (row) => <span className="font-semibold">{row.referral_count || 0} referred</span>,
    },
    { key: 'is_active', label: 'Status', render: (row) => <StatusBadge status={row.is_active ? 'active' : 'suspended'} /> },
    { key: 'created_at', label: 'Joined', render: (row) => <span className="text-muted-foreground">{formatDateTime(row.created_at)}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => openUser(row)}>
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-border"
            onClick={() => setConfirmAction({ type: row.is_active ? 'suspend' : 'activate', user: row })}
          >
            {row.is_active ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
            {row.is_active ? 'Suspend' : 'Activate'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openUser(row)}>
            <Wallet className="h-3.5 w-3.5" />
            Wallet ledger
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmAction({ type: 'delete', user: row })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ], [openUser, selectedDetails?.user?.id, selectedDetails?.wallet?.balance]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-5 pb-8">
      <AdminPageHeader
        title="Users management"
        description="Review accounts, and suspend or re-enable users with confirmation."
        actions={(
          <Button variant="secondary" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh users
          </Button>
        )}
      />

      <FilterBar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search by name, email, or phone"
      >
        <select
          value={role}
          onChange={(e) => updateURL({ role: e.target.value, page: 1 })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">All Tiers</option>
          <option value="user">User</option>
          <option value="reseller">Reseller / Agent</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={status}
          onChange={(e) => updateURL({ status: e.target.value, page: 1 })}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </FilterBar>

      <AdminTable columns={columns} rows={users} empty={loading ? 'Loading users...' : 'No users found.'} />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * 50 + 1, total)} to {Math.min(page * 50, total)} of {total} users
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateURL({ page: page - 1 })}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateURL({ page: page + 1 })}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-card border shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">User Details</h2>
                <p className="text-sm text-muted-foreground">Detailed view for {selectedUser.full_name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-6 p-5">
              <div className="flex items-center justify-between gap-3 rounded-xl border bg-secondary/50 p-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{selectedUser.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.phone_number}</p>
                </div>
                <div className="text-right space-y-2">
                  <div><StatusBadge status={selectedUser.is_active ? 'active' : 'suspended'} /></div>
                  <div className="pt-2 flex flex-col gap-2 items-end">
                    {String(selectedDetails?.user?.role || selectedUser?.role).toLowerCase() !== 'reseller' && String(selectedDetails?.user?.role || selectedUser?.role).toLowerCase() !== 'developer' ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setConfirmAction({ type: 'upgrade_reseller', user: selectedUser })}
                      >
                        Upgrade to Agent
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmAction({ type: 'downgrade_user', user: selectedUser })}
                      >
                        Downgrade to User
                      </Button>
                    )}
                    {String(selectedDetails?.user?.role || selectedUser?.role).toLowerCase() !== 'developer' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white mt-1"
                        onClick={() => setConfirmAction({ type: 'upgrade_developer', user: selectedUser })}
                      >
                        Upgrade to Developer
                      </Button>
                    )}

                    <div className="mt-2 pt-2 border-t border-border w-full flex items-center justify-end gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block leading-none">Developer API</span>
                        <span className="font-bold text-foreground uppercase text-[9px] tracking-wider leading-none">
                          {selectedDetails?.user?.developer_status || selectedUser?.developer_status || 'none'}
                        </span>
                        {selectedDetails?.user?.api_public_key && (
                          <span className="text-[9px] text-muted-foreground block mt-1">
                            Key: {selectedDetails.user.api_public_key}
                          </span>
                        )}
                      </div>
                      {(selectedDetails?.user?.developer_status || selectedUser?.developer_status) === 'applied' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] border-green-600/30 text-green-500 hover:bg-green-500/10 h-7 px-2"
                          onClick={() => setConfirmAction({ type: 'approve_developer', user: selectedUser })}
                        >
                          Approve API
                        </Button>
                      )}
                      {(selectedDetails?.user?.developer_status || selectedUser?.developer_status) === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] border-red-600/30 text-red-500 hover:bg-red-500/10 h-7 px-2"
                          onClick={() => setConfirmAction({ type: 'suspend_developer', user: selectedUser })}
                        >
                          Suspend API
                        </Button>
                      )}
                      {((selectedDetails?.user?.developer_status || selectedUser?.developer_status) === 'none' || (selectedDetails?.user?.developer_status || selectedUser?.developer_status) === 'suspended') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] border-green-600/30 text-green-500 hover:bg-green-500/10 h-7 px-2"
                          onClick={() => setConfirmAction({ type: 'approve_developer', user: selectedUser })}
                        >
                          Enable API
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {!selectedDetails ? (
                <div className="flex justify-center p-8 text-sm text-muted-foreground">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading user details...
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="text-xs font-medium text-muted-foreground">Wallet Balance</div>
                      <div className="mt-1 text-2xl font-semibold text-foreground">₦{formatMoney(selectedDetails?.wallet?.balance || 0)}</div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="text-xs font-medium text-muted-foreground">Referral Code</div>
                      <div className="mt-1 text-xl font-semibold text-foreground font-mono">{selectedDetails?.user?.referral_code || 'N/A'}</div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="text-xs font-medium text-muted-foreground">Recent Transactions</div>
                      <div className="mt-1 text-2xl font-semibold text-foreground">{(selectedDetails?.recent_transactions || []).length}</div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <div className="text-xs font-medium text-muted-foreground">Total Referred</div>
                      <div className="mt-1 text-2xl font-semibold text-foreground">{(selectedDetails?.referred_users || []).length}</div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <h4 className="font-semibold text-sm">Custom Pricing Overrides</h4>
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                      <form onSubmit={handleSaveOverride} className="flex gap-2 items-end mb-4">
                        <div className="flex-1">
                          <label className="text-[10px] font-medium text-muted-foreground block mb-1">Data Plan</label>
                          <select 
                            className="w-full text-sm rounded-md border border-input bg-background px-3 h-8"
                            value={overrideForm.data_plan_id}
                            onChange={e => setOverrideForm(prev => ({...prev, data_plan_id: e.target.value}))}
                            required
                          >
                            <option value="">Select a plan</option>
                            {dataPlans.map(plan => (
                              <option key={plan.id} value={plan.id}>
                                {plan.network} - {plan.plan_name} ({plan.data_size})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="text-[10px] font-medium text-muted-foreground block mb-1">Custom Price (₦)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full text-sm rounded-md border border-input bg-background px-3 h-8"
                            value={overrideForm.custom_price}
                            onChange={e => setOverrideForm(prev => ({...prev, custom_price: e.target.value}))}
                            placeholder="e.g. 145"
                            required
                          />
                        </div>
                        <Button type="submit" size="sm" className="h-8" disabled={overrideBusy || !overrideForm.data_plan_id || !overrideForm.custom_price}>
                          {overrideBusy ? 'Saving...' : 'Save'}
                        </Button>
                      </form>

                      {pricingOverrides.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="py-2 px-2 font-medium text-muted-foreground">Plan ID</th>
                                <th className="py-2 px-2 font-medium text-muted-foreground">Plan</th>
                                <th className="py-2 px-2 font-medium text-muted-foreground">Custom Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pricingOverrides.map(override => {
                                const p = dataPlans.find(d => d.id === override.data_plan_id);
                                return (
                                  <tr key={override.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                    <td className="py-2 px-2 text-muted-foreground">#{override.data_plan_id}</td>
                                    <td className="py-2 px-2 font-medium">{p ? `${p.network} - ${p.plan_name}` : 'Unknown Plan'}</td>
                                    <td className="py-2 px-2 text-emerald-600 font-semibold">₦{formatMoney(override.custom_price)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground py-2">No custom pricing overrides set for this user.</div>
                      )}
                    </div>
                  </div>

                  {selectedDetails?.recent_transactions?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Recent Transactions (Max 20)</h4>
                      <div className="space-y-2 rounded-xl border bg-secondary/20 p-3">
                        {selectedDetails.recent_transactions.map((tx) => (
                          <div key={`${tx.reference}-${tx.id}`} className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0 pt-2 first:pt-0">
                            <div className="text-sm">
                              <div className="font-medium text-foreground">{tx.reference}</div>
                              <div className="text-xs text-muted-foreground capitalize">{tx.tx_type} • {tx.network || 'Wallet'}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(tx.created_at)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-foreground">₦{formatMoney(tx.amount || 0)}</div>
                              <div className="mt-1"><StatusBadge status={tx.status} /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDetails?.referred_users?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Referred Users ({(selectedDetails?.referred_users || []).length})</h4>
                      <div className="space-y-2 rounded-xl border bg-secondary/20 p-3">
                        {selectedDetails.referred_users.map((ref) => (
                          <div key={ref.id} className="flex items-center justify-between gap-3 border-b border-border/70 pb-3 last:border-0 last:pb-0 pt-2 first:pt-0">
                            <div className="text-sm">
                              <div className="font-medium text-foreground">{ref.referred_name || 'No Name'}</div>
                              <div className="text-xs text-muted-foreground">{ref.referred_email}</div>
                              {ref.referred_phone && <div className="text-xs text-muted-foreground">{ref.referred_phone}</div>}
                              <div className="text-[10px] text-muted-foreground mt-0.5">Joined {formatDateTime(ref.created_at)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-foreground">₦{formatMoney(ref.reward_amount || 0)}</div>
                              <div className="mt-1">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                  ref.status === 'rewarded' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  ref.status === 'qualified' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                  {ref.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={`${
          confirmAction?.type === 'suspend' ? 'Suspend' : 
          confirmAction?.type === 'delete' ? 'Permanently Delete' : 
          confirmAction?.type === 'approve_developer' ? 'Approve Developer API' :
          confirmAction?.type === 'suspend_developer' ? 'Suspend Developer API' :
          confirmAction?.type === 'upgrade_developer' ? 'Upgrade to Developer' :
          'Activate'
        } user account`}
        description={
          confirmAction?.type === 'delete'
            ? `Are you absolutely sure you want to delete ${confirmAction?.user?.email}? This will suffix their credentials and they will no longer be able to log in. This action is irreversible.`
            : confirmAction?.type === 'approve_developer'
            ? `You are about to approve developer API key access for ${confirmAction?.user?.email}. They will receive reseller privileges.`
            : confirmAction?.type === 'suspend_developer'
            ? `You are about to suspend developer API access for ${confirmAction?.user?.email}. This will immediately revoke their active integration keys.`
            : confirmAction?.type === 'upgrade_developer'
            ? `You are about to upgrade ${confirmAction?.user?.email} to a Developer. This will generate API keys and change their role.`
            : `You are about to ${confirmAction?.type || 'update'} ${confirmAction?.user?.email || 'this account'}. This action is logged for audit.`
        }
        confirmLabel={
          confirmAction?.type === 'suspend'
            ? 'Suspend user'
            : confirmAction?.type === 'delete'
            ? 'Yes, delete user'
            : confirmAction?.type === 'approve_developer'
            ? 'Approve API'
            : confirmAction?.type === 'suspend_developer'
            ? 'Suspend API'
            : confirmAction?.type === 'upgrade_developer'
            ? 'Upgrade to Developer'
            : 'Activate user'
        }
        variant={confirmAction?.type === 'delete' || confirmAction?.type === 'suspend_developer' ? 'destructive' : 'default'}
        busy={busy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runAction}
      />
    </div>
  );
}
