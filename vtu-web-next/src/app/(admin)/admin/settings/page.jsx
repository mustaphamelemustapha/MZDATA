'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { adminGetAnalytics, adminGetPricingRules, adminGetServiceToggles, adminUpdatePricingRule, adminUpdateServiceToggle, apiFetch, getProfile } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { AdminTable } from '@/components/admin/admin-table';

export default function AdminSettingsPage() {
  const profile = getProfile();
  const [loading, setLoading] = useState(true);
  const [pricingRules, setPricingRules] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [serviceToggles, setServiceToggles] = useState({});
  const [toggling, setToggling] = useState(false);
  
  // Margin Edit State
  const [editingMarginFor, setEditingMarginFor] = useState(null);
  const [marginInput, setMarginInput] = useState('');
  const [marginTypeInput, setMarginTypeInput] = useState('fixed');
  const [isSavingMargin, setIsSavingMargin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pricingRes, catalogRes, analyticsRes, togglesRes] = await Promise.allSettled([
        adminGetPricingRules(),
        apiFetch('/services/catalog'),
        adminGetAnalytics(),
        adminGetServiceToggles(),
      ]);
      if (pricingRes.status === 'fulfilled') setPricingRules(Array.isArray(pricingRes.value?.items) ? pricingRes.value.items : []);
      if (catalogRes.status === 'fulfilled') setCatalog(catalogRes.value || {});
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value || {});
      if (togglesRes.status === 'fulfilled') setServiceToggles(togglesRes.value || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const handleOpenMarginModal = (rule) => {
    setEditingMarginFor(rule);
    setMarginInput(String(rule.margin || '0'));
    setMarginTypeInput(rule.margin_type || 'fixed');
  };

  const handleSaveMargin = async () => {
    if (!editingMarginFor) return;
    setIsSavingMargin(true);
    try {
      const val = parseFloat(marginInput);
      if (isNaN(val)) throw new Error('Invalid margin value');
      
      const payload = {
        network: editingMarginFor.network,
        role: editingMarginFor.role,
        margin: val,
        margin_type: marginTypeInput,
      };
      
      await adminUpdatePricingRule(payload);
      await load();
      setEditingMarginFor(null);
    } catch (err) {
      alert(err.message || 'Failed to update margin');
    } finally {
      setIsSavingMargin(false);
    }
  };

  return (
    <div className="space-y-5 pb-8 relative">
      <AdminPageHeader
        title="Admin settings"
        description="Service toggles, provider health, referral policy, support channels, and admin profile security."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh settings
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Service toggles</CardTitle>
            <CardDescription>Enable or disable core services on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ['data', 'Data'],
              ['airtime', 'Airtime'],
              ['electricity', 'Electricity'],
              ['cable', 'Cable TV'],
              ['exam', 'Exam PINs'],
            ].map(([serviceKey, label]) => {
              const enabled = serviceToggles[serviceKey] ?? true;
              return (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-border bg-secondary p-3">
                  <div className="text-sm font-medium text-foreground">{label}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={enabled ? 'enabled' : 'disabled'} />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      disabled={toggling}
                      onClick={async () => {
                        setToggling(true);
                        try {
                          await adminUpdateServiceToggle(serviceKey, { is_active: !enabled });
                          await load();
                        } catch (err) {
                          alert(err.message || 'Failed to update toggle');
                        } finally {
                          setToggling(false);
                        }
                      }}
                    >
                      {enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API/provider status</CardTitle>
            <CardDescription>Operational indicators from available backend analytics and catalog snapshots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-secondary p-3 text-sm">
              <div className="text-muted-foreground">API success count</div>
              <div className="mt-1 font-semibold text-foreground">{Number(analytics?.api_success || 0).toLocaleString('en-NG')}</div>
            </div>
            <div className="rounded-2xl border border-border bg-secondary p-3 text-sm">
              <div className="text-muted-foreground">API failed count</div>
              <div className="mt-1 font-semibold text-foreground">{Number(analytics?.api_failed || 0).toLocaleString('en-NG')}</div>
            </div>
            <div className="rounded-2xl border border-border bg-secondary p-3 text-sm">
              <div className="text-muted-foreground">Pricing rules loaded</div>
              <div className="mt-1 font-semibold text-foreground">{pricingRules.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Service Margins</CardTitle>
            <CardDescription>Configure profit margins for transactions. Margins can be fixed amounts or percentages.</CardDescription>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              setEditingMarginFor({ network: 'mtn', role: 'user', margin: 0, margin_type: 'fixed', isNewRule: true });
              setMarginInput('0');
              setMarginTypeInput('fixed');
            }}
          >
            + Add Margin Rule
          </Button>
        </CardHeader>
        <CardContent>
          <AdminTable
            columns={[
              { key: 'network', label: 'Service / Network', render: (row) => String(row.network).toUpperCase() },
              { key: 'role', label: 'User Role', render: (row) => <span className="capitalize">{row.role}</span> },
              { key: 'margin', label: 'Current Margin', render: (row) => {
                const type = row.margin_type || 'fixed';
                return type === 'percentage' ? `${row.margin}%` : `₦${formatMoney(row.margin)}`;
              }},
              { key: 'type', label: 'Margin Type', render: (row) => <span className="capitalize text-muted-foreground">{row.margin_type || 'fixed'}</span> },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) => (
                  <Button variant="secondary" size="sm" onClick={() => handleOpenMarginModal(row)}>
                    Edit
                  </Button>
                ),
              },
            ]}
            rows={pricingRules}
            empty={loading ? 'Loading margins...' : 'No margin rules defined yet.'}
          />
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Referral reward policy</CardTitle>
            <CardDescription>Current first-deposit referral reward rate used by MZDATA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="space-y-2 block">
              <span className="text-sm text-muted-foreground">Reward percentage</span>
              <Input value="2" readOnly />
            </label>
            <div className="text-xs text-muted-foreground">This value is shown for visibility. Persisted updates require backend settings endpoint.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support and maintenance</CardTitle>
            <CardDescription>Official support channels and maintenance guardrails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="space-y-2 block">
              <span className="text-sm text-muted-foreground">Support email</span>
              <Input value="mzdata@gmail.com" readOnly />
            </label>
            <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 p-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>Maintenance mode is currently a protected placeholder. Enable only when backend maintenance control exists.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin profile & security</CardTitle>
          <CardDescription>Access role, account identity, and security visibility for this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-secondary p-3">
            <div className="axis-label">Full name</div>
            <div className="mt-2 text-sm font-medium text-foreground">{profile?.full_name || 'Admin'}</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary p-3">
            <div className="axis-label">Email</div>
            <div className="mt-2 text-sm font-medium text-foreground break-all">{profile?.email || '—'}</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary p-3">
            <div className="axis-label">Role</div>
            <div className="mt-2 text-sm font-medium text-foreground">{String(profile?.role || 'user')}</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary p-3">
            <div className="axis-label">Last refresh</div>
            <div className="mt-2 text-sm font-medium text-foreground">{formatDateTime(new Date())}</div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Secrets are intentionally hidden from this UI. Use secured backend environment management for keys and provider credentials.
        </div>
      </div>

      {editingMarginFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <CardTitle className="text-lg">Edit Service Margin</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setEditingMarginFor(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {editingMarginFor.isNewRule ? (
                <div className="space-y-4 p-3 rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service / Network</label>
                    <select
                      value={editingMarginFor.network}
                      onChange={(e) => setEditingMarginFor({ ...editingMarginFor, network: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={isSavingMargin}
                    >
                      <option value="mtn">MTN</option>
                      <option value="airtel">Airtel</option>
                      <option value="glo">Glo</option>
                      <option value="9mobile">9mobile</option>
                      <option value="data">General Data</option>
                      <option value="airtime">General Airtime</option>
                      <option value="electricity">Electricity</option>
                      <option value="cable">Cable TV</option>
                      <option value="exam">Exam PINs</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Role</label>
                    <select
                      value={editingMarginFor.role}
                      onChange={(e) => setEditingMarginFor({ ...editingMarginFor, role: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={isSavingMargin}
                    >
                      <option value="user">Normal User</option>
                      <option value="reseller">Agent / Reseller</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service/Network:</span>
                    <span className="font-medium text-foreground">{String(editingMarginFor.network).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User Role:</span>
                    <span className="font-medium text-foreground capitalize">{editingMarginFor.role}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Margin Type</label>
                  <select
                    value={marginTypeInput}
                    onChange={(e) => setMarginTypeInput(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isSavingMargin}
                  >
                    <option value="fixed">Fixed Amount (₦)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Margin Value</label>
                  <Input
                    type="number"
                    value={marginInput}
                    onChange={(e) => setMarginInput(e.target.value)}
                    disabled={isSavingMargin}
                  />
                  <p className="text-xs text-muted-foreground">
                    {marginTypeInput === 'percentage' 
                      ? 'The percentage of the base price to add as profit.' 
                      : 'The flat amount in Naira to add on top of the provider cost.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setEditingMarginFor(null)} disabled={isSavingMargin}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMargin} disabled={isSavingMargin}>
                  {isSavingMargin ? 'Saving...' : 'Save Margin'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
