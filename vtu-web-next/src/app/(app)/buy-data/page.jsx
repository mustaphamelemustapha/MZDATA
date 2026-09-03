'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NetworkCard, PremiumReceipt, PlanCard } from '@/components/service-ui';

const NETWORK_ORDER = ['mtn', 'airtel', 'glo', '9mobile'];
const NETWORK_TABS = [
  { key: 'mtn', label: 'MTN' },
  { key: 'airtel', label: 'Airtel' },
  { key: 'glo', label: 'Glo' },
  { key: '9mobile', label: '9mobile' },
];

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

function networkLogoSrc(value) {
  const normalized = normalizeNetwork(value);
  if (normalized === 'mtn') return '/brand/networks/mtn.png';
  if (normalized === 'airtel') return '/brand/networks/airtel.png';
  if (normalized === 'glo') return '/brand/networks/glo.png';
  if (normalized === '9mobile') return '/brand/networks/9mobile.png';
  return '/brand/networks/mtn.png';
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

export default function BuyDataPage() {
  const [plans, setPlans] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNetwork, setActiveNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState(null);
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
  const totalPlansCount = useMemo(
    () => planGroups.reduce((total, group) => total + group.plans.length, 0),
    [planGroups]
  );

  useEffect(() => {
    if (activeNetwork !== 'all' && !planGroups.some((group) => group.network === activeNetwork)) {
      if (planGroups.length > 0) {
        // Only switch if the currently active network has no plans but others do
      }
    }
  }, [activeNetwork, planGroups]);

  const activeGroup = useMemo(() => {
    return planGroups.find((group) => group.network === activeNetwork) || null;
  }, [activeNetwork, planGroups]);

  const availableDataTypes = useMemo(() => {
    if (!activeGroup || !activeGroup.plans) return [];
    const types = new Set();
    for (const p of activeGroup.plans) {
      types.add(p.data_type || 'ALL');
    }
    // If 'ALL' is the only type, or if there's a mix, sort them logically. Let's just return sorted array.
    const arr = Array.from(types).sort();
    // Prioritize standard types if present, else just sort.
    return arr;
  }, [activeGroup]);

  const [activeDataType, setActiveDataType] = useState('');

  // When network changes or data types change, reset active data type to the first one
  useEffect(() => {
    if (activeDataType && !availableDataTypes.includes(activeDataType)) {
      setActiveDataType('');
    }
  }, [availableDataTypes, activeDataType]);

  const visiblePlans = useMemo(() => {
    if (!activeGroup) return [];
    if (!activeDataType) return [];
    return activeGroup.plans.filter((p) => (p.data_type || 'ALL') === activeDataType);
  }, [activeGroup, activeDataType]);

  const summaryNetwork = selected?.network || activeNetwork;
  const summaryPlanName = selected?.plan_name || selected?.plan_code || '—';
  const summaryPlanCode = selected?.plan_code || '—';
  const summaryPrice = selected?.price || 0;
  const normalizedPhone = phoneDigits(phone);
  const phoneError = normalizedPhone && !isValidNigerianPhone(phone) ? 'Enter a valid Nigerian phone number.' : '';
  const canSubmit = Boolean(selected && normalizedPhone && !phoneError && !busy);

  const purchase = async () => {
    if (!selected || !normalizedPhone || phoneError) return;
    setBusy(true);
    setMessage('');
    try {
      const payload = {
        plan_code: selected.plan_code,
        phone_number: normalizedPhone,
        network: selected.network,
      };
      const res = await apiFetch('/data/purchase', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage(`${res?.message || 'Purchase submitted.'} Ref: ${res?.reference || '—'}`);
    } catch (err) {
      setMessage(err?.message || 'Purchase failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-40px)] bg-background px-4 py-5 text-foreground md:-mx-6 md:-my-5 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <div className="space-y-6 pb-28 md:pb-8">
        <div className="space-y-2">
        <div className="axis-label text-muted-foreground">Services</div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Buy Data</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Affordable data bundles for MTN, Airtel, Glo, and 9mobile. All plans are synced in real-time from our providers.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => load()}
            className="border-border bg-secondary text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh plans
          </Button>
        </div>
      </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          <CardContent className="space-y-6 p-4 md:space-y-8 md:p-7">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Select network</div>
                  <div className="mt-2 text-sm text-muted-foreground">Choose your network to see all active plans.</div>
                </div>
                <Badge className="border-border bg-secondary text-muted-foreground">Live catalog</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {NETWORK_TABS.map((tab) => {
                  const isActive = activeNetwork === tab.key;
                  return (
                    <NetworkCard
                      key={tab.key}
                      networkKey={tab.key}
                      label={tab.label}
                      selected={isActive}
                      onClick={() => setActiveNetwork(tab.key)}
                    />
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Phone number</div>
                <div className="mt-2 text-sm text-muted-foreground">Enter the recipient phone number.</div>
              </div>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="08012345678"
                className="h-[52px] rounded-2xl border-border bg-input text-base text-foreground placeholder:text-muted-foreground focus:border-primary/45 focus:ring-amber-500/10 md:h-12"
              />
              {phoneError ? (
                <p className="text-xs font-medium text-rose-300">{phoneError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Format: 080... or 234...</p>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Select plan</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    All plans are managed via the Admin Dashboard.
                  </div>
                </div>
                <Badge className="border-border bg-secondary text-muted-foreground">
                  {visiblePlans.length} plan{visiblePlans.length === 1 ? '' : 's'}
                </Badge>
              </div>

              {availableDataTypes.length > 1 && (
                <div className="flex flex-wrap gap-2 pt-2 pb-1">
                  {availableDataTypes.map((type) => {
                    const isSelected = activeDataType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActiveDataType(type)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors border",
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80 hover:text-foreground"
                        )}
                      >
                        {type === 'ALL' ? 'General' : type}
                      </button>
                    );
                  })}
                </div>
              )}

              {loading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-32 animate-pulse rounded-[22px] border border-border bg-secondary" />
                  ))}
                </div>
              ) : null}

              {!loading && !visiblePlans.length ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                  <Database className="h-10 w-10 mb-3 opacity-20" />
                  {!activeDataType 
                    ? "Please select a Data Type Category above to view available plans."
                    : "No plans available for this network or category."}
                </div>
              ) : null}

              {!loading && visiblePlans.length ? (
                <div className="grid grid-cols-2 gap-3.5 md:gap-4 lg:grid-cols-3">
                  {visiblePlans.map((plan) => {
                    const isActive = selected?.plan_code === plan.plan_code;
                    return (
                      <PlanCard
                        key={plan.plan_code}
                        plan={plan}
                        selected={isActive}
                        onClick={() => setSelected(plan)}
                      />
                    );
                  })}
                </div>
              ) : null}
            </section>
          </CardContent>
        </Card>

        <div className="sticky top-6 h-fit">
          <PremiumReceipt
            title={`${networkLabel(summaryNetwork)} Data`}
            items={[
              { label: 'Network', value: networkLabel(summaryNetwork) },
              { label: 'Plan', value: summaryPlanName },
              { label: 'Recipient', value: phone.trim() || '—' },
            ]}
            total={formatMoney(summaryPrice || 0)}
            totalLabel="Total Cost"
            buttonText="Confirm & Purchase"
            onConfirm={purchase}
            isBusy={busy}
            disabled={!canSubmit}
            errorMessage={message}
          />
        </div>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 shadow-[0_-18px_40px_rgba(0,0,0,0.35)] backdrop-blur md:hidden"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
      >
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-muted-foreground">
              {selected ? summaryPlanName : 'Select a plan'}
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              ₦{formatMoney(summaryPrice || 0)}
            </div>
          </div>
          <Button
            className="h-12 shrink-0 rounded-xl bg-primary px-5 text-primary-foreground shadow-[0_12px_24px_rgba(249,115,22,0.18)] transition hover:bg-primary/90 active:scale-[0.98]"
            onClick={purchase}
            disabled={!canSubmit}
          >
            {busy ? 'Processing...' : 'Buy Data'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
