'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, RefreshCw, Database, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const NETWORK_ORDER = ['mtn', 'airtel', 'glo', '9mobile'];

function normalizeNetwork(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.includes('9mobile') || raw.includes('etisalat') || raw === '9') return '9mobile';
  if (raw.includes('mtn')) return 'mtn';
  if (raw.includes('airtel')) return 'airtel';
  if (raw.includes('glo') || raw.includes('globacom')) return 'glo';
  return raw;
}

function networkLabel(value) {
  const normalized = normalizeNetwork(value);
  if (!normalized) return 'Other';
  if (normalized === '9mobile') return '9mobile';
  return normalized.toUpperCase();
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function isValidNigerianPhone(value) {
  const digits = phoneDigits(value);
  return /^0[789][01]\d{8}$/.test(digits) || /^234[789][01]\d{8}$/.test(digits);
}

function sanitizePlanText(value) {
  const text = String(value ?? '');
  if (!text.trim()) return '';
  return text
    .replace(/\(\s*direct\s+data\s*\)/gi, '')
    .replace(/\bdirect\s+data\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\-\s*/g, '')
    .replace(/\s*\-$/g, '')
    .trim();
}

function planPrice(plan) {
  const value = Number.parseFloat(plan?.price ?? '');
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function normalizePlan(raw) {
  const plan = { ...(raw || {}) };
  plan.plan_name = sanitizePlanText(plan.plan_name);
  plan.data_size = sanitizePlanText(plan.data_size);
  plan.network = normalizeNetwork(plan.network || plan.provider || plan.plan_code || '');
  return plan;
}

function curatePlans(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const normalized = normalizePlan(row);
    const key = normalized.network || 'other';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(normalized);
  }

  const curatedGroups = [];
  const keys = [...NETWORK_ORDER, ...Array.from(grouped.keys()).filter((key) => !NETWORK_ORDER.includes(key) && key !== 'other'), 'other'];
  
  for (const networkKey of keys) {
    const items = grouped.get(networkKey);
    if (!items || !items.length) continue;
    
    curatedGroups.push({
      network: networkKey,
      plans: [...items].sort((a, b) => planPrice(a) - planPrice(b)),
    });
  }
  return curatedGroups;
}

// Reusable Select Component to match modern aesthetic
const PremiumSelect = ({ label, helperText, value, onChange, options, placeholder, required = false, disabled = false }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[13px] font-semibold text-foreground/90">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "w-full h-[52px] appearance-none rounded-xl border border-border bg-card px-4 pr-10 text-[15px] font-medium text-foreground transition-all duration-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
            disabled && "opacity-60 cursor-not-allowed bg-muted/50",
            !value && "text-muted-foreground"
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <ChevronDown className="h-5 w-5 text-muted-foreground/60" />
        </div>
      </div>
      {helperText && <p className="text-[12.5px] text-muted-foreground mt-1.5">{helperText}</p>}
    </div>
  );
};

