'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw, X, Plus, Search, Trash2 } from 'lucide-react';
import { adminGetDataPlans, adminGetPricingRules, adminSyncDataPlans, adminUpdateDataPlan, adminDeleteDataPlan, adminDeleteAutosyncedPlans, adminDeletePlansByNetwork, apiFetch } from '@/lib/api';
import { filterAllowedAmigoPlans } from '@/lib/amigo-plan-policy';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PremiumDataTable } from '@/components/admin/premium-data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [integratedProviders, setIntegratedProviders] = useState([]);
  const [fetchingProviderPlans, setFetchingProviderPlans] = useState(false);
  const [availableProviderPlans, setAvailableProviderPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [activeNetwork, setActiveNetwork] = useState('');
  
  // Modal State
  const [editingPlan, setEditingPlan] = useState(null);
  const [displayPriceInput, setDisplayPriceInput] = useState('');
  const [agentPriceInput, setAgentPriceInput] = useState('');
  const [apiPriceInput, setApiPriceInput] = useState('');
  const [planNameInput, setPlanNameInput] = useState('');
  const [dataTypeInput, setDataTypeInput] = useState('');
  const [costPriceInput, setCostPriceInput] = useState('');
  const [dataSizeInput, setDataSizeInput] = useState('');
  const [validityInput, setValidityInput] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [promoActiveInput, setPromoActiveInput] = useState(false);
  const [promoOldPriceInput, setPromoOldPriceInput] = useState('');
  const [promoLabelInput, setPromoLabelInput] = useState('');
  const [fallbackProviderInput, setFallbackProviderInput] = useState('');
  const [fallbackPlanIdInput, setFallbackPlanIdInput] = useState('');
  const [dispatchCountInput, setDispatchCountInput] = useState('1');
  const [dispatchPlanIdInput, setDispatchPlanIdInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, pricingRes, providersRes] = await Promise.allSettled([
        adminGetDataPlans(),
        adminGetPricingRules(),
        apiFetch('/admin/integrations/providers'),
      ]);
      if (plansRes.status === 'fulfilled') setPlans(asList(plansRes.value));
      if (pricingRes.status === 'fulfilled') setPricing(Array.isArray(pricingRes.value?.items) ? pricingRes.value.items : []);
      if (providersRes.status === 'fulfilled' && Array.isArray(providersRes.value)) {
        setIntegratedProviders(providersRes.value);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const filtered = useMemo(() => {
    if (!activeNetwork) return plans;
    return plans.filter((plan) => String(plan?.network || '').toLowerCase() === activeNetwork);
  }, [activeNetwork, plans]);

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
  const handleDeleteAutosynced = useCallback(async (scope = 'autosynced') => {
    const isAll = scope === 'all';
    const msg = isAll
      ? "DANGER: This will permanently DELETE ALL data plans from the database. Are you sure you want to completely clear the entire catalog?"
      : "This will permanently delete all auto-synced plans (including Talk More voice bundles, Amigo, ClubKonnect, Autosync, and legacy plans) from your database, keeping only your intentional data plans. Proceed?";
    if (!window.confirm(msg)) return;
    setCleaning(true);
    try {
      const res = await adminDeleteAutosyncedPlans(scope);
      alert(res.message || `Successfully deleted ${res.deleted_count ?? 0} data plans!`);
      await load();
    } catch (err) {
      alert(err.message || "Failed to delete auto-synced plans");
    } finally {
      setCleaning(false);
    }
  }, [load]);

  const [deletingNetwork, setDeletingNetwork] = useState(null);
  const handleDeleteNetwork = useCallback(async (network) => {
    if (!network) return;
    const clean = network.toLowerCase();
    const count = byNetwork[clean] || 0;
    const msg = `WARNING: Are you sure you want to PERMANENTLY DELETE ALL ${count} data plans for ${clean.toUpperCase()}?\n\nThis action cannot be undone.`;
    if (!window.confirm(msg)) return;
    setDeletingNetwork(clean);
    try {
      const res = await adminDeletePlansByNetwork(clean);
      alert(res.message || `Successfully deleted ${clean.toUpperCase()} data plans!`);
      await load();
    } catch (err) {
      alert(err.message || `Failed to delete ${clean.toUpperCase()} plans`);
    } finally {
      setDeletingNetwork(null);
    }
  }, [byNetwork, load]);

  const providerOptions = useMemo(() => {
    const list = [...integratedProviders];
    const defaults = [
      { identifier: 'telecom_abode', name: 'Telecom Abode' },
      { identifier: 'smeplug', name: 'SMEPlug' },
      { identifier: 'amigo', name: 'Amigo' },
      { identifier: 'clubkonnect', name: 'ClubKonnect' },
      { identifier: 'autosync', name: 'Autosync' },
      { identifier: 'mzdata', name: 'MZDATA' },
    ];
    for (const d of defaults) {
      if (!list.some(p => String(p?.identifier || '').toLowerCase() === d.identifier)) {
        list.push(d);
      }
    }
    return list;
  }, [integratedProviders]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    network: 'mtn',
    plan_code: '',
    plan_name: '',
    data_size: '',
    validity: '30 Days',
    base_price: '',
    user_price: '',
    agent_price: '',
    api_price: '',
    provider: 'smeplug',
    provider_plan_id: '',
    dispatch_count: 1,
    dispatch_plan_id: '',
    is_active: true
  });

  const handlePullProviderPlans = async () => {
    const prov = String(newPlan.provider || '').trim().toLowerCase();
    if (!prov) return;
    setFetchingProviderPlans(true);
    setAvailableProviderPlans([]);
    try {
      const res = await apiFetch(`/admin/integrations/providers/${prov}/plans?network=${newPlan.network}`);
      if (res?.plans && Array.isArray(res.plans) && res.plans.length > 0) {
        setAvailableProviderPlans(res.plans);
      } else {
        alert(res?.message || `No live catalog returned from ${prov.toUpperCase()} for network ${newPlan.network.toUpperCase()}.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to fetch provider plans');
    } finally {
      setFetchingProviderPlans(false);
    }
  };

  const handleSelectProviderPlan = (plan) => {
    setNewPlan(prev => ({
      ...prev,
      plan_name: plan.plan_name || prev.plan_name,
      plan_code: `${prev.provider}:${prev.network}:${plan.provider_plan_id}`,
      provider_plan_id: String(plan.provider_plan_id || ''),
      base_price: plan.price ? String(plan.price) : prev.base_price,
      data_size: plan.data_size || prev.data_size,
      validity: plan.validity || '30 Days'
    }));
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const { adminCreateDataPlan } = await import('@/lib/api');
      const payload = {
        ...newPlan,
        display_price: newPlan.user_price ? parseFloat(newPlan.user_price) : null,
        agent_price: newPlan.agent_price ? parseFloat(newPlan.agent_price) : null,
        api_price: newPlan.api_price ? parseFloat(newPlan.api_price) : null,
        dispatch_count: parseInt(newPlan.dispatch_count, 10) || 1,
        dispatch_plan_id: newPlan.dispatch_plan_id ? newPlan.dispatch_plan_id.trim() : null
      };
      await adminCreateDataPlan(payload);
      setIsAddModalOpen(false);
      setAvailableProviderPlans([]);
      setNewPlan({
        network: 'mtn',
        plan_code: '',
        plan_name: '',
        data_size: '',
        validity: '30 Days',
        base_price: '',
        user_price: '',
        agent_price: '',
        api_price: '',
        provider: 'smeplug',
        provider_plan_id: '',
        dispatch_count: 1,
        dispatch_plan_id: '',
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
    setDataTypeInput(plan.data_type || '');
    setCostPriceInput(String(plan.base_price || ''));
    setDataSizeInput(plan.data_size || '');
    setValidityInput(plan.validity || '');
    setDisplayPriceInput(plan.display_price !== null ? String(plan.display_price) : '');
    setAgentPriceInput(plan.agent_price !== null && plan.agent_price !== undefined ? String(plan.agent_price) : '');
    setApiPriceInput(plan.api_price !== null && plan.api_price !== undefined ? String(plan.api_price) : '');
    setPromoActiveInput(plan.promo_active ?? false);
    setPromoOldPriceInput(plan.promo_old_price !== null ? String(plan.promo_old_price) : '');
    setPromoLabelInput(plan.promo_label || '');
    setFallbackProviderInput(plan.fallback_provider || 'none');
    setFallbackPlanIdInput(plan.fallback_provider_plan_id || '');
    setDispatchCountInput(plan.dispatch_count ? String(plan.dispatch_count) : '1');
    setDispatchPlanIdInput(plan.dispatch_plan_id || '');
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
      const dataTypeVal = dataTypeInput.trim();
      if (dataTypeVal === '') {
        payload.clear_data_type = true;
      } else {
        payload.data_type = dataTypeVal;
      }
      const val = displayPriceInput.trim();
      if (val === '') {
        payload.clear_display_price = true;
      } else {
        payload.display_price = parseFloat(val);
        if (isNaN(payload.display_price) || payload.display_price < 0) throw new Error('Invalid User price value');
      }
      
      const agentVal = agentPriceInput.trim();
      if (agentVal === '') {
        payload.clear_agent_price = true;
      } else {
        payload.agent_price = parseFloat(agentVal);
        if (isNaN(payload.agent_price) || payload.agent_price < 0) throw new Error('Invalid Agent price value');
      }

      const apiVal = apiPriceInput.trim();
      if (apiVal === '') {
        payload.clear_api_price = true;
      } else {
        payload.api_price = parseFloat(apiVal);
        if (isNaN(payload.api_price) || payload.api_price < 0) throw new Error('Invalid Developer API price value');
      }

      const promoOldPriceVal = promoOldPriceInput.trim();
      if (promoOldPriceVal === '') {
        payload.clear_promo_old_price = true;
      } else {
        payload.promo_old_price = parseFloat(promoOldPriceVal);
        if (isNaN(payload.promo_old_price) || payload.promo_old_price < 0) throw new Error('Invalid Promo Old Price value');
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

      const dCount = parseInt(dispatchCountInput, 10);
      payload.dispatch_count = isNaN(dCount) || dCount < 1 ? 1 : dCount;

      const dPlanId = dispatchPlanIdInput.trim();
      if (dPlanId === '') {
        payload.clear_dispatch_plan_id = true;
      } else {
        payload.dispatch_plan_id = dPlanId;
      }

      await adminUpdateDataPlan(editingPlan.id, payload);
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { 
        ...p, 
        ...payload,
        dispatch_count: payload.dispatch_count,
        dispatch_plan_id: payload.clear_dispatch_plan_id ? null : payload.dispatch_plan_id
      } : p));
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

  const columns = useMemo(() => [
    { key: 'network', label: 'Network', sortable: true, render: (row) => <span className="font-semibold uppercase text-foreground">{row.network || 'other'}</span> },
    { key: 'plan_name', label: 'Plan / Size', sortable: true, render: (row) => <span className="font-medium text-foreground">{row.plan_name || row.data_size || '—'}</span> },
    { key: 'validity', label: 'Validity', sortable: false, render: (row) => <span className="text-muted-foreground">{row.validity || '—'}</span> },
    { key: 'base_price', label: 'Cost Price', sortable: true, render: (row) => <span className="text-muted-foreground">₦{formatMoney(row.base_price ?? 0)}</span> },
    { key: 'price', label: 'Selling Price', sortable: false, render: (row) => {
      const effective = calculateEffectivePrice(row);
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">₦{formatMoney(effective)}</span>
            {row.promo_active && (
              <span className="inline-flex items-center rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-green-500">
                Promo
              </span>
            )}
          </div>
          {row.promo_active && row.promo_old_price && (
            <span className="text-[10px] text-muted-foreground line-through">₦{formatMoney(row.promo_old_price)}</span>
          )}
          {row.display_price !== null && row.display_price !== undefined ? (
            <span className="text-[9px] text-orange-500 font-medium tracking-widest uppercase mt-0.5">Override</span>
          ) : (
            <span className="text-[9px] text-muted-foreground tracking-widest uppercase mt-0.5">Margin</span>
          )}
        </div>
      );
    }},
    { key: 'agent_price', label: 'Agent Price', sortable: false, render: (row) => {
      return (
        <div className="flex flex-col">
          {row.agent_price !== null && row.agent_price !== undefined ? (
            <>
              <span className="font-medium text-orange-500">₦{formatMoney(row.agent_price)}</span>
              <span className="text-[9px] text-orange-500 font-medium tracking-widest uppercase mt-0.5">Explicit</span>
            </>
          ) : (
            <>
              <span className="font-medium text-muted-foreground">—</span>
              <span className="text-[9px] text-muted-foreground tracking-widest uppercase mt-0.5">Margin</span>
            </>
          )}
        </div>
      );
    }},
    { key: 'api_price', label: 'Developer Price', sortable: false, render: (row) => {
      return (
        <div className="flex flex-col">
          {row.api_price !== null && row.api_price !== undefined ? (
            <>
              <span className="font-medium text-blue-500">₦{formatMoney(row.api_price)}</span>
              <span className="text-[9px] text-blue-500 font-medium tracking-widest uppercase mt-0.5">Explicit</span>
            </>
          ) : (
            <>
              <span className="font-medium text-muted-foreground">—</span>
              <span className="text-[9px] text-muted-foreground tracking-widest uppercase mt-0.5">User Price</span>
            </>
          )}
        </div>
      );
    }},
    { key: 'provider', label: 'API Provider', sortable: true, render: (row) => (
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase text-brand">{row.provider || 'unknown'}</span>
        <span className="font-mono text-[10px] text-muted-foreground mt-0.5 tracking-tight">ID: {row.provider_plan_id || row.plan_code || '—'}</span>
        {row.dispatch_count && row.dispatch_count > 1 && (
          <div className="mt-1.5 pt-1.5 border-t border-border/40">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
              ⚡ {row.dispatch_count}x Split {row.dispatch_plan_id ? `(${row.dispatch_plan_id})` : ''}
            </span>
          </div>
        )}
        {row.fallback_provider && row.fallback_provider !== 'none' && (
          <div className="mt-1.5 pt-1.5 border-t border-border/40">
            <span className="text-[10px] font-semibold uppercase text-orange-500 block leading-tight">Fallback: {row.fallback_provider}</span>
            <span className="font-mono text-[9px] text-muted-foreground tracking-tight">ID: {row.fallback_provider_plan_id || '—'}</span>
          </div>
        )}
      </div>
    )},
    { key: 'plan_code', label: 'System Code', sortable: true, render: (row) => <span className="font-mono text-[11px] text-muted-foreground">{row.plan_code || '—'}</span> },
    { key: 'enabled', label: 'Status', sortable: false, render: (row) => <StatusBadge status={row.is_active === false ? 'disabled' : 'active'} /> },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 rounded-xl"
            disabled={toggling === row.id || toggling === 'all'}
            onClick={async () => {
              setToggling(row.id);
              const newStatus = row.is_active === false ? true : false;
              // Optimistically update the UI to feel instant and avoid race conditions
              setPlans(prev => prev.map(p => p.id === row.id ? { ...p, is_active: newStatus } : p));
              try {
                await adminUpdateDataPlan(row.id, { is_active: newStatus });
              } catch (err) {
                // Revert on failure
                setPlans(prev => prev.map(p => p.id === row.id ? { ...p, is_active: !newStatus } : p));
                alert(err.message || 'Failed to toggle data plan');
              } finally {
                setToggling(null);
              }
            }}
          >
            {row.is_active === false ? 'Enable' : 'Disable'}
          </Button>
          <Button variant="secondary" size="sm" className="h-8 rounded-xl" onClick={() => handleOpenEditModal(row)}>
            Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
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
        </div>
      ),
    },
  ], [pricing, toggling, load]);

  const FilterControls = (
    <div className="flex items-center gap-3">
      <select
        value={activeNetwork}
        onChange={(event) => setActiveNetwork(event.target.value)}
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand/50"
      >
        {NETWORKS.map((network) => (
          <option key={network || 'all'} value={network}>{network ? network.toUpperCase() : 'All networks'}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 pb-8 relative">
      <AdminPageHeader
        eyebrow="Products"
        title="Data Plans Management"
        description="Filter network plans, inspect provider metadata, and sync plan catalog from backend provider rails."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Manual Plan
            </Button>
            <Button 
              variant="destructive" 
              className="rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 border border-red-500/20" 
              onClick={() => handleDeleteAutosynced('autosynced')} 
              disabled={cleaning || syncing || toggling === 'all'}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {cleaning ? 'Deleting...' : 'Delete Auto-Synced Plans'}
            </Button>
            <Button 
              variant="destructive" 
              className="rounded-xl bg-red-600/15 text-red-600 hover:bg-red-600/25 border border-red-600/30" 
              onClick={() => handleDeleteAutosynced('all')} 
              disabled={cleaning || syncing || toggling === 'all'}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Wipe All Plans
            </Button>
            {activeNetwork && (
              <Button
                variant="destructive"
                className="rounded-xl bg-red-600 text-white hover:bg-red-700 border border-red-700"
                onClick={() => handleDeleteNetwork(activeNetwork)}
                disabled={cleaning || syncing || deletingNetwork === activeNetwork}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deletingNetwork === activeNetwork ? `Deleting ${activeNetwork.toUpperCase()}...` : `Delete All ${activeNetwork.toUpperCase()} Plans`}
              </Button>
            )}
            <Button variant="destructive" className="rounded-xl" onClick={handleDisableAll} disabled={cleaning || syncing || toggling === 'all'}>
              {toggling === 'all' ? 'Disabling...' : 'Disable All Active'}
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl bg-card/50 backdrop-blur-xl" 
              onClick={() => {
                if (window.confirm("Auto-sync will pull all default plans from upstream providers (Amigo, SMEPlug, ClubKonnect). Continue?")) {
                  handleSync();
                }
              }} 
              disabled={cleaning || syncing || toggling === 'all'}
            >
              <RefreshCw className={syncing ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
              {syncing ? 'Syncing...' : 'Sync plans'}
            </Button>
          </div>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['mtn', 'airtel', 'glo', '9mobile'].map((network, idx) => {
          const count = byNetwork[network] || 0;
          return (
            <motion.div
              key={network}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{network}</div>
                    {count > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-lg"
                        disabled={deletingNetwork === network}
                        onClick={() => handleDeleteNetwork(network)}
                        title={`Delete all ${network.toUpperCase()} plans`}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        {deletingNetwork === network ? 'Deleting...' : 'Delete all'}
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">{count}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Plans available</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <PremiumDataTable 
          data={filtered} 
          columns={columns} 
          searchKey="plan_name"
          emptyMessage={loading ? 'Loading data plans...' : 'No plans available for the selected filter.'}
          headerActions={FilterControls}
        />
      </motion.div>

      <AnimatePresence>
        {editingPlan && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <Card className="w-full max-w-xl shadow-2xl rounded-3xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-5 pt-6 px-6">
                <div>
                  <CardTitle className="text-xl">Edit Data Plan</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Modify pricing and metadata for {editingPlan.network.toUpperCase()}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary/50" onClick={() => setEditingPlan(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-6 px-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan Display Name</label>
                    <Input
                      placeholder="e.g. 1GB - 30 Days"
                      value={planNameInput}
                      onChange={(e) => setPlanNameInput(e.target.value)}
                      disabled={isSavingPlan}
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Type Category</label>
                    <select
                      className="w-full h-11 px-3 rounded-xl bg-secondary/30 border border-input focus:ring-1 focus:ring-brand"
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

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost Price (₦)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Provider wholesale cost"
                    value={costPriceInput}
                    onChange={(e) => setCostPriceInput(e.target.value)}
                    disabled={isSavingPlan}
                    className="h-11 rounded-xl bg-secondary/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Size</label>
                    <Input
                      placeholder="e.g. 1GB"
                      value={dataSizeInput}
                      onChange={(e) => setDataSizeInput(e.target.value)}
                      disabled={isSavingPlan}
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Validity</label>
                    <Input
                      placeholder="e.g. 30 Days"
                      value={validityInput}
                      onChange={(e) => setValidityInput(e.target.value)}
                      disabled={isSavingPlan}
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User Price (₦)</label>
                    <Input
                      type="number"
                      placeholder="Leave empty for auto-margin"
                      value={displayPriceInput}
                      onChange={(e) => setDisplayPriceInput(e.target.value)}
                      disabled={isSavingPlan}
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Overrides dynamic margin for regular users.</p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Price (₦)</label>
                    <Input
                      type="number"
                      placeholder="Leave empty for auto-margin"
                      value={agentPriceInput}
                      onChange={(e) => setAgentPriceInput(e.target.value)}
                      disabled={isSavingPlan}
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Overrides dynamic margin for resellers.</p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <span>API / Dev Price (₦)</span>
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-500">API</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Leave empty for User price"
                      value={apiPriceInput}
                      onChange={(e) => setApiPriceInput(e.target.value)}
                      disabled={isSavingPlan}
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Overrides price for developers using your API.</p>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fallback Provider</label>
                      <select
                        className="w-full h-11 px-3 rounded-xl bg-secondary/30 border border-input focus:ring-1 focus:ring-brand"
                        value={fallbackProviderInput}
                        onChange={(e) => setFallbackProviderInput(e.target.value)}
                        disabled={isSavingPlan}
                      >
                        <option value="none">None (No Fallback)</option>
                        {providerOptions.map((p) => (
                          <option key={p.id || p.identifier} value={p.identifier}>
                            {p.name || p.identifier} ({p.identifier}){p.is_active ? ' — Active' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Provider to try if primary fails.</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fallback Plan ID</label>
                      <Input
                        placeholder="e.g. 1001"
                        value={fallbackPlanIdInput}
                        onChange={(e) => setFallbackPlanIdInput(e.target.value)}
                        disabled={isSavingPlan}
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Plan ID for the fallback provider.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-5 space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span>⚡ Multi-Dispatch / Bundle Splitting</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Split order into multiple provider requests (e.g. 10GB delivered as 5GB x 2).</p>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dispatch Count (Times)</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="1 (Default: single delivery)"
                        value={dispatchCountInput}
                        onChange={(e) => setDispatchCountInput(e.target.value)}
                        disabled={isSavingPlan}
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Number of deliveries to send (e.g. 2 for 2x delivery).</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sub-Plan ID (Optional)</label>
                      <Input
                        placeholder="e.g. 5GB provider plan ID"
                        value={dispatchPlanIdInput}
                        onChange={(e) => setDispatchPlanIdInput(e.target.value)}
                        disabled={isSavingPlan}
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Leave blank to use this plan's own Provider Plan ID.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-brand/5 p-4 border border-brand/10">
                    <div>
                      <div className="text-sm font-semibold text-brand">Enable Promotional Pricing</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Shows a strike-through original price and badge</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={promoActiveInput} onChange={(e) => setPromoActiveInput(e.target.checked)} disabled={isSavingPlan} />
                      <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                    </label>
                  </div>

                  {promoActiveInput && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-5 pt-2">
                      <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original Price (₦)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          value={promoOldPriceInput}
                          onChange={(e) => setPromoOldPriceInput(e.target.value)}
                          disabled={isSavingPlan}
                          className="h-11 rounded-xl bg-secondary/30"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Promo Label</label>
                        <Input
                          placeholder="e.g. 20% off"
                          value={promoLabelInput}
                          onChange={(e) => setPromoLabelInput(e.target.value)}
                          disabled={isSavingPlan}
                          className="h-11 rounded-xl bg-secondary/30"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t border-border/50 p-6 bg-card/50 rounded-b-3xl">
                <Button variant="ghost" className="rounded-xl h-11 px-6" onClick={() => setEditingPlan(null)} disabled={isSavingPlan}>
                  Cancel
                </Button>
                <Button className="rounded-xl h-11 px-6" onClick={handleSavePlan} disabled={isSavingPlan}>
                  {isSavingPlan ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSavingPlan ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <Card className="w-full max-w-xl shadow-2xl my-8 rounded-3xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-5 pt-6 px-6">
                <CardTitle className="text-xl">Add Manual Data Plan</CardTitle>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary/50" onClick={() => setIsAddModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <form onSubmit={handleCreatePlan}>
                <CardContent className="pt-6 px-6 space-y-5 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network</label>
                      <select 
                        className="w-full h-11 px-3 rounded-xl border border-border bg-secondary/30 outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand"
                        value={newPlan.network}
                        onChange={(e) => {
                          setNewPlan({...newPlan, network: e.target.value});
                          setAvailableProviderPlans([]);
                        }}
                      >
                        <option value="mtn">MTN</option>
                        <option value="airtel">AIRTEL</option>
                        <option value="glo">GLO</option>
                        <option value="9mobile">9MOBILE</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider API</label>
                      <select 
                        className="w-full h-11 px-3 rounded-xl border border-border bg-secondary/30 outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand"
                        value={newPlan.provider}
                        onChange={(e) => {
                          setNewPlan({...newPlan, provider: e.target.value});
                          setAvailableProviderPlans([]);
                        }}
                      >
                        {providerOptions.map((p) => (
                          <option key={p.id || p.identifier} value={p.identifier}>
                            {p.name || p.identifier} ({p.identifier}){p.is_active ? ' — Active' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Auto Discovery / Live Catalog Puller */}
                  <div className="space-y-2 p-3 rounded-2xl bg-secondary/20 border border-border/60">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-medium text-foreground block">Pull Live Catalog</span>
                        <span className="text-[11px] text-muted-foreground">Auto-populate plans from {String(newPlan.provider || '').toUpperCase()}</span>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handlePullProviderPlans} 
                        disabled={fetchingProviderPlans}
                        className="h-8 gap-1.5 text-xs border-brand/40 text-brand hover:bg-brand/10 shrink-0"
                      >
                        <RefreshCw className={fetchingProviderPlans ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                        {fetchingProviderPlans ? "Fetching..." : `Pull ${newPlan.network.toUpperCase()} Plans`}
                      </Button>
                    </div>

                    {availableProviderPlans.length > 0 && (
                      <div className="pt-2 space-y-1.5 border-t border-border/40">
                        <label className="text-xs font-semibold text-brand block">Select a Live Plan to Autofill:</label>
                        <select 
                          className="w-full h-10 px-3 rounded-xl border border-brand/30 bg-background text-xs outline-none focus:ring-1 focus:ring-brand"
                          onChange={(e) => {
                            const selected = availableProviderPlans.find(p => String(p.provider_plan_id) === e.target.value);
                            if (selected) handleSelectProviderPlan(selected);
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>-- Found {availableProviderPlans.length} live plans on {newPlan.provider.toUpperCase()} --</option>
                          {availableProviderPlans.map((p, idx) => (
                            <option key={p.provider_plan_id || idx} value={p.provider_plan_id}>
                              {p.plan_name} — ₦{Number(p.price || 0).toLocaleString()} (Provider Plan ID: {p.provider_plan_id})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-muted-foreground">Picking a live plan automatically sets the display name, provider plan ID, system code, and wholesale cost.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan Name (Display)</label>
                    <Input 
                      placeholder="e.g. 1GB - 30 Days"
                      value={newPlan.plan_name}
                      onChange={(e) => setNewPlan({...newPlan, plan_name: e.target.value})}
                      required
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Code</label>
                      <Input 
                        placeholder="e.g. amigo:mtn:1001"
                        value={newPlan.plan_code}
                        onChange={(e) => setNewPlan({...newPlan, plan_code: e.target.value})}
                        required
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                      <p className="text-[10px] text-muted-foreground">Format: provider:network:id</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider Plan ID</label>
                      <Input 
                        placeholder="e.g. 1001"
                        value={newPlan.provider_plan_id}
                        onChange={(e) => setNewPlan({...newPlan, provider_plan_id: e.target.value})}
                        required
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost Price (₦)</label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={newPlan.base_price}
                        onChange={(e) => setNewPlan({...newPlan, base_price: e.target.value})}
                        required
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Validity</label>
                      <Input 
                        placeholder="e.g. 30 Days"
                        value={newPlan.validity}
                        onChange={(e) => setNewPlan({...newPlan, validity: e.target.value})}
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User Price (₦)</label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={newPlan.user_price}
                        onChange={(e) => setNewPlan({...newPlan, user_price: e.target.value})}
                        required
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Price (₦)</label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={newPlan.agent_price}
                        onChange={(e) => setNewPlan({...newPlan, agent_price: e.target.value})}
                        required
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API / Dev Price (₦)</label>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="Optional"
                        value={newPlan.api_price || ''}
                        onChange={(e) => setNewPlan({...newPlan, api_price: e.target.value})}
                        className="h-11 rounded-xl bg-secondary/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data Size</label>
                    <Input 
                      placeholder="e.g. 1GB"
                      value={newPlan.data_size}
                      onChange={(e) => setNewPlan({...newPlan, data_size: e.target.value})}
                      className="h-11 rounded-xl bg-secondary/30"
                    />
                  </div>

                  <div className="border-t border-border/50 pt-5 space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <span>⚡ Multi-Dispatch / Bundle Splitting</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Split order into multiple provider requests (e.g. 10GB delivered as 5GB x 2).</p>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dispatch Count</label>
                        <Input 
                          type="number"
                          min="1"
                          max="10"
                          value={newPlan.dispatch_count}
                          onChange={(e) => setNewPlan({...newPlan, dispatch_count: e.target.value})}
                          placeholder="1 (Default: single delivery)"
                          className="h-11 rounded-xl bg-secondary/30"
                        />
                        <p className="text-[10px] text-muted-foreground">Times to dispatch (default 1)</p>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sub-Plan ID (Optional)</label>
                        <Input 
                          placeholder="e.g. 5GB provider plan ID"
                          value={newPlan.dispatch_plan_id}
                          onChange={(e) => setNewPlan({...newPlan, dispatch_plan_id: e.target.value})}
                          className="h-11 rounded-xl bg-secondary/30"
                        />
                        <p className="text-[10px] text-muted-foreground">Leave blank to use Provider Plan ID</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t border-border/50 p-6 bg-card/50 rounded-b-3xl">
                  <Button variant="ghost" type="button" className="rounded-xl h-11 px-6" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-xl h-11 px-6">Create Plan</Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
