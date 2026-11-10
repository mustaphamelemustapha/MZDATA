'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, X, Plus, Award, CheckCircle2, Sparkles, UserCheck, Gift } from 'lucide-react';
import { adminGetAnalytics, adminGetPricingRules, adminGetServiceToggles, adminUpdatePricingRule, adminUpdateServiceToggle, adminGetCommissionSettings, adminUpdateCommissionSettings, adminReconcileAgentCommissions, adminReconcileWelcomeBonuses, apiFetch, getProfile } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { getActiveBrand } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { StatusBadge } from '@/components/admin/status-badge';
import { PremiumDataTable } from '@/components/admin/premium-data-table';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminSettingsPage() {
  const profile = getProfile();
  const [loading, setLoading] = useState(true);
  const [pricingRules, setPricingRules] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [serviceToggles, setServiceToggles] = useState({});
  const [toggling, setToggling] = useState(false);
  
  // Commission Settings State
  const [commissionConfig, setCommissionConfig] = useState({
    brand: '',
    ambassador_deposit_percent: 5.0,
    agent_data_commission_percent: 2.0,
    enable_agent_data_commission: true,
    enable_welcome_data_bonus: false,
    welcome_data_bonus_amount: 300,
    welcome_data_bonus_min_gb: 2.0,
  });
  const [savingCommission, setSavingCommission] = useState(false);
  const [commissionSavedMsg, setCommissionSavedMsg] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [reconcileMsg, setReconcileMsg] = useState('');
  const [reconcilingWelcome, setReconcilingWelcome] = useState(false);
  const [reconcileWelcomeMsg, setReconcileWelcomeMsg] = useState('');

  // Margin Edit State
  const [editingMarginFor, setEditingMarginFor] = useState(null);
  const [marginInput, setMarginInput] = useState('');
  const [marginTypeInput, setMarginTypeInput] = useState('fixed');
  const [isSavingMargin, setIsSavingMargin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pricingRes, catalogRes, analyticsRes, togglesRes, commRes] = await Promise.allSettled([
        adminGetPricingRules(),
        apiFetch('/services/catalog'),
        adminGetAnalytics(),
        adminGetServiceToggles(),
        adminGetCommissionSettings(),
      ]);
      if (pricingRes.status === 'fulfilled') setPricingRules(Array.isArray(pricingRes.value?.items) ? pricingRes.value.items : []);
      if (catalogRes.status === 'fulfilled') setCatalog(catalogRes.value || {});
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value || {});
      if (togglesRes.status === 'fulfilled') setServiceToggles(togglesRes.value || {});
      if (commRes.status === 'fulfilled' && commRes.value) {
        setCommissionConfig(commRes.value);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveCommission = async () => {
    setSavingCommission(true);
    setCommissionSavedMsg('');
    try {
      const parsedAmb = parseFloat(commissionConfig.ambassador_deposit_percent);
      const parsedAgent = parseFloat(commissionConfig.agent_data_commission_percent);
      const parsedWelcomeAmt = parseFloat(commissionConfig.welcome_data_bonus_amount);
      const parsedWelcomeMinGb = parseFloat(commissionConfig.welcome_data_bonus_min_gb);
      const res = await adminUpdateCommissionSettings({
        ambassador_deposit_percent: isNaN(parsedAmb) ? 0.0 : parsedAmb,
        agent_data_commission_percent: isNaN(parsedAgent) ? 0.0 : parsedAgent,
        enable_agent_data_commission: Boolean(commissionConfig.enable_agent_data_commission),
        enable_welcome_data_bonus: Boolean(commissionConfig.enable_welcome_data_bonus),
        welcome_data_bonus_amount: isNaN(parsedWelcomeAmt) ? 300.0 : parsedWelcomeAmt,
        welcome_data_bonus_min_gb: isNaN(parsedWelcomeMinGb) ? 2.0 : parsedWelcomeMinGb,
      });
      if (res) {
        setCommissionConfig(res);
      }
      setCommissionSavedMsg('Commission & marketing campaign settings updated successfully!');
      setTimeout(() => setCommissionSavedMsg(''), 4000);
    } catch (err) {
      alert(err?.message || 'Failed to update commission settings');
    } finally {
      setSavingCommission(false);
    }
  };

  const handleReconcileCommissions = async () => {
    setReconciling(true);
    setReconcileMsg('');
    try {
      const res = await adminReconcileAgentCommissions();
      setReconcileMsg(`Credited ${res.count || 0} missing agent cashback!`);
      setTimeout(() => setReconcileMsg(''), 5000);
    } catch (err) {
      alert(err?.message || 'Failed to reconcile agent commissions');
    } finally {
      setReconciling(false);
    }
  };

  const handleReconcileWelcomeBonuses = async () => {
    setReconcilingWelcome(true);
    setReconcileWelcomeMsg('');
    try {
      const res = await adminReconcileWelcomeBonuses();
      setReconcileWelcomeMsg(`Awarded ₦300 welcome gift to ${res.count || 0} qualifying users!`);
      setTimeout(() => setReconcileWelcomeMsg(''), 5000);
    } catch (err) {
      alert(err?.message || 'Failed to reconcile welcome bonuses');
    } finally {
      setReconcilingWelcome(false);
    }
  };

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

  const marginColumns = [
    { key: 'network', label: 'Service / Network', sortable: false, render: (row) => <span className="font-semibold uppercase tracking-wider">{String(row.network)}</span> },
    { key: 'role', label: 'User Role', sortable: false, render: (row) => <span className="capitalize font-medium text-foreground">{row.role}</span> },
    { key: 'margin', label: 'Current Margin', sortable: false, render: (row) => {
      const type = row.margin_type || 'fixed';
      return (
        <span className="font-semibold text-brand">
          {type === 'percentage' ? `${row.margin}%` : `₦${formatMoney(row.margin)}`}
        </span>
      );
    }},
    { key: 'type', label: 'Margin Type', sortable: false, render: (row) => <span className="capitalize text-muted-foreground">{row.margin_type || 'fixed'}</span> },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (row) => (
        <Button variant="secondary" size="sm" className="h-8 rounded-xl" onClick={() => handleOpenMarginModal(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8 relative">
      <AdminPageHeader
        eyebrow="Configuration"
        title="Admin Settings"
        description="Service toggles, provider health, referral policy, and platform margin rules."
        actions={
          <Button variant="outline" className="rounded-xl border-border bg-card/50 backdrop-blur-xl hover:bg-secondary" onClick={load} disabled={loading}>
            <RefreshCw className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
            Refresh Config
          </Button>
        }
      />

      {/* Role & Commission Configuration Card (Ambassador & Agent) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-secondary/20 pb-4 pt-5 px-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Role & Commission Configuration</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Automated onboarding commissions for Ambassadors and transaction cashback for Agents.
                </CardDescription>
              </div>
            </div>
            <span className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
              {getActiveBrand()?.name || 'MELE DATA'}
            </span>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 xl:grid-cols-3 md:grid-cols-2 grid-cols-1">
              {/* Ambassador Settings */}
              <div className="rounded-2xl border border-border/60 bg-background/50 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-sm text-foreground">Ambassador Referral Reward</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-500">1st Deposit %</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Percentage granted to the Ambassador immediately upon the referred user&apos;s first wallet funding.
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      placeholder="e.g. 10.0"
                      value={commissionConfig.ambassador_deposit_percent ?? ''}
                      onChange={(e) => setCommissionConfig({ ...commissionConfig, ambassador_deposit_percent: e.target.value })}
                      className="h-11 font-bold text-base rounded-xl pr-8 bg-background border-border"
                    />
                    <span className="absolute right-3 top-3 text-sm font-bold text-muted-foreground">%</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground mr-1">Presets:</span>
                    {[2.5, 5.0, 7.5, 10.0, 15.0].map((preset) => {
                      const isSelected = parseFloat(commissionConfig.ambassador_deposit_percent) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setCommissionConfig({
                              ...commissionConfig,
                              ambassador_deposit_percent: preset,
                            });
                          }}
                          className={`text-xs px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
                          }`}
                        >
                          {preset}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Agent Settings */}
              <div className="rounded-2xl border border-border/60 bg-background/50 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-emerald-500" />
                    <span className="font-bold text-sm text-foreground">Agent Data Purchase Commission</span>
                  </div>
                  <Button
                    type="button"
                    variant={commissionConfig.enable_agent_data_commission ? 'default' : 'secondary'}
                    size="sm"
                    className="h-7 text-xs rounded-lg font-bold"
                    onClick={() => setCommissionConfig({
                      ...commissionConfig,
                      enable_agent_data_commission: !commissionConfig.enable_agent_data_commission,
                    })}
                  >
                    {commissionConfig.enable_agent_data_commission ? 'Active' : 'Disabled'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Instant cashback credited back to the agent&apos;s wallet automatically on every successful data transaction.
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g. 2.0"
                      value={commissionConfig.agent_data_commission_percent ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num = parseFloat(val);
                        setCommissionConfig({
                          ...commissionConfig,
                          agent_data_commission_percent: val,
                          enable_agent_data_commission: !isNaN(num) && num > 0 ? true : commissionConfig.enable_agent_data_commission,
                        });
                      }}
                      className="h-11 font-bold text-base rounded-xl pr-8 bg-background border-border"
                    />
                    <span className="absolute right-3 top-3 text-sm font-bold text-muted-foreground">%</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground mr-1">Presets:</span>
                    {[1.0, 1.5, 2.0, 2.5, 3.0, 5.0].map((preset) => {
                      const isSelected = parseFloat(commissionConfig.agent_data_commission_percent) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setCommissionConfig({
                              ...commissionConfig,
                              agent_data_commission_percent: preset,
                              enable_agent_data_commission: true,
                            });
                          }}
                          className={`text-xs px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-secondary/70 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50'
                          }`}
                        >
                          {preset}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Welcome 2GB Marketing Gift Campaign */}
              <div className="rounded-2xl border border-border/60 bg-background/50 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-purple-500" />
                    <span className="font-bold text-sm text-foreground">Welcome Data Bonus Campaign</span>
                  </div>
                  <Button
                    type="button"
                    variant={commissionConfig.enable_welcome_data_bonus ? 'default' : 'secondary'}
                    size="sm"
                    className="h-7 text-xs rounded-lg font-bold"
                    onClick={() => setCommissionConfig({
                      ...commissionConfig,
                      enable_welcome_data_bonus: !commissionConfig.enable_welcome_data_bonus,
                    })}
                  >
                    {commissionConfig.enable_welcome_data_bonus ? 'Active' : 'Disabled'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gifts ₦{commissionConfig.welcome_data_bonus_amount || 300} to user&apos;s wallet when they deposit &amp; reach {commissionConfig.welcome_data_bonus_min_gb || 2.0}GB cumulative data (e.g. 1GB + 1GB).
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground">Reward (₦)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="50"
                        min="0"
                        placeholder="300"
                        value={commissionConfig.welcome_data_bonus_amount ?? ''}
                        onChange={(e) => setCommissionConfig({
                          ...commissionConfig,
                          welcome_data_bonus_amount: e.target.value,
                        })}
                        className="h-10 font-bold text-sm rounded-xl pl-6 bg-background border-border"
                      />
                      <span className="absolute left-2.5 top-2.5 text-xs font-bold text-muted-foreground">₦</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {[200, 300, 500, 1000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCommissionConfig({ ...commissionConfig, welcome_data_bonus_amount: preset })}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all ${
                            parseFloat(commissionConfig.welcome_data_bonus_amount) === preset
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-secondary/70 hover:bg-secondary text-muted-foreground'
                          }`}
                        >
                          ₦{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground">Milestone (GB)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        placeholder="2.0"
                        value={commissionConfig.welcome_data_bonus_min_gb ?? ''}
                        onChange={(e) => setCommissionConfig({
                          ...commissionConfig,
                          welcome_data_bonus_min_gb: e.target.value,
                        })}
                        className="h-10 font-bold text-sm rounded-xl pr-8 bg-background border-border"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs font-bold text-muted-foreground">GB</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {[1.0, 2.0, 3.0, 5.0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCommissionConfig({ ...commissionConfig, welcome_data_bonus_min_gb: preset })}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all ${
                            parseFloat(commissionConfig.welcome_data_bonus_min_gb) === preset
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-secondary/70 hover:bg-secondary text-muted-foreground'
                          }`}
                        >
                          {preset}G
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/40">
              <div className="flex flex-col gap-1">
                {commissionSavedMsg ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {commissionSavedMsg}
                  </div>
                ) : reconcileWelcomeMsg ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {reconcileWelcomeMsg}
                  </div>
                ) : reconcileMsg ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {reconcileMsg}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Saved settings persist in the database and override code defaults for this tenant.
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReconcileWelcomeBonuses}
                  disabled={reconcilingWelcome}
                  className="rounded-xl h-10 px-3.5 text-xs font-bold border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                  title="Scan users who met the 2GB cumulative purchase milestone and award missing ₦300 welcome gifts"
                >
                  {reconcilingWelcome ? 'Scanning...' : 'Reconcile Past 2GB Welcome Gifts'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReconcileCommissions}
                  disabled={reconciling}
                  className="rounded-xl h-10 px-3.5 text-xs font-bold border-border/70 hover:bg-secondary"
                  title={`Scan recent data transactions by agents and award any missing ${commissionConfig.agent_data_commission_percent || 2}% cashback`}
                >
                  {reconciling ? 'Scanning...' : 'Reconcile Past Agent Cashback'}
                </Button>
                <Button
                  onClick={handleSaveCommission}
                  disabled={savingCommission}
                  className="rounded-xl h-10 px-5 font-bold shadow-sm"
                >
                  {savingCommission ? 'Saving...' : 'Save Commission Rules'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>


      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/20 pb-4 pt-5 px-5">
              <CardTitle className="text-lg">Service Toggles</CardTitle>
              <CardDescription className="mt-1">Enable or disable core services on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {[
                ['data', 'Data Plans'],
                ['airtime', 'Airtime Topup'],
                ['electricity', 'Electricity Tokens'],
                ['cable', 'Cable TV Subscriptions'],
                ['exam', 'Exam PINs'],
              ].map(([serviceKey, label]) => {
                const enabled = serviceToggles[serviceKey] ?? true;
                return (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/50 p-4 shadow-sm">
                    <div className="font-semibold text-foreground tracking-tight">{label}</div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={enabled ? 'enabled' : 'disabled'} />
                      <Button 
                        variant={enabled ? 'secondary' : 'default'}
                        size="sm" 
                        className="h-8 rounded-xl"
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
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/20 pb-4 pt-5 px-5">
              <CardTitle className="text-lg">Provider Status</CardTitle>
              <CardDescription className="mt-1">Operational indicators from available backend analytics.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/50 bg-background/50 p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Success</div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-green-500">{Number(analytics?.api_success || 0).toLocaleString('en-NG')}</div>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/50 p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API Failed</div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-red-500">{Number(analytics?.api_failed || 0).toLocaleString('en-NG')}</div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/50 p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing Rules Loaded</div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">{pricingRules.length}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-secondary/20 pb-5 pt-6 px-6">
            <div>
              <CardTitle className="text-xl">Service Margins</CardTitle>
              <CardDescription className="mt-1">Configure profit margins for transactions. Margins can be fixed amounts or percentages.</CardDescription>
            </div>
            <Button 
              className="rounded-xl"
              onClick={() => {
                setEditingMarginFor({ network: 'mtn', role: 'user', margin: 0, margin_type: 'fixed', isNewRule: true });
                setMarginInput('0');
                setMarginTypeInput('fixed');
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Rule
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <PremiumDataTable
              data={pricingRules}
              columns={marginColumns}
              emptyMessage={loading ? 'Loading margins...' : 'No margin rules defined yet.'}
              hideSearch={true}
              serverPagination={false}
            />
          </CardContent>
        </Card>
      </motion.div>


      <div className="grid gap-6 xl:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/20 pb-4 pt-5 px-5">
              <CardTitle className="text-lg">Referral Reward Policy</CardTitle>
              <CardDescription className="mt-1">Current first-deposit referral reward rate.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reward Percentage</label>
                <Input value="2%" readOnly className="h-11 rounded-xl bg-background/50 font-semibold" />
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">This value is shown for visibility. Persisted updates require backend settings endpoint.</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-secondary/20 pb-4 pt-5 px-5">
              <CardTitle className="text-lg">Support & Maintenance</CardTitle>
              <CardDescription className="mt-1">Official support channels and maintenance guardrails.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Support Email</label>
                <Input value="mmtechglobe@gmail.com" readOnly className="h-11 rounded-xl bg-background/50 font-semibold" />
              </div>
              <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100 flex items-start gap-3 shadow-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-relaxed font-medium">Maintenance mode is currently a protected placeholder. Enable only when backend maintenance control exists.</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-secondary/20 pb-4 pt-5 px-5">
            <CardTitle className="text-lg">Admin Profile & Security</CardTitle>
            <CardDescription className="mt-1">Access role, account identity, and security visibility.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/50 bg-background/50 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</div>
                <div className="mt-2 font-medium text-foreground">{profile?.full_name || 'Admin'}</div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/50 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</div>
                <div className="mt-2 font-medium text-foreground truncate" title={profile?.email}>{profile?.email || '—'}</div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/50 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</div>
                <div className="mt-2 font-medium text-foreground capitalize">{String(profile?.role || 'user')}</div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/50 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Refresh</div>
                <div className="mt-2 font-medium text-foreground text-sm">{formatDateTime(new Date())}</div>
              </div>
            </div>
            
            <div className="mt-5 rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm text-muted-foreground flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brand shrink-0" />
              <span className="font-medium">Secrets are intentionally hidden from this UI. Use secured backend environment management for keys and provider credentials.</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {editingMarginFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl rounded-3xl border-border/50 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-5 pt-6 px-6 bg-secondary/10">
                  <CardTitle className="text-xl">Edit Service Margin</CardTitle>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary/50 hover:bg-secondary" onClick={() => setEditingMarginFor(null)} disabled={isSavingMargin}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 px-6 space-y-6">
                  {editingMarginFor.isNewRule ? (
                    <div className="space-y-4 p-4 rounded-2xl bg-secondary/30 border border-border/50">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service / Network</label>
                        <select
                          value={editingMarginFor.network}
                          onChange={(e) => setEditingMarginFor({ ...editingMarginFor, network: e.target.value })}
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/50"
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
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Role</label>
                        <select
                          value={editingMarginFor.role}
                          onChange={(e) => setEditingMarginFor({ ...editingMarginFor, role: e.target.value })}
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/50"
                          disabled={isSavingMargin}
                        >
                          <option value="user">Normal User</option>
                          <option value="reseller">Agent / Reseller</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Service/Network:</span>
                        <span className="font-bold text-foreground uppercase">{String(editingMarginFor.network)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">User Role:</span>
                        <span className="font-bold text-foreground capitalize">{editingMarginFor.role}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Margin Type</label>
                      <select
                        value={marginTypeInput}
                        onChange={(e) => setMarginTypeInput(e.target.value)}
                        className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/50"
                        disabled={isSavingMargin}
                      >
                        <option value="fixed">Fixed Amount (₦)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Margin Value</label>
                      <Input
                        type="number"
                        value={marginInput}
                        onChange={(e) => setMarginInput(e.target.value)}
                        disabled={isSavingMargin}
                        className="h-11 rounded-xl bg-background"
                      />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {marginTypeInput === 'percentage' 
                          ? 'The percentage of the base price to add as profit.' 
                          : 'The flat amount in Naira to add on top of the provider cost.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <div className="flex justify-end gap-3 p-6 border-t border-border/50 bg-secondary/10">
                  <Button variant="ghost" className="h-11 px-6 rounded-xl" onClick={() => setEditingMarginFor(null)} disabled={isSavingMargin}>
                    Cancel
                  </Button>
                  <Button className="h-11 px-6 rounded-xl" onClick={handleSaveMargin} disabled={isSavingMargin}>
                    {isSavingMargin ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSavingMargin ? 'Saving...' : 'Save Margin'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
