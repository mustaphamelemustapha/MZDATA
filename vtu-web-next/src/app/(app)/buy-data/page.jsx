'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, RefreshCw, Wallet, Plus, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { NetworkCard, PremiumReceipt, PlanCard } from '@/components/service-ui';
import { TransactionReceiptModal } from '@/components/transaction-receipt-modal';
import { buildTransactionReceipt, downloadReceipt, shareReceipt } from '@/lib/receipt';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [errorMessage, setErrorMessage] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const walletRes = await apiFetch('/wallet/me');
      setWallet(walletRes);
    } catch (_) {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, walletRes] = await Promise.allSettled([
        apiFetch('/data/plans'),
        apiFetch('/wallet/me'),
      ]);
      
      let list = [];
      if (plansRes.status === 'fulfilled') {
        const val = plansRes.value;
        list = Array.isArray(val) ? val : (val?.items || val?.data || val?.plans || []);
      } else {
        console.error('Data plans fetch error:', plansRes.reason);
      }
      
      if (!list || list.length === 0) {
        try {
          const adminPlans = await apiFetch('/admin/data-plans');
          if (Array.isArray(adminPlans) && adminPlans.length > 0) {
            list = adminPlans
              .filter(p => p.is_active !== false)
              .map(p => ({
                ...p,
                price: p.display_price ?? p.base_price ?? 0,
              }));
          }
        } catch (_) {}
      }
      setPlans(Array.isArray(list) ? list : []);
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

  useEffect(() => {
    if (planGroups.length > 0) {
      const currentGroup = planGroups.find((group) => group.network === activeNetwork);
      if (!currentGroup || !currentGroup.plans.length) {
        const firstWithPlans = planGroups.find((group) => group.plans && group.plans.length > 0);
        if (firstWithPlans) {
          setActiveNetwork(firstWithPlans.network);
        }
      }
    }
  }, [activeNetwork, planGroups]);

  const activeGroup = useMemo(() => {
    return planGroups.find((group) => group.network === activeNetwork) || null;
  }, [activeNetwork, planGroups]);

  const visiblePlans = useMemo(() => {
    return activeGroup?.plans || [];
  }, [activeGroup]);

  const walletBalance = Number(wallet?.balance ?? 0);
  const summaryNetwork = selected?.network || activeNetwork;
  const summaryPlanName = selected?.plan_name || selected?.plan_code || '—';
  const summaryPrice = Number(selected?.price || 0);
  const normalizedPhone = phoneDigits(phone);
  const phoneError = normalizedPhone && !isValidNigerianPhone(phone) ? 'Enter a valid Nigerian phone number.' : '';
  const isBalanceInsufficient = Boolean(selected && walletBalance < summaryPrice);
  const canSubmit = Boolean(selected && normalizedPhone && !phoneError && !busy && !isBalanceInsufficient);

  const purchase = async () => {
    if (!selected || !normalizedPhone || phoneError) return;
    if (isBalanceInsufficient) {
      setErrorMessage(`Insufficient wallet balance. You need ₦${formatMoney(summaryPrice)} but have ₦${formatMoney(walletBalance)}. Please fund your wallet.`);
      return;
    }
    setBusy(true);
    setErrorMessage('');
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

      if (res?.status === 'failed') {
        throw new Error(res?.message || 'Data purchase could not be delivered.');
      }

      const rec = buildTransactionReceipt({
        service: `${networkLabel(selected.network)} Data`,
        status: 'success',
        message: res?.message || 'Your data bundle has been successfully delivered.',
        amount: summaryPrice,
        reference: res?.reference || `DATA-${Date.now()}`,
        phone: normalizedPhone,
        customer: normalizedPhone,
        meta: [
          { label: 'Network', value: networkLabel(selected.network) },
          { label: 'Plan Name', value: selected.plan_name || selected.data_size },
          { label: 'Recipient Phone', value: normalizedPhone },
          { label: 'Amount Paid', value: `₦${formatMoney(summaryPrice)}` },
          { label: 'Status', value: 'Delivered / Successful' },
          { label: 'Payment Method', value: 'Wallet Balance' },
        ],
      });
      setReceipt(rec);
      setShowReceiptModal(true);
      loadWallet();
    } catch (err) {
      setErrorMessage(err?.message || 'Data purchase failed. Please check your balance.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-40px)] bg-background px-4 py-5 text-foreground md:-mx-6 md:-my-5 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <div className="space-y-6 pb-28 md:pb-8">
        {/* Header with Balance & Fund Button */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="axis-label text-muted-foreground text-xs font-semibold tracking-wider uppercase">Services</div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Buy Data</h1>
            <p className="max-w-xl text-xs md:text-sm text-muted-foreground">
              Instant automated data bundles for MTN, Airtel, Glo, and 9mobile.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Wallet Balance Pill */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card/60 px-4 py-2.5 shadow-sm backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Available Balance</span>
                <span className="text-base font-bold text-foreground">₦{formatMoney(walletBalance)}</span>
              </div>
              <Link
                href="/wallet"
                className="ml-2 inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Fund
              </Link>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => load()}
              className="rounded-xl border-border bg-card/50 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="relative overflow-hidden border-border/40 bg-card/40 backdrop-blur-2xl shadow-xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[6rem] -z-10 pointer-events-none" />
            <CardContent className="relative z-10 space-y-6 p-5 md:space-y-8 md:p-8">
              {/* Select Network */}
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Select network</div>
                    <div className="mt-1 text-sm text-muted-foreground">Choose your network to see all active plans.</div>
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
                        onClick={() => {
                          setActiveNetwork(tab.key);
                          setSelected(null);
                        }}
                      />
                    );
                  })}
                </div>
              </section>

              {/* Recipient Phone */}
              <section className="space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Recipient phone number</div>
                  <div className="mt-1 text-sm text-muted-foreground">Enter the 11-digit mobile number to credit.</div>
                </div>
                <div className="relative group">
                  <Input
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    disabled={busy}
                    className="h-[52px] md:h-14 bg-background/50 backdrop-blur-sm text-lg font-mono tracking-wider border-border/60 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl"
                  />
                  <div className="absolute inset-0 -z-10 bg-primary/5 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
                {phoneError ? (
                  <p className="text-xs font-medium text-rose-500 dark:text-rose-400">{phoneError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Format: 080... or 234...</p>
                )}
              </section>

              {/* Select Plan */}
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Select data bundle</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Pick your preferred data volume and validity.
                    </div>
                  </div>
                  <Badge className="border-border bg-secondary text-muted-foreground">
                    {visiblePlans.length} plan{visiblePlans.length === 1 ? '' : 's'}
                  </Badge>
                </div>

                {loading ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="h-28 animate-pulse rounded-[24px] border border-border/60 bg-secondary/50" />
                    ))}
                  </div>
                ) : null}

                {!loading && !visiblePlans.length ? (
                  <div className="rounded-[22px] border border-dashed border-border bg-secondary px-4 py-10 text-center text-sm text-muted-foreground">
                    No bundles are enabled for {networkLabel(activeNetwork)} right now.
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
                          onClick={() => {
                            setSelected(plan);
                            if (errorMessage) setErrorMessage('');
                          }}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </section>
            </CardContent>
          </Card>

          {/* Sticky Summary / Checkout Sidebar */}
          <div className="sticky top-6 h-fit space-y-4">
            <PremiumReceipt
              title={`${networkLabel(summaryNetwork)} Data`}
              items={[
                { label: 'Network', value: networkLabel(summaryNetwork) },
                { label: 'Plan', value: summaryPlanName },
                { label: 'Recipient', value: phone.trim() || '—' },
                { label: 'Your Balance', value: `₦${formatMoney(walletBalance)}` },
              ]}
              total={formatMoney(summaryPrice || 0)}
              totalLabel="Total Cost"
              buttonText={
                isBalanceInsufficient
                  ? `Insufficient Balance (₦${formatMoney(walletBalance)})`
                  : 'Confirm & Purchase'
              }
              onConfirm={purchase}
              isBusy={busy}
              disabled={!canSubmit}
              errorMessage={errorMessage}
            />

            {/* Prominent Insufficient Balance Warning Card with 1-Click Fund Button */}
            {isBalanceInsufficient && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-[24px] border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">Insufficient Balance</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You need <span className="font-bold text-foreground">₦{formatMoney(summaryPrice - walletBalance)}</span> more to purchase this bundle.
                    </p>
                  </div>
                </div>

                <Link
                  href="/wallet"
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition active:scale-[0.98]"
                >
                  <Wallet className="h-4 w-4" />
                  Fund Wallet to Complete Order
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
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
          {isBalanceInsufficient ? (
            <Link
              href="/wallet"
              className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white shadow-lg shadow-amber-600/25 hover:bg-amber-700 transition"
            >
              <Wallet className="h-4 w-4" />
              Fund (₦{formatMoney(summaryPrice - walletBalance)} Needed)
            </Link>
          ) : (
            <Button
              className="h-12 shrink-0 rounded-xl bg-primary px-5 text-primary-foreground shadow-[0_12px_24px_rgba(249,115,22,0.18)] transition hover:bg-primary/90 active:scale-[0.98]"
              onClick={purchase}
              disabled={!canSubmit}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Buy Data
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Processing / Ongoing Transaction Loading Overlay */}
      <AnimatePresence>
        {busy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-sm rounded-[32px] border border-border/60 bg-card p-7 shadow-2xl text-center space-y-5"
            >
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold tracking-tight text-foreground">Processing Data Purchase</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Delivering <span className="font-semibold text-foreground">{summaryPlanName}</span> to{' '}
                  <span className="font-semibold text-foreground font-mono">{normalizedPhone}</span>...
                </p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-3 text-[11px] font-medium text-muted-foreground flex items-center justify-center gap-1.5 border border-border/40">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>256-bit encrypted telecom routing. Please hold on.</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beautiful Success & Order Receipt Modal */}
      <TransactionReceiptModal
        open={showReceiptModal}
        receipt={receipt}
        onClose={() => {
          setShowReceiptModal(false);
          setSelected(null);
          setPhone('');
        }}
        onDownload={(node) => downloadReceipt(receipt, node)}
        onShare={(node) => shareReceipt(receipt, node)}
      />
    </div>
  );
}
