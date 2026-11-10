'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Code2,
  Terminal,
  Key,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Eye,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Webhook,
  HardDrive,
  Wallet,
  TrendingUp,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import {
  adminGetDevelopers,
  adminApproveDeveloper,
  adminSuspendDeveloper,
  adminResetDeveloperKeys,
  adminUpdateDeveloperWebhook,
  adminRegisterDeveloper,
  apiFetch,
} from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { getActiveBrand } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminMetricCard } from '@/components/admin/admin-metric-card';
import { AdminTable } from '@/components/admin/admin-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

function AdminDevelopersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const brandFilter = searchParams.get('brand') || 'all';

  // Component state
  const [developers, setDevelopers] = useState([]);
  const [summary, setSummary] = useState({
    total_developers: 0,
    active_developers: 0,
    suspended_developers: 0,
    applied_developers: 0,
    total_api_volume_spent: 0,
    total_api_data_gb: 0,
    total_api_requests_count: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(search);
  const [busy, setBusy] = useState(false);

  // Selected developer drawer
  const [selectedDev, setSelectedDev] = useState(null);
  const [webhookInput, setWebhookInput] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookMsg, setWebhookMsg] = useState('');

  // Confirmation dialogs
  const [confirmAction, setConfirmAction] = useState(null);

  // Newly generated keys modal
  const [keyModalData, setKeyModalData] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  // Register developer modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [registeringUser, setRegisteringUser] = useState(false);
  const [registerMsg, setRegisterMsg] = useState('');

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

  const updateURL = useCallback(
    (updates) => {
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
    },
    [searchParams, pathname, router]
  );

  const loadDevelopers = useCallback(async () => {
    const requestId = Date.now();
    activeRequestRef.current = requestId;
    setLoading(true);
    try {
      const response = await adminGetDevelopers({
        q: search || undefined,
        status: status !== 'all' ? status : undefined,
        brand: brandFilter !== 'all' ? brandFilter : undefined,
        page,
        page_size: 50,
      });
      if (activeRequestRef.current !== requestId) return;
      setDevelopers(Array.isArray(response?.items) ? response.items : []);
      setTotal(response?.total || 0);
      if (response?.summary) {
        setSummary(response.summary);
      }
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [search, status, brandFilter, page]);

  useEffect(() => {
    loadDevelopers().catch(() => setLoading(false));
  }, [loadDevelopers]);

  // Copy helper with feedback
  const handleCopy = (text, keyId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Open drawer
  const openDrawer = (dev) => {
    setSelectedDev(dev);
    setWebhookInput(dev.webhook_url || '');
    setWebhookMsg('');
  };

  // Webhook save
  const handleSaveWebhook = async () => {
    if (!selectedDev) return;
    setSavingWebhook(true);
    setWebhookMsg('');
    try {
      await adminUpdateDeveloperWebhook(selectedDev.id, { webhook_url: webhookInput });
      setSelectedDev({ ...selectedDev, webhook_url: webhookInput });
      setDevelopers((prev) =>
        prev.map((d) => (d.id === selectedDev.id ? { ...d, webhook_url: webhookInput } : d))
      );
      setWebhookMsg('Webhook URL saved successfully!');
      setTimeout(() => setWebhookMsg(''), 3000);
    } catch (err) {
      alert(err?.message || 'Failed to update webhook URL');
    } finally {
      setSavingWebhook(false);
    }
  };

  // Actions execution
  const runAction = async () => {
    if (!confirmAction) return;
    setBusy(true);
    try {
      if (confirmAction.type === 'approve') {
        const res = await adminApproveDeveloper(confirmAction.dev.id);
        if (res?.api_secret_key) {
          setKeyModalData({
            user_id: confirmAction.dev.id,
            email: confirmAction.dev.email,
            full_name: confirmAction.dev.full_name,
            api_public_key: res.api_public_key,
            api_secret_key: res.api_secret_key,
          });
        }
        await loadDevelopers();
        if (selectedDev?.id === confirmAction.dev.id) {
          setSelectedDev({ ...selectedDev, is_developer: true, developer_status: 'approved' });
        }
      } else if (confirmAction.type === 'suspend') {
        await adminSuspendDeveloper(confirmAction.dev.id);
        await loadDevelopers();
        if (selectedDev?.id === confirmAction.dev.id) {
          setSelectedDev({ ...selectedDev, is_developer: false, developer_status: 'suspended' });
        }
      } else if (confirmAction.type === 'reset_keys') {
        const res = await adminResetDeveloperKeys(confirmAction.dev.id);
        setKeyModalData({
          user_id: confirmAction.dev.id,
          email: confirmAction.dev.email,
          full_name: confirmAction.dev.full_name,
          api_public_key: res.api_public_key,
          api_secret_key: res.api_secret_key,
        });
        await loadDevelopers();
        if (selectedDev?.id === confirmAction.dev.id) {
          setSelectedDev({
            ...selectedDev,
            api_public_key: res.api_public_key,
            has_keys: true,
          });
        }
      }
      setConfirmAction(null);
    } catch (err) {
      alert(err?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  // User search for registering API reseller
  const searchCandidates = async () => {
    if (!userSearchTerm.trim()) return;
    setSearchingUsers(true);
    setRegisterMsg('');
    try {
      const res = await apiFetch(`/admin/users?q=${encodeURIComponent(userSearchTerm)}&page_size=10`);
      setCandidateUsers(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      setRegisterMsg(err?.message || 'Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  };

  const registerUserAsDeveloper = async (user) => {
    setRegisteringUser(true);
    try {
      const res = await adminRegisterDeveloper({ user_id: user.id });
      setRegisterModalOpen(false);
      setCandidateUsers([]);
      setUserSearchTerm('');
      setKeyModalData({
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        api_public_key: res.api_public_key,
        api_secret_key: res.api_secret_key,
      });
      await loadDevelopers();
    } catch (err) {
      alert(err?.message || 'Failed to register developer');
    } finally {
      setRegisteringUser(false);
    }
  };

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        header: 'API Reseller',
        render: (row) => (
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary font-bold text-sm">
              {row.full_name ? row.full_name.charAt(0).toUpperCase() : row.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground truncate max-w-[180px]">{row.full_name || 'No Name'}</span>
                <span className="rounded-md border border-border/60 bg-secondary/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {row.brand || 'meledata'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">{row.email}</div>
              {row.phone_number && <div className="text-[11px] text-muted-foreground font-mono">{row.phone_number}</div>}
            </div>
          </div>
        ),
      },
      {
        header: 'API Public Key',
        render: (row) => (
          <div className="space-y-1">
            {row.api_public_key ? (
              <div className="flex items-center gap-1.5">
                <code className="text-[11px] font-mono text-foreground/90 bg-secondary/80 px-2 py-1 rounded-lg border border-border/50 max-w-[160px] truncate">
                  {row.api_public_key}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(row.api_public_key, `pub_${row.id}`)}
                  className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy API Public Key"
                >
                  {copiedKey === `pub_${row.id}` ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">No key issued</span>
            )}
            {row.webhook_url && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono truncate max-w-[170px]" title={row.webhook_url}>
                <Webhook className="h-3 w-3 shrink-0" />
                <span className="truncate">{row.webhook_url}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        header: 'Wallet Balance',
        render: (row) => (
          <div>
            <div className={`font-mono font-bold text-sm ${row.wallet_balance > 1000 ? 'text-emerald-400' : 'text-foreground'}`}>
              ₦{formatMoney(row.wallet_balance || 0)}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Live Wallet</div>
          </div>
        ),
      },
      {
        header: 'Data Sold (API)',
        render: (row) => (
          <div>
            <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <span>{row.total_api_data_gb} GB</span>
              <span className="text-[11px] text-muted-foreground font-normal">vended</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              ₦{formatMoney(row.total_api_spent || 0)} spent
            </div>
          </div>
        ),
      },
      {
        header: 'API Orders',
        render: (row) => (
          <div>
            <div className="font-semibold text-sm text-foreground">
              {row.successful_api_orders}{' '}
              <span className="text-xs text-muted-foreground font-normal">/ {row.total_api_orders} orders</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {row.total_api_orders > 0
                ? `${Math.round((row.successful_api_orders / row.total_api_orders) * 100)}% delivery`
                : 'No transactions yet'}
            </div>
          </div>
        ),
      },
      {
        header: 'Status',
        render: (row) => {
          const isApproved = row.developer_status === 'approved' || (row.is_developer && row.developer_status !== 'suspended');
          const isSuspended = row.developer_status === 'suspended';
          const isApplied = row.developer_status === 'applied';

          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                isApproved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isSuspended
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : isApplied
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-secondary/60 border-border text-muted-foreground'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isApproved ? 'bg-emerald-400' : isSuspended ? 'bg-rose-400' : isApplied ? 'bg-amber-400' : 'bg-muted-foreground'
                }`}
              />
              {row.developer_status || (row.is_developer ? 'approved' : 'none')}
            </span>
          );
        },
      },
      {
        header: 'Actions',
        align: 'right',
        render: (row) => {
          const isApproved = row.developer_status === 'approved' || row.is_developer;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDrawer(row)}
                className="h-8 px-2.5 text-xs rounded-xl border-border/70 hover:bg-secondary"
                title="View reseller details & credentials"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Manage
              </Button>

              {isApproved ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAction({ type: 'suspend', dev: row })}
                  className="h-8 px-2 text-xs rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                  title="Suspend API Access"
                >
                  <PauseCircle className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAction({ type: 'approve', dev: row })}
                  className="h-8 px-2 text-xs rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  title="Approve API Access"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction({ type: 'reset_keys', dev: row })}
                className="h-8 px-2 text-xs rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                title="Regenerate API Keys"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [copiedKey]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <AdminPageHeader
        title="API Resellers & Developers"
        description="Monitor, manage, and provision external clients and developer portals vending data bundles and utilities via your API."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDevelopers}
              disabled={loading}
              className="h-10 rounded-xl px-3 border-border/70 hover:bg-secondary font-bold text-xs"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setRegisterModalOpen(true);
                setUserSearchTerm('');
                setCandidateUsers([]);
              }}
              className="h-10 rounded-xl px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Register API Reseller
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Total API Resellers"
          value={String(summary.total_developers)}
          detail={`${summary.active_developers} approved & active`}
          icon={Code2}
          tone="brand"
        />
        <AdminMetricCard
          label="API Data Vended"
          value={`${summary.total_api_data_gb} GB`}
          detail="Cumulative volume through API"
          icon={HardDrive}
          tone="success"
        />
        <AdminMetricCard
          label="API Sales Volume"
          value={`₦${formatMoney(summary.total_api_volume_spent)}`}
          detail={`${summary.total_api_requests_count} API requests logged`}
          icon={Wallet}
          tone="brand"
        />
        <AdminMetricCard
          label="Access Status"
          value={`${summary.suspended_developers} Suspended`}
          detail={`${summary.applied_developers} pending approvals`}
          icon={ShieldAlert}
          tone={summary.applied_developers > 0 ? 'warning' : 'brand'}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search reseller by name, email, phone, or public key..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-background/50 border-border font-medium text-xs"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl border border-border/60 bg-secondary/30 p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'approved', label: 'Approved' },
              { key: 'suspended', label: 'Suspended' },
              { key: 'applied', label: 'Applied' },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => updateURL({ status: st.key, page: 1 })}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  status === st.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Brand Filter */}
          <div className="flex items-center rounded-xl border border-border/60 bg-secondary/30 p-1">
            {[
              { key: 'all', label: 'All Brands' },
              { key: 'meledata', label: 'Mele' },
              { key: 'kullomadata', label: 'Kulloma' },
              { key: 'mzdata', label: 'MZ' },
            ].map((br) => (
              <button
                key={br.key}
                onClick={() => updateURL({ brand: br.key, page: 1 })}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  brandFilter === br.key
                    ? 'bg-secondary text-foreground shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {br.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resellers Table */}
      <Card className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <AdminTable
            columns={columns}
            data={developers}
            loading={loading}
            emptyMessage="No API resellers found matching your criteria. Click 'Register API Reseller' to issue API credentials to a user."
          />
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {total > 50 && (
        <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
          <div>
            Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total} resellers
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateURL({ page: page - 1 })}
              className="h-8 rounded-xl px-3 text-xs"
            >
              Previous
            </Button>
            <span className="font-bold text-foreground">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page * 50 >= total}
              onClick={() => updateURL({ page: page + 1 })}
              className="h-8 rounded-xl px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Details Slide-over Drawer */}
      {selectedDev && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-card border-l border-border h-full overflow-y-auto p-6 shadow-2xl space-y-6">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedDev.full_name || 'API Reseller'}</h3>
                  <p className="text-xs text-muted-foreground">{selectedDev.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDev(null)}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Wallet Balance</div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-foreground">
                  ₦{formatMoney(selectedDev.wallet_balance || 0)}
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Data Delivered</div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-400">
                  {selectedDev.total_api_data_gb} GB
                </div>
              </div>
            </div>

            {/* API Credentials */}
            <div className="rounded-2xl border border-border/60 bg-background/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">API Credentials</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAction({ type: 'reset_keys', dev: selectedDev })}
                  className="h-8 px-2.5 text-xs rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-bold"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Regenerate Keys
                </Button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Public Key</label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={selectedDev.api_public_key || 'No public key generated'}
                    className="font-mono text-xs h-10 bg-secondary/40 border-border"
                  />
                  {selectedDev.api_public_key && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(selectedDev.api_public_key, 'drawer_pub')}
                      className="h-10 px-3 rounded-xl border-border shrink-0"
                    >
                      {copiedKey === 'drawer_pub' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 leading-relaxed">
                Secret keys are hashed using SHA-256 for maximum security. If the reseller loses their secret key, use &quot;Regenerate Keys&quot; to issue a new pair.
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="rounded-2xl border border-border/60 bg-background/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-sm text-foreground">Delivery Webhook URL</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Platform sends instant HTTP POST callbacks with transaction reference, status, and payload whenever data orders complete.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://client-domain.com/api/vtu-webhook"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  className="h-10 text-xs font-mono bg-background border-border"
                />
                <Button
                  size="sm"
                  onClick={handleSaveWebhook}
                  disabled={savingWebhook}
                  className="h-10 px-4 rounded-xl font-bold text-xs bg-primary text-primary-foreground shrink-0"
                >
                  {savingWebhook ? 'Saving...' : 'Save'}
                </Button>
              </div>
              {webhookMsg && (
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {webhookMsg}
                </div>
              )}
            </div>

            {/* Reseller Info Details */}
            <div className="rounded-2xl border border-border/60 bg-background/50 p-5 space-y-3">
              <h4 className="font-bold text-sm text-foreground">Reseller Account Details</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono font-bold text-foreground">#{selectedDev.id}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Brand Tenant</span>
                  <span className="font-bold uppercase text-primary">{selectedDev.brand || 'meledata'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Total API Orders</span>
                  <span className="font-bold text-foreground">{selectedDev.total_api_orders}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Successful Vends</span>
                  <span className="font-bold text-emerald-400">{selectedDev.successful_api_orders}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Total Spent (₦)</span>
                  <span className="font-bold font-mono text-foreground">₦{formatMoney(selectedDev.total_api_spent || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Last API Activity</span>
                  <span className="text-muted-foreground">{formatDateTime(selectedDev.last_api_activity) || 'Never'}</span>
                </div>
              </div>
            </div>

            {/* Access Controls */}
            <div className="pt-2 flex items-center justify-between gap-3">
              {selectedDev.developer_status === 'approved' || selectedDev.is_developer ? (
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction({ type: 'suspend', dev: selectedDev })}
                  className="w-full h-11 rounded-xl border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold text-xs"
                >
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Suspend API Access
                </Button>
              ) : (
                <Button
                  onClick={() => setConfirmAction({ type: 'approve', dev: selectedDev })}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Approve API Access
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register API Reseller Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Register New API Reseller</h3>
                  <p className="text-xs text-muted-foreground">Upgrade an existing platform user to an API developer</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRegisterModalOpen(false)}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Existing Users */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Search User by Email or Phone</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="e.g. client@gmail.com or 080..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchCandidates()}
                  className="h-10 text-xs bg-background border-border"
                />
                <Button
                  onClick={searchCandidates}
                  disabled={searchingUsers || !userSearchTerm.trim()}
                  className="h-10 px-4 rounded-xl font-bold text-xs bg-primary text-primary-foreground"
                >
                  {searchingUsers ? 'Searching...' : 'Find User'}
                </Button>
              </div>
            </div>

            {/* Candidates Results */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {candidateUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-foreground truncate">{user.full_name || 'No Name'}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{user.phone_number || ''}</div>
                  </div>
                  <Button
                    size="sm"
                    disabled={registeringUser}
                    onClick={() => registerUserAsDeveloper(user)}
                    className="h-8 px-3 rounded-xl text-xs font-bold bg-primary text-primary-foreground shrink-0 shadow-sm"
                  >
                    {registeringUser ? 'Provisioning...' : 'Activate API'}
                  </Button>
                </div>
              ))}
              {candidateUsers.length === 0 && userSearchTerm && !searchingUsers && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No users found. Ensure the user has registered an account on the platform first.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New API Credentials Modal */}
      {keyModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">API Keys Provisioned</h3>
                  <p className="text-xs text-muted-foreground">{keyModalData.full_name || keyModalData.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setKeyModalData(null)}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200 leading-relaxed">
                <strong className="block font-bold mb-0.5 text-amber-300">Important: Copy Secret Key Now!</strong>
                For security reasons, the Secret Key will <strong>never</strong> be displayed again in plaintext. Copy it and share it with the reseller now.
              </div>
            </div>

            {/* Public Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground block">Public Key (Client Identifier)</label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={keyModalData.api_public_key || ''}
                  className="font-mono text-xs h-10 bg-secondary/40 border-border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(keyModalData.api_public_key, 'modal_pub')}
                  className="h-10 px-3 rounded-xl border-border shrink-0"
                >
                  {copiedKey === 'modal_pub' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Secret Key */}
            {keyModalData.api_secret_key && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-400 block">Secret Key (Live Authorization Token)</label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={keyModalData.api_secret_key}
                    className="font-mono text-xs h-10 bg-secondary/40 border-emerald-500/40 text-emerald-300 font-bold"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(keyModalData.api_secret_key, 'modal_sec')}
                    className="h-10 px-3 rounded-xl border-emerald-500/40 text-emerald-400 shrink-0 hover:bg-emerald-500/10 font-bold"
                  >
                    {copiedKey === 'modal_sec' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={() => setKeyModalData(null)}
                className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={`${
          confirmAction?.type === 'suspend'
            ? 'Suspend API Reseller'
            : confirmAction?.type === 'reset_keys'
            ? 'Regenerate API Keys'
            : 'Approve API Access'
        }`}
        description={
          confirmAction?.type === 'suspend'
            ? `Are you sure you want to suspend API access for ${confirmAction?.dev?.email}? Their active API credentials will be revoked immediately and pending requests will be rejected.`
            : confirmAction?.type === 'reset_keys'
            ? `Are you sure you want to regenerate API keys for ${confirmAction?.dev?.email}? The old secret key will be invalidated immediately.`
            : `Grant approved API reseller access to ${confirmAction?.dev?.email}. They will be able to vend data via the automated API.`
        }
        confirmLabel={
          confirmAction?.type === 'suspend'
            ? 'Suspend API Access'
            : confirmAction?.type === 'reset_keys'
            ? 'Yes, Regenerate'
            : 'Approve Reseller'
        }
        variant={confirmAction?.type === 'suspend' ? 'destructive' : 'default'}
        busy={busy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runAction}
      />
    </div>
  );
}

export default function AdminDevelopersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading API Resellers...</div>}>
      <AdminDevelopersPageContent />
    </Suspense>
  );
}
