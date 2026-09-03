'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw, X, Plus } from 'lucide-react';
import { adminGetDataPlans, adminGetPricingRules, adminSyncDataPlans, adminUpdateDataPlan, adminDeleteDataPlan } from '@/lib/api';
import { filterAllowedAmigoPlans } from '@/lib/amigo-plan-policy';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminTable } from '@/components/admin/admin-table';
import { FilterBar } from '@/components/admin/filter-bar';
import { StatusBadge } from '@/components/admin/status-badge';
import { Input } from '@/components/ui/input';

const NETWORKS = ['', 'mtn', 'airtel', 'glo', '9mobile'];

function asList(value) {
  if (Array.isArray(value)) return filterAllowedAmigoPlans(value);
  if (value && typeof value === 'object') {
    const list = value.data ?? value.items ?? value.plans;
    return Array.isArray(list) ? filterAllowedAmigoPlans(list) : [];
  }
  return [];
}

export default function AdminDataPlansPage() {
  const [plans, setPlans] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [activeNetwork, setActiveNetwork] = useState('');
  const [query, setQuery] = useState('');

  // Modal State
  const [editingPlan, setEditingPlan] = useState(null);
  const [displayPriceInput, setDisplayPriceInput] = useState('');
  const [agentPriceInput, setAgentPriceInput] = useState('');
  const [planNameInput, setPlanNameInput] = useState('');
  const [costPriceInput, setCostPriceInput] = useState('');
  const [dataSizeInput, setDataSizeInput] = useState('');
  const [validityInput, setValidityInput] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [promoActiveInput, setPromoActiveInput] = useState(false);
  const [promoOldPriceInput, setPromoOldPriceInput] = useState('');
  const [promoLabelInput, setPromoLabelInput] = useState('');
  const [fallbackProviderInput, setFallbackProviderInput] = useState('');
  const [fallbackPlanIdInput, setFallbackPlanIdInput] = useState('');
  const [dataTypeInput, setDataTypeInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, pricingRes] = await Promise.allSettled([
        adminGetDataPlans(),
        adminGetPricingRules(),
      ]);
      if (plansRes.status === 'fulfilled') setPlans(asList(plansRes.value));
      if (pricingRes.status === 'fulfilled') setPricing(Array.isArray(pricingRes.value?.items) ? pricingRes.value.items : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return plans.filter((plan) => {
      const network = String(plan?.network || '').toLowerCase();
      if (activeNetwork && network !== activeNetwork) return false;
      if (!needle) return true;
      return [plan?.plan_name, plan?.plan_code, plan?.data_size, plan?.validity]
        .map((item) => String(item || '').toLowerCase())
        .some((text) => text.includes(needle));
    });
  }, [activeNetwork, plans, query]);

  const byNetwork = useMemo(
    () => plans.reduce((acc, item) => {
      const key = String(item?.network || 'other').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    [plans]
  );

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await adminSyncDataPlans();
      await load();
    } finally {
      setSyncing(false);
    }
  }, [load]);

  const [cleaning, setCleaning] = useState(false);
  const handleCleanLegacy = useCallback(async () => {
    if (!window.confirm("This will permanently delete all old 'unknown' or broken data plans from the database. Are you sure?")) return;
    setCleaning(true);
    try {
      const { adminCleanLegacyDataPlans } = await import('@/lib/api');
      const res = await adminCleanLegacyDataPlans();
      alert(res.message || "Legacy plans deleted successfully");
      await load();
    } catch (err) {
      alert(err.message || "Failed to clean legacy plans");
    } finally {
      setCleaning(false);
    }
  }, [load]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    network: 'mtn',
    plan_code: '',
    plan_name: '',
    data_size: '',
    validity: '30 Days',
    base_price: '',
    agent_price: '',
    user_price: '',
    provider: 'amigo',
    provider_plan_id: '',
    fallback_provider: 'none',
    fallback_provider_plan_id: '',
    data_type: '',
    is_active: true
  });

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newPlan };
      if (payload.fallback_provider === 'none' || payload.fallback_provider === '') {
        delete payload.fallback_provider;
        delete payload.fallback_provider_plan_id;
      }
      if (payload.data_type === '') {
        delete payload.data_type;
      }
      const { adminCreateDataPlan } = await import('@/lib/api');
      await adminCreateDataPlan(payload);
      setIsAddModalOpen(false);
      setNewPlan({
        network: 'mtn',
        plan_code: '',
        plan_name: '',
        data_size: '',
        validity: '30 Days',
        base_price: '',
        agent_price: '',
        user_price: '',
        provider: 'amigo',
        provider_plan_id: '',
        fallback_provider: 'none',
        fallback_provider_plan_id: '',
        data_type: '',
        is_active: true
      });
      alert("Plan created successfully!");
      await load();
    } catch (err) {
      alert(err.message || "Failed to create plan");
    }
  };

  const calculateEffectivePrice = (plan) => {
    if (plan.display_price !== null && plan.display_price !== undefined) {
      return plan.display_price;
    }
    const rule = pricing.find(r => r.network === plan.network && r.role === 'user');
    const margin = rule ? parseFloat(rule.margin || 0) : 0;
    const marginType = rule?.margin_type || 'fixed';
    const base = parseFloat(plan.base_price || 0);
    if (marginType === 'percentage') {
      return base + (base * margin / 100);
    }
    return base + margin;
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setPlanNameInput(plan.plan_name || '');
    setCostPriceInput(String(plan.base_price || ''));
    setDataSizeInput(plan.data_size || '');
    setValidityInput(plan.validity || '');
    setDisplayPriceInput(plan.display_price !== null ? String(plan.display_price) : '');
    setAgentPriceInput(plan.agent_price !== null && plan.agent_price !== undefined ? String(plan.agent_price) : '');
    setPromoActiveInput(plan.promo_active ?? false);
    setPromoOldPriceInput(plan.promo_old_price !== null ? String(plan.promo_old_price) : '');
    setPromoLabelInput(plan.promo_label || '');
    setFallbackProviderInput(plan.fallback_provider || '');
    setFallbackPlanIdInput(plan.fallback_provider_plan_id || '');
    setDataTypeInput(plan.data_type || '');
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    setIsSavingPlan(true);
    try {
      const payload = {
        plan_name: planNameInput.trim(),
        base_price: parseFloat(costPriceInput) || 0,
        data_size: dataSizeInput.trim(),
        validity: validityInput.trim(),
        promo_active: promoActiveInput
      };
      const val = displayPriceInput.trim();
      if (val === '') {
        payload.clear_display_price = true;
      } else {
        payload.display_price = parseFloat(val);
        if (isNaN(payload.display_price) || payload.display_price < 0) {
          throw new Error('Invalid User price value');
        }
      }
      
      const agentVal = agentPriceInput.trim();
      if (agentVal === '') {
        payload.clear_agent_price = true;
      } else {
        payload.agent_price = parseFloat(agentVal);
        if (isNaN(payload.agent_price) || payload.agent_price < 0) {
          throw new Error('Invalid Agent price value');
        }
      }

      const promoOldPriceVal = promoOldPriceInput.trim();
      if (promoOldPriceVal === '') {
        payload.clear_promo_old_price = true;
      } else {
        payload.promo_old_price = parseFloat(promoOldPriceVal);
        if (isNaN(payload.promo_old_price) || payload.promo_old_price < 0) {
          throw new Error('Invalid Promo Old Price value');
        }
      }

      const promoLabelVal = promoLabelInput.trim();
      if (promoLabelVal === '') {
        payload.clear_promo_label = true;
      } else {
        payload.promo_label = promoLabelVal;
      }
      
      const fbProvVal = fallbackProviderInput.trim();
      if (fbProvVal === '' || fbProvVal === 'none') {
        payload.clear_fallback_provider = true;
      } else {
        payload.fallback_provider = fbProvVal;
      }
      
      const fbPlanIdVal = fallbackPlanIdInput.trim();
      if (fbPlanIdVal === '') {
        payload.clear_fallback_provider_plan_id = true;
      } else {
        payload.fallback_provider_plan_id = fbPlanIdVal;
      }

      const dataTypeVal = dataTypeInput.trim();
      if (dataTypeVal === '') {
        payload.clear_data_type = true;
      } else {
        payload.data_type = dataTypeVal;
      }

      await adminUpdateDataPlan(editingPlan.id, payload);
      await load();
      setEditingPlan(null);
    } catch (err) {
      alert(err.message || 'Failed to update plan');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDisableAll = async () => {
    const activePlans = plans.filter((p) => p.is_active !== false);
    if (!activePlans.length) {
      alert('All plans are already disabled.');
      return;
    }
    if (!confirm(`Are you sure you want to disable all ${activePlans.length} active data plans?`)) return;
    
    setToggling('all');
    try {
      // Process in small batches to avoid overloading the browser or server
      const batchSize = 5;
      for (let i = 0; i < activePlans.length; i += batchSize) {
        const batch = activePlans.slice(i, i + batchSize);
        await Promise.all(batch.map(plan => adminUpdateDataPlan(plan.id, { is_active: false })));
      }
      alert(`Successfully disabled ${activePlans.length} plans.`);
      await load();
    } catch (err) {
      alert(err.message || 'An error occurred while disabling plans.');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-5 pb-8 relative">
      <AdminPageHeader
        title="Data plans management"
        description="Filter network plans, inspect provider metadata, and sync plan catalog from backend provider rails."
        actions={(
          <div className="flex gap-2">
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Manual Plan
            </Button>
            <Button variant="destructive" onClick={handleCleanLegacy} disabled={cleaning || syncing || toggling === 'all'}>
              {cleaning ? 'Cleaning...' : 'Clean Old Plans'}
            </Button>
            <Button variant="destructive" onClick={handleDisableAll} disabled={cleaning || syncing || toggling === 'all'}>
              {toggling === 'all' ? 'Disabling...' : 'Disable All Active'}
            </Button>
            <Button onClick={handleSync} disabled={cleaning || syncing || toggling === 'all'}>
              <RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              {syncing ? 'Syncing...' : 'Sync plans'}
            </Button>
          </div>
        )}
      />

      <FilterBar searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search by plan name or plan code">
        <select
          value={activeNetwork}
          onChange={(event) => setActiveNetwork(event.target.value)}
          className="h-11 rounded-2xl border border-border bg-card px-3 text-sm text-foreground"
        >
          {NETWORKS.map((network) => (
            <option key={network || 'all'} value={network}>{network ? network.toUpperCase() : 'All networks'}</option>
          ))}
        </select>
      </FilterBar>

      <div className="grid gap-4 md:grid-cols-4">
        {['mtn', 'airtel', 'glo', '9mobile'].map((network) => (
          <Card key={network}>
            <CardContent className="p-4">
              <div className="axis-label">{network.toUpperCase()}</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{byNetwork[network] || 0}</div>
              <div className="text-xs text-muted-foreground">Plans available</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminTable
        columns={[
          { key: 'network', label: 'Network', render: (row) => String(row.network || 'other').toUpperCase() },
          { key: 'plan_name', label: 'Plan size/name', render: (row) => row.plan_name || row.data_size || '—' },
          { key: 'validity', label: 'Validity', render: (row) => row.validity || '—' },
          { key: 'base_price', label: 'Cost price', render: (row) => `₦${formatMoney(row.base_price ?? 0)}` },
          { key: 'price', label: 'User Selling Price', render: (row) => {
            const effective = calculateEffectivePrice(row);
            return (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">₦{formatMoney(effective)}</span>
                  {row.promo_active && (
                    <span className="inline-flex items-center rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-green-600 ring-1 ring-inset ring-green-500/20">
                      Promo
                    </span>
                  )}
                </div>
                {row.promo_active && row.promo_old_price && (
                  <span className="text-[10px] text-muted-foreground line-through">
                    ₦{formatMoney(row.promo_old_price)}
                  </span>
                )}
                {row.display_price !== null && row.display_price !== undefined ? (
                  <span className="text-[10px] text-orange-500 font-medium tracking-wider uppercase">Override</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Auto Margin</span>
                )}
              </div>
            );
          }},
          { key: 'agent_price', label: 'Agent Price', render: (row) => {
            return (
              <div className="flex flex-col">
                {row.agent_price !== null && row.agent_price !== undefined ? (
                  <>
                    <span className="font-medium text-orange-500">₦{formatMoney(row.agent_price)}</span>
                    <span className="text-[10px] text-orange-500 font-medium tracking-wider uppercase">Explicit</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-muted-foreground">—</span>
                    <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Margin</span>
                  </>
                )}
              </div>
            );
          }},
          { key: 'provider', label: 'Provider API', render: (row) => (
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase">{row.provider || 'unknown'}</span>
              <span className="font-mono text-[9px] text-muted-foreground tracking-tight">
                ID: {row.provider_plan_id || row.plan_code || '—'}
              </span>
              {row.fallback_provider && row.fallback_provider !== 'none' && (
                <div className="mt-1 pt-1 border-t border-border/40">
                  <span className="text-[10px] text-orange-500 font-medium uppercase block">Fallback: {row.fallback_provider}</span>
                  <span className="font-mono text-[9px] text-muted-foreground tracking-tight">
                    ID: {row.fallback_provider_plan_id || '—'}
                  </span>
                </div>
              )}
            </div>
          )},
          { key: 'plan_code', label: 'System code', render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.plan_code || '—'}</span> },
          { key: 'enabled', label: 'State', render: (row) => <StatusBadge status={row.is_active === false ? 'disabled' : 'enabled'} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex flex-wrap gap-1.5">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  disabled={toggling === row.id || toggling === 'all'}
                  onClick={async () => {
                    setToggling(row.id);
                    try {
                      await adminUpdateDataPlan(row.id, { is_active: row.is_active === false ? true : false });
                      await load();
                    } catch (err) {
                      alert(err.message || 'Failed to toggle data plan');
                    } finally {
                      setToggling(null);
                    }
                  }}
                >
                  {row.is_active === false ? 'Enable' : 'Disable'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(row)}>
                  Edit plan
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={toggling === row.id || toggling === 'all'}
                  onClick={async () => {
                    if (!confirm(`Are you sure you want to permanently delete: ${row.plan_name || row.plan_code}?`)) return;
                    setToggling(row.id);
                    try {
                      await adminDeleteDataPlan(row.id);
                      await load();
                    } catch (err) {
                      alert(err.message || 'Failed to delete data plan');
                    } finally {
                      setToggling(null);
                    }
                  }}
                >
                  Delete
                </Button>
                <Button variant="secondary" size="sm" title={JSON.stringify(row)}>
                  <Database className="h-3.5 w-3.5" />
                  Meta
                </Button>
              </div>
            ),
          },
        ]}
        rows={filtered}
        empty={loading ? 'Loading data plans...' : 'No plans available for the selected filter.'}
      />

      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <CardTitle className="text-lg">Edit Data Plan</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setEditingPlan(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-medium text-foreground">{String(editingPlan.network).toUpperCase()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan Name (Display)</label>
                  <Input
                    placeholder="e.g. 1GB - 30 Days"
                    value={planNameInput}
                    onChange={(e) => setPlanNameInput(e.target.value)}
                    disabled={isSavingPlan}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Type Category</label>
                  <select
                    className="w-full axis-input p-2 rounded-md border border-border"
                    value={dataTypeInput}
                    onChange={(e) => setDataTypeInput(e.target.value)}
                    disabled={isSavingPlan}
                  >
                    <option value="">None / Uncategorized</option>
                    <option value="SME">SME</option>
                    <option value="SME2">SME2</option>
                    <option value="GIFTING">GIFTING</option>
                    <option value="CORPORATE GIFTING">CORPORATE GIFTING</option>
                    <option value="AWOOF DATA">AWOOF DATA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Price (₦)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="The price you pay to the provider"
                  value={costPriceInput}
                  onChange={(e) => setCostPriceInput(e.target.value)}
                  disabled={isSavingPlan}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Size</label>
                  <Input
                    placeholder="e.g. 1GB"
                    value={dataSizeInput}
                    onChange={(e) => setDataSizeInput(e.target.value)}
                    disabled={isSavingPlan}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Validity</label>
                  <Input
                    placeholder="e.g. 30 Days"
                    value={validityInput}
                    onChange={(e) => setValidityInput(e.target.value)}
                    disabled={isSavingPlan}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Price (₦)</label>
                  <Input
                    type="number"
                    placeholder="Auto margin if empty"
                    value={displayPriceInput}
                    onChange={(e) => setDisplayPriceInput(e.target.value)}
                    disabled={isSavingPlan}
                  />
                  <p className="text-xs text-muted-foreground">
                    Explicit price for Normal Users.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Agent Price (₦)</label>
                  <Input
                    type="number"
                    placeholder="Auto margin if empty"
                    value={agentPriceInput}
                    onChange={(e) => setAgentPriceInput(e.target.value)}
                    disabled={isSavingPlan}
                  />
                  <p className="text-xs text-muted-foreground">
                    Explicit price for Agents/Resellers.
                  </p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fallback Provider</label>
                    <select
                      className="w-full axis-input p-2 rounded-md border border-border"
                      value={fallbackProviderInput}
                      onChange={(e) => setFallbackProviderInput(e.target.value)}
                      disabled={isSavingPlan}
                    >
                      <option value="none">None (No Fallback)</option>
                      <option value="amigo">Amigo</option>
                      <option value="smeplug">SMEPlug</option>
                      <option value="clubkonnect">ClubKonnect</option>
                      <option value="autosync">Autosync</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                      Provider to try if primary fails
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fallback Plan ID</label>
                    <Input
                      placeholder="e.g. 1001"
                      value={fallbackPlanIdInput}
                      onChange={(e) => setFallbackPlanIdInput(e.target.value)}
                      disabled={isSavingPlan}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Plan ID for the fallback provider
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-foreground">Promo Active</label>
                    <p className="text-xs text-muted-foreground font-light">Activate strike-through pricing for this plan</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={promoActiveInput}
                    onChange={(e) => setPromoActiveInput(e.target.checked)}
                    disabled={isSavingPlan}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                {promoActiveInput && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Previous Price (₦)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 500"
                        value={promoOldPriceInput}
                        onChange={(e) => setPromoOldPriceInput(e.target.value)}
                        disabled={isSavingPlan}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Strikethrough price. Uses standard calculation if empty.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Promo Label</label>
                      <Input
                        placeholder="e.g. 20% off"
                        value={promoLabelInput}
                        onChange={(e) => setPromoLabelInput(e.target.value)}
                        disabled={isSavingPlan}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Badge label text. Calculated automatically if empty.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setEditingPlan(null)} disabled={isSavingPlan}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlan} disabled={isSavingPlan}>
                  {isSavingPlan ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl my-8">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <CardTitle className="text-lg">Add Manual Data Plan</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsAddModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCreatePlan}>
              <CardContent className="pt-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Network</label>
                    <select 
                      className="w-full axis-input p-2 rounded-md border border-border"
                      value={newPlan.network}
                      onChange={(e) => setNewPlan({...newPlan, network: e.target.value})}
                    >
                      <option value="mtn">MTN</option>
                      <option value="airtel">AIRTEL</option>
                      <option value="glo">GLO</option>
                      <option value="9mobile">9MOBILE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Provider</label>
                    <select 
                      className="w-full axis-input p-2 rounded-md border border-border"
                      value={newPlan.provider}
                      onChange={(e) => setNewPlan({...newPlan, provider: e.target.value})}
                    >
                      <option value="amigo">Amigo</option>
                      <option value="smeplug">SMEPlug</option>
                      <option value="clubkonnect">ClubKonnect</option>
                      <option value="autosync">Autosync</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Plan Name (Display)</label>
                    <Input 
                      placeholder="e.g. 1GB - 30 Days"
                      value={newPlan.plan_name}
                      onChange={(e) => setNewPlan({...newPlan, plan_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Type Category</label>
                    <select
                      className="w-full axis-input p-2 rounded-md border border-border"
                      value={newPlan.data_type}
                      onChange={(e) => setNewPlan({...newPlan, data_type: e.target.value})}
                    >
                      <option value="">None / Uncategorized</option>
                      <option value="SME">SME</option>
                      <option value="SME2">SME2</option>
                      <option value="GIFTING">GIFTING</option>
                      <option value="CORPORATE GIFTING">CORPORATE GIFTING</option>
                      <option value="AWOOF DATA">AWOOF DATA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">System Plan Code (Unique)</label>
                    <Input 
                      placeholder="e.g. amigo:mtn:1001"
                      value={newPlan.plan_code}
                      onChange={(e) => setNewPlan({...newPlan, plan_code: e.target.value})}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">Follow provider:network:id format</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Provider Plan ID</label>
                    <Input 
                      placeholder="e.g. 1001"
                      value={newPlan.provider_plan_id}
                      onChange={(e) => setNewPlan({...newPlan, provider_plan_id: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fallback Provider</label>
                    <select
                      className="w-full axis-input p-2 rounded-md border border-border"
                      value={newPlan.fallback_provider}
                      onChange={(e) => setNewPlan({...newPlan, fallback_provider: e.target.value})}
                    >
                      <option value="none">None (No Fallback)</option>
                      <option value="amigo">Amigo</option>
                      <option value="smeplug">SMEPlug</option>
                      <option value="clubkonnect">ClubKonnect</option>
                      <option value="autosync">Autosync</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fallback Plan ID</label>
                    <Input 
                      placeholder="e.g. 1001"
                      value={newPlan.fallback_provider_plan_id}
                      onChange={(e) => setNewPlan({...newPlan, fallback_provider_plan_id: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cost Price (₦)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={newPlan.base_price}
                      onChange={(e) => setNewPlan({...newPlan, base_price: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Validity</label>
                    <Input 
                      placeholder="e.g. 30 Days"
                      value={newPlan.validity}
                      onChange={(e) => setNewPlan({...newPlan, validity: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User Price (₦)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={newPlan.user_price}
                      onChange={(e) => setNewPlan({...newPlan, user_price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Agent Price (₦)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={newPlan.agent_price}
                      onChange={(e) => setNewPlan({...newPlan, agent_price: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Size</label>
                  <Input 
                    placeholder="e.g. 1GB"
                    value={newPlan.data_size}
                    onChange={(e) => setNewPlan({...newPlan, data_size: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t border-border/50 pt-4">
                <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Plan</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
