'use client';

import { useCallback, useEffect, useState } from 'react';
import { Blocks, Key, Globe, Plus, Trash2, Edit2, Link as LinkIcon, RefreshCw, Eye, EyeOff, Bell } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { AdminTable } from '@/components/admin/admin-table';

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [gateways, setGateways] = useState([]);
  
  // Modal state
  const [editingProvider, setEditingProvider] = useState(null);
  const [editingGateway, setEditingGateway] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [togglingDashboardId, setTogglingDashboardId] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [providersRes, gatewaysRes] = await Promise.allSettled([
        apiFetch('/admin/integrations/providers'),
        apiFetch('/admin/integrations/gateways'),
      ]);
      if (providersRes.status === 'fulfilled') setProviders(providersRes.value || []);
      if (gatewaysRes.status === 'fulfilled') setGateways(gatewaysRes.value || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const hasExplicitDashboardChoice = providers.some(
    (p) => p?.additional_config && typeof p.additional_config === 'object' && 'show_balance_on_dashboard' in p.additional_config
  );

  const isShownOnDashboard = (prov) => {
    const cfg = prov?.additional_config || {};
    if ('show_balance_on_dashboard' in cfg) {
      return Boolean(cfg.show_balance_on_dashboard);
    }
    return hasExplicitDashboardChoice ? false : Boolean(prov?.is_active);
  };

  const getLowBalanceThreshold = (prov) => {
    const val = prov?.additional_config?.low_balance_threshold;
    const num = Number(val);
    return !isNaN(num) && val !== undefined && val !== null && val !== '' ? num : 5000;
  };

  const handleToggleDashboardDisplay = async (prov) => {
    setTogglingDashboardId(prov.id);
    try {
      const nextShow = !isShownOnDashboard(prov);
      const currentCfg = prov?.additional_config && typeof prov.additional_config === 'object' ? prov.additional_config : {};
      const updatedCfg = {
        ...currentCfg,
        show_balance_on_dashboard: nextShow,
        low_balance_threshold: getLowBalanceThreshold(prov),
      };
      const payload = {
        name: prov.name,
        identifier: prov.identifier,
        base_url: prov.base_url,
        api_key: prov.api_key,
        api_secret: prov.api_secret,
        is_active: prov.is_active,
        supported_services: prov.supported_services || [],
        additional_config: updatedCfg,
      };
      await apiFetch(`/admin/integrations/providers/${prov.id}`, {
        method: 'PUT',
        body: payload,
      });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to update dashboard display setting');
    } finally {
      setTogglingDashboardId(null);
    }
  };

  const handleTestProvider = async (provider) => {
    setTestingId(provider.id || 'current');
    setTestResult(null);
    try {
      const res = await apiFetch('/admin/integrations/providers/test', {
        method: 'POST',
        body: {
          provider_id: provider.id,
          identifier: provider.identifier,
          base_url: provider.base_url,
          api_key: provider.api_key,
          api_secret: provider.api_secret
        }
      });
      setTestResult(res);
      if (res.status && typeof res.balance === 'number' && provider.id) {
        setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, balance: res.balance } : p));
      }
    } catch (err) {
      setTestResult({
        status: false,
        message: err.message || 'Connection test failed'
      });
    } finally {
      setTestingId(null);
    }
  };

  const openEditProviderModal = (prov) => {
    const cfg = prov?.additional_config && typeof prov.additional_config === 'object' ? prov.additional_config : {};
    setEditingProvider({
      ...prov,
      show_balance_on_dashboard: isShownOnDashboard(prov),
      low_balance_threshold: getLowBalanceThreshold(prov),
      additional_config: cfg,
    });
    setTestResult(null);
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const isNew = editingProvider.isNew;
      const existingCfg = editingProvider.additional_config && typeof editingProvider.additional_config === 'object'
        ? editingProvider.additional_config
        : {};
      const thresholdNum = Number(editingProvider.low_balance_threshold);
      const payload = {
        name: editingProvider.name,
        identifier: editingProvider.identifier,
        base_url: editingProvider.base_url,
        api_key: editingProvider.api_key,
        api_secret: editingProvider.api_secret,
        is_active: Boolean(editingProvider.is_active),
        supported_services: editingProvider.supported_services || [],
        additional_config: {
          ...existingCfg,
          show_balance_on_dashboard: Boolean(editingProvider.show_balance_on_dashboard),
          low_balance_threshold: !isNaN(thresholdNum) && thresholdNum >= 0 ? thresholdNum : 5000,
        },
      };
      
      await apiFetch(isNew ? '/admin/integrations/providers' : `/admin/integrations/providers/${editingProvider.id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: payload
      });
      await load();
      setEditingProvider(null);
      setTestResult(null);
    } catch (err) {
      alert(err.message || 'Failed to save provider');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProvider = async (id) => {
    if (!window.confirm('Are you sure you want to delete this provider?')) return;
    try {
      await apiFetch(`/admin/integrations/providers/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to delete provider');
    }
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const isNew = editingGateway.isNew;
      const payload = { ...editingGateway };
      delete payload.isNew;
      delete payload.id;
      
      await apiFetch(isNew ? '/admin/integrations/gateways' : `/admin/integrations/gateways/${editingGateway.id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: payload
      });
      await load();
      setEditingGateway(null);
    } catch (err) {
      alert(err.message || 'Failed to save gateway');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGateway = async (id) => {
    if (!window.confirm('Are you sure you want to delete this gateway?')) return;
    try {
      await apiFetch(`/admin/integrations/gateways/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to delete gateway');
    }
  };

  return (
    <div className="space-y-5 pb-8 relative">
      <AdminPageHeader
        title="API Integrations"
        description="Manage connected third-party providers for VTU, data, and payment processing."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Service Providers
            </CardTitle>
            <CardDescription>Configure VTU, data, and cable API providers, dashboard balance visibility, and low-balance alerts.</CardDescription>
          </div>
          <Button 
            size="sm"
            onClick={() => {
              setEditingProvider({
                isNew: true,
                name: '',
                identifier: '',
                base_url: '',
                api_key: '',
                is_active: false,
                show_balance_on_dashboard: true,
                low_balance_threshold: 5000,
                additional_config: {},
              });
              setTestResult(null);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Provider
          </Button>
        </CardHeader>
        <CardContent>
          {testResult && !editingProvider && (
            <div className={`mb-4 p-3 rounded-lg border text-xs space-y-1 ${testResult.status ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}>
              <div className="font-semibold flex items-center justify-between">
                <span>{testResult.status ? '✓ Connection Verified' : '✕ Connection Error'}</span>
                {testResult.balance !== undefined && testResult.balance !== null && (
                  <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-300">
                    Balance: ₦{Number(testResult.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              <p>{testResult.message}</p>
              {testResult.raw_response && (
                <details className="pt-1">
                  <summary className="cursor-pointer text-muted-foreground hover:underline">View Live API Reply</summary>
                  <pre className="mt-1 p-2 bg-background/80 rounded border font-mono text-[10px] overflow-auto max-h-32 text-foreground">
                    {JSON.stringify(testResult.raw_response, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
          <AdminTable
            columns={[
              { key: 'name', label: 'Provider Name', render: (r) => <div className="font-medium">{r.name}</div> },
              { key: 'identifier', label: 'Identifier', render: (r) => <span className="text-muted-foreground font-mono text-xs">{r.identifier}</span> },
              { key: 'base_url', label: 'API URL', render: (r) => r.base_url || '—' },
              { 
                key: 'balance', 
                label: 'Balance', 
                render: (r) => typeof r.balance === 'number' && r.balance > 0 
                  ? <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">₦{r.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  : <span className="text-muted-foreground">—</span>
              },
              {
                key: 'dashboard_widget',
                label: 'Admin Dashboard & Alert',
                render: (r) => {
                  const shown = isShownOnDashboard(r);
                  const threshold = getLowBalanceThreshold(r);
                  const busy = togglingDashboardId === r.id;
                  return (
                    <div className="flex flex-col items-start gap-1">
                      <Button
                        type="button"
                        variant={shown ? 'default' : 'outline'}
                        size="sm"
                        disabled={busy}
                        onClick={() => handleToggleDashboardDisplay(r)}
                        className={`h-7 px-2.5 text-xs gap-1.5 ${shown ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-muted-foreground'}`}
                      >
                        {shown ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {busy ? 'Updating...' : shown ? 'Shown on Admin' : 'Hidden'}
                      </Button>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Bell className="h-3 w-3 text-amber-500" />
                        Alert &lt; ₦{Number(threshold).toLocaleString('en-NG')}
                      </span>
                    </div>
                  );
                },
              },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
              { key: 'actions', label: 'Actions', render: (r) => (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1 text-xs" 
                    onClick={() => handleTestProvider(r)} 
                    disabled={testingId === r.id}
                  >
                    <RefreshCw className={testingId === r.id ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                    Test
                  </Button>
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => openEditProviderModal(r)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteProvider(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            ]}
            rows={providers}
            empty={loading ? 'Loading providers...' : 'No providers added yet.'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Payment Gateways
            </CardTitle>
            <CardDescription>Configure keys and webhook URLs for Monnify, Paystack, Asfiy, etc.</CardDescription>
          </div>
          <Button 
            size="sm"
            onClick={() => setEditingGateway({
              isNew: true,
              name: '',
              identifier: '',
              public_key: '',
              secret_key: '',
              webhook_url: '',
              is_active: false
            })}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Gateway
          </Button>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={[
              { key: 'name', label: 'Gateway Name', render: (r) => <div className="font-medium">{r.name}</div> },
              { key: 'identifier', label: 'Identifier', render: (r) => <span className="text-muted-foreground">{r.identifier}</span> },
              { key: 'webhook', label: 'Webhook URL', render: (r) => (
                <div className="flex items-center gap-1 max-w-[200px] truncate" title={r.webhook_url}>
                  <LinkIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{r.webhook_url || 'Not set'}</span>
                </div>
              ) },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
              { key: 'actions', label: 'Actions', render: (r) => (
                <div className="flex gap-2">
                  <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setEditingGateway(r)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteGateway(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            ]}
            rows={gateways}
            empty={loading ? 'Loading gateways...' : 'No payment gateways added yet.'}
          />
        </CardContent>
      </Card>

      {/* Provider Modal */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle>{editingProvider.isNew ? 'Add Provider' : 'Edit Provider'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProvider} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Provider Name</label>
                    <Input required placeholder="e.g. SMEPlug" value={editingProvider.name} onChange={e => setEditingProvider({...editingProvider, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Identifier</label>
                    <Input required placeholder="e.g. smeplug" value={editingProvider.identifier} onChange={e => setEditingProvider({...editingProvider, identifier: e.target.value})} disabled={!editingProvider.isNew} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Base URL</label>
                  <Input placeholder="https://api.example.com" value={editingProvider.base_url || ''} onChange={e => setEditingProvider({...editingProvider, base_url: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Input type="password" placeholder="Key" value={editingProvider.api_key || ''} onChange={e => setEditingProvider({...editingProvider, api_key: e.target.value})} />
                </div>

                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3.5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="prov-active" className="text-sm font-medium cursor-pointer">Enable Provider for Transactions</label>
                    <input
                      type="checkbox"
                      id="prov-active"
                      className="h-4 w-4 accent-primary"
                      checked={Boolean(editingProvider.is_active)}
                      onChange={e => setEditingProvider({...editingProvider, is_active: e.target.checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">
                    <div>
                      <label htmlFor="prov-show-dashboard" className="text-sm font-medium cursor-pointer block">Show Balance on Admin Page</label>
                      <span className="text-[11px] text-muted-foreground">Display live wallet balance in the Admin Command Center widget</span>
                    </div>
                    <input
                      type="checkbox"
                      id="prov-show-dashboard"
                      className="h-4 w-4 accent-primary"
                      checked={Boolean(editingProvider.show_balance_on_dashboard)}
                      onChange={e => setEditingProvider({...editingProvider, show_balance_on_dashboard: e.target.checked})}
                    />
                  </div>
                  <div className="space-y-1.5 border-t border-border/40 pt-2.5">
                    <label htmlFor="prov-threshold" className="text-sm font-medium flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-amber-500" />
                      Low Balance Notification Threshold (₦)
                    </label>
                    <Input
                      id="prov-threshold"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="5000"
                      value={editingProvider.low_balance_threshold ?? 5000}
                      onChange={e => setEditingProvider({...editingProvider, low_balance_threshold: e.target.value})}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Send push &amp; email notification to admins when balance drops below this amount.
                    </p>
                  </div>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg border text-xs space-y-1 ${testResult.status ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}>
                    <div className="font-semibold flex items-center justify-between">
                      <span>{testResult.status ? '✓ Connection Verified' : '✕ Connection Error'}</span>
                      {testResult.balance !== undefined && testResult.balance !== null && (
                        <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-300">
                          Balance: ₦{Number(testResult.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    <p>{testResult.message}</p>
                    {testResult.raw_response && (
                      <details className="pt-1">
                        <summary className="cursor-pointer text-muted-foreground hover:underline">View Live API Reply</summary>
                        <pre className="mt-1 p-2 bg-background/80 rounded border font-mono text-[10px] overflow-auto max-h-28 text-foreground">
                          {JSON.stringify(testResult.raw_response, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={testingId === (editingProvider.id || 'current') || !editingProvider.identifier} 
                    onClick={() => handleTestProvider(editingProvider)}
                  >
                    {testingId === (editingProvider.id || 'current') ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Testing...
                      </>
                    ) : 'Test Connection'}
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => { setEditingProvider(null); setTestResult(null); }}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gateway Modal */}
      {editingGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle>{editingGateway.isNew ? 'Add Gateway' : 'Edit Gateway'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGateway} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gateway Name</label>
                    <Input required placeholder="e.g. Asfiy" value={editingGateway.name} onChange={e => setEditingGateway({...editingGateway, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Identifier</label>
                    <Input required placeholder="e.g. asfiy" value={editingGateway.identifier} onChange={e => setEditingGateway({...editingGateway, identifier: e.target.value})} disabled={!editingGateway.isNew} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Public Key</label>
                  <Input placeholder="Public Key" value={editingGateway.public_key || ''} onChange={e => setEditingGateway({...editingGateway, public_key: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secret Key</label>
                  <Input type="password" placeholder="Secret Key" value={editingGateway.secret_key || ''} onChange={e => setEditingGateway({...editingGateway, secret_key: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook URL</label>
                  <Input placeholder="https://..." value={editingGateway.webhook_url || ''} onChange={e => setEditingGateway({...editingGateway, webhook_url: e.target.value})} />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="gate-active" checked={editingGateway.is_active} onChange={e => setEditingGateway({...editingGateway, is_active: e.target.checked})} />
                  <label htmlFor="gate-active" className="text-sm font-medium">Enable Gateway</label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setEditingGateway(null)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