export default function BuyDataPage() {
  const [plans, setPlans] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState('');
  const [activeDataType, setActiveDataType] = useState('');
  const [selectedPlanCode, setSelectedPlanCode] = useState('');
  const [phone, setPhone] = useState('');
  const [bypassValidator, setBypassValidator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, walletRes] = await Promise.allSettled([
        apiFetch('/data/plans'),
        apiFetch('/wallet/me'),
      ]);
      
      if (plansRes.status === 'fulfilled') {
        const val = plansRes.value;
        const list = Array.isArray(val) ? val : (val?.items || val?.data || val?.plans || []);
        setPlans(Array.isArray(list) ? list : []);
      }
      
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const planGroups = useMemo(() => curatePlans(plans), [plans]);

  // Derived states
  const activeGroup = useMemo(() => {
    return planGroups.find((group) => group.network === activeNetwork) || null;
  }, [activeNetwork, planGroups]);

  const availableDataTypes = useMemo(() => {
    if (!activeGroup || !activeGroup.plans) return [];
    const types = new Set();
    for (const p of activeGroup.plans) {
      types.add(p.data_type || 'ALL');
    }
    return Array.from(types).sort();
  }, [activeGroup]);

  // Reset dependent fields when parent changes
  useEffect(() => {
    setActiveDataType('');
    setSelectedPlanCode('');
  }, [activeNetwork]);

  useEffect(() => {
    setSelectedPlanCode('');
  }, [activeDataType]);

  const visiblePlans = useMemo(() => {
    if (!activeGroup) return [];
    if (!activeDataType) return [];
    return activeGroup.plans.filter((p) => (p.data_type || 'ALL') === activeDataType);
  }, [activeGroup, activeDataType]);

  const selectedPlan = useMemo(() => {
    return visiblePlans.find(p => p.plan_code === selectedPlanCode) || null;
  }, [visiblePlans, selectedPlanCode]);

  const summaryPrice = selectedPlan?.price || 0;
  const normalizedPhone = phoneDigits(phone);
  const phoneError = normalizedPhone && !bypassValidator && !isValidNigerianPhone(phone) 
    ? 'Enter a valid Nigerian phone number.' 
    : '';
  const canSubmit = Boolean(selectedPlan && normalizedPhone && (!phoneError || bypassValidator) && !busy);

  const purchase = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setMessage('');
    try {
      const payload = {
        plan_code: selectedPlan.plan_code,
        phone_number: normalizedPhone,
        network: selectedPlan.network,
      };
      const res = await apiFetch('/data/purchase', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage(`${res?.message || 'Purchase submitted.'} Ref: ${res?.reference || '—'}`);
      setPhone('');
      setSelectedPlanCode('');
    } catch (err) {
      setMessage(err?.message || 'Purchase failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-40px)] bg-background px-4 py-5 text-foreground md:-mx-6 md:-my-5 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <div className="mx-auto max-w-6xl space-y-6 pb-28 md:pb-8 pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Buy Data Plan</h1>
            <p className="text-[15px] text-muted-foreground">
              Select your network, choose a plan, and get instantly topped up.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => load()}
            disabled={loading}
            className="h-10 rounded-full border-border bg-transparent hover:bg-secondary"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4 text-muted-foreground', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_380px] items-start">
          {/* Form Column */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Database className="w-64 h-64" />
            </div>

            <form onSubmit={purchase} className="relative z-10 space-y-6 max-w-2xl">
              
              <PremiumSelect
                label="Network"
                required
                value={activeNetwork}
                onChange={(e) => setActiveNetwork(e.target.value)}
                options={planGroups.map(g => ({ value: g.network, label: networkLabel(g.network) }))}
                placeholder="--------"
                disabled={loading}
              />

              <PremiumSelect
                label="Data type"
                value={activeDataType}
                onChange={(e) => setActiveDataType(e.target.value)}
                options={availableDataTypes.map(t => ({ value: t, label: t === 'ALL' ? 'General' : t }))}
                placeholder="--------"
                disabled={!activeNetwork || loading}
                helperText="Select Plan Type e.g., SME, GIFTING or CORPORATE GIFTING"
              />

              <PremiumSelect
                label="Data Plan"
                required
                value={selectedPlanCode}
                onChange={(e) => setSelectedPlanCode(e.target.value)}
                options={visiblePlans.map(p => ({ 
                  value: p.plan_code, 
                  label: `${p.plan_name} - ₦${formatMoney(planPrice(p))}` 
                }))}
                placeholder={visiblePlans.length === 0 && activeDataType ? "No plans available" : "--------"}
                disabled={!activeDataType || visiblePlans.length === 0 || loading}
              />

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-foreground/90">
                  Mobile number <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={loading}
                  className={cn(
                    "h-[52px] w-full rounded-xl border-border bg-card px-4 text-[15px] font-medium text-foreground transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
                    phoneError && !bypassValidator && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                  )}
                />
                {!bypassValidator && phoneError && (
                  <p className="text-[12.5px] font-medium text-rose-500 flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-foreground/90">Amount</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[15px] font-semibold text-muted-foreground">₦</span>
                  <Input
                    value={selectedPlan ? formatMoney(summaryPrice) : ''}
                    readOnly
                    className="h-[52px] w-full cursor-not-allowed rounded-xl border-border bg-muted/50 pl-8 pr-4 text-[16px] font-semibold text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={bypassValidator}
                  onClick={() => setBypassValidator(!bypassValidator)}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
                    bypassValidator 
                      ? "border-primary bg-primary text-primary-foreground" 
                      : "border-input bg-transparent text-transparent hover:border-primary/50"
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[3px]" />
                </button>
                <label 
                  className="text-[14px] font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setBypassValidator(!bypassValidator)}
                >
                  Bypass number validator
                </label>
              </div>

              {message && (
                <div className={cn(
                  "rounded-xl p-4 text-[14px] font-medium border",
                  message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                    ? "border-rose-200 bg-rose-500/10 text-rose-600 dark:border-rose-500/20 dark:text-rose-400"
                    : "border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/20 dark:text-emerald-400"
                )}>
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full h-[54px] rounded-xl bg-[#111827] text-white hover:bg-[#1f2937] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 text-[16px] font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {busy ? 'Processing...' : 'Buy Now'}
              </Button>
            </form>
          </div>

          {/* Balance Codes Sidebar */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm sticky top-6">
            <div className="bg-secondary/50 border-b border-border p-4 text-center">
              <h3 className="font-semibold text-[15px] text-[#2563eb] dark:text-blue-400">Codes for Data Balance:</h3>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { label: 'MTN [SME]', code: '*461*4# OR *323*3#', bg: 'bg-[#fff9e6] border-[#ffe48c] text-[#8a6b00]', darkBg: 'dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' },
                { label: 'MTN [SME2]', code: '*460*260#', bg: 'bg-[#fff9e6] border-[#ffe48c] text-[#8a6b00]', darkBg: 'dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' },
                { label: 'MTN [Corporate Gifting]', code: '*460*260# OR *323*1#', bg: 'bg-[#fff9e6] border-[#ffe48c] text-[#8a6b00]', darkBg: 'dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' },
                { label: 'MTN [Data Coupon]', code: '*323*1#', bg: 'bg-[#fff9e6] border-[#ffe48c] text-[#8a6b00]', darkBg: 'dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' },
                { label: '9mobile [Gifting]', code: '*228#', bg: 'bg-[#f3f4f6] border-[#d1d5db] text-[#4b5563]', darkBg: 'dark:bg-gray-500/10 dark:border-gray-500/20 dark:text-gray-400' },
                { label: 'Glo & Airtel', code: '*323#', bg: 'bg-[#fdf2f8] border-[#fbcfe8] text-[#be185d]', darkBg: 'dark:bg-pink-500/10 dark:border-pink-500/20 dark:text-pink-400' },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "px-4 py-3 rounded-xl border text-[14px] font-medium flex justify-between items-center gap-3",
                    item.bg, item.darkBg
                  )}
                >
                  <span className="opacity-90">{item.label}</span>
                  <span className="font-bold tracking-wide shrink-0">{item.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
