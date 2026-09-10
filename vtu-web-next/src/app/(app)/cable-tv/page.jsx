'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Tv2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PremiumSelect } from '@/components/ui/premium-select';
import { cn } from '@/lib/utils';

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function validNigerianPhone(value) {
  const digits = normalizePhone(value);
  return /^0[789][01]\d{8}$/.test(digits) || /^234[789][01]\d{8}$/.test(digits);
}

function providerOptions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const id = String(item?.id || '').trim().toLowerCase();
      const name = String(item?.name || id || '').trim();
      return id && name ? { id, name, packages: Array.isArray(item?.packages) ? item.packages : [] } : null;
    })
    .filter(Boolean);
}

function titleCase(value) {
  return String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());
}

export default function CableTvPage() {
  const [catalog, setCatalog] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [provider, setProvider] = useState('');
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [packageCode, setPackageCode] = useState('');
  const [amount, setAmount] = useState('');
  const [bypassValidator, setBypassValidator] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogRes, walletRes] = await Promise.allSettled([apiFetch('/services/catalog'), apiFetch('/wallet/me')]);
      if (catalogRes.status === 'fulfilled') setCatalog(catalogRes.value);
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const providers = useMemo(() => providerOptions(catalog?.cable_providers), [catalog?.cable_providers]);

  useEffect(() => {
    if (!provider && providers.length) setProvider(providers[0].id);
  }, [provider, providers]);

  const selectedProvider = providers.find((item) => item.id === provider) || null;
  const packageChoices = Array.isArray(selectedProvider?.packages) ? selectedProvider.packages : [];

  useEffect(() => {
    if (packageChoices.length > 0 && !packageCode) {
      const first = packageChoices[0];
      setPackageCode(String(first?.code || first?.id || '').trim());
    }
  }, [packageChoices, packageCode]);

  // When package code changes, auto-fill amount if the provider has a defined price
  useEffect(() => {
    if (packageChoices.length && packageCode) {
      const selectedPkg = packageChoices.find(p => String(p?.code || p?.id) === packageCode);
      if (selectedPkg && selectedPkg.price) {
        setAmount(String(selectedPkg.price));
      }
    }
  }, [packageChoices, packageCode]);

  const parsedAmount = Number.parseFloat(amount || '0');
  const cleanPhone = normalizePhone(phone);
  const cleanCard = String(smartcardNumber || '').trim();
  const cleanPackage = String(packageCode || '').trim();

  const phoneError = cleanPhone && !bypassValidator && !validNigerianPhone(phone) ? 'Enter a valid Nigerian phone number.' : '';
  const smartCardError = smartcardNumber && cleanCard.length < 5 ? 'Enter a valid smartcard or IUC number.' : '';
  const packageError = packageCode && !cleanPackage ? 'Enter a package code.' : '';
  const amountError = amount && (!Number.isFinite(parsedAmount) || parsedAmount <= 0) ? 'Enter a valid amount.' : '';
  
  const canSubmit = Boolean(
    provider && cleanCard && cleanPhone && cleanPackage && (!phoneError || bypassValidator) && !smartCardError && !packageError && Number.isFinite(parsedAmount) && parsedAmount > 0 && !busy
  );

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setMessage('');
    try {
      const res = await apiFetch('/services/cable/purchase', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          smartcard_number: cleanCard,
          phone_number: cleanPhone,
          package_code: cleanPackage,
          amount: parsedAmount,
        }),
      });
      setMessage(`Cable payment submitted. Reference: ${res?.reference || '—'}`);
      setSmartcardNumber('');
      setAmount('');
    } catch (err) {
      setMessage(err?.message || 'Unable to process cable payment right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-40px)] bg-background px-4 py-5 text-foreground md:-mx-6 md:-my-5 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <div className="mx-auto max-w-6xl space-y-6 pb-28 md:pb-8 pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Pay Cable TV</h1>
            <p className="text-[15px] text-muted-foreground">
              Renew DSTV, GOtv, or StarTimes subscriptions instantly.
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
              <Tv2 className="w-64 h-64" />
            </div>

            <form onSubmit={submit} className="relative z-10 space-y-6 max-w-2xl">
              
              <PremiumSelect
                label="Provider"
                required
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                options={providers.map(item => ({ value: item.id, label: item.name }))}
                placeholder="Loading providers..."
                disabled={loading || !providers.length}
              />

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-foreground/90">
                  Smartcard / IUC number <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={smartcardNumber}
                  onChange={(e) => setSmartcardNumber(e.target.value)}
                  placeholder="Enter smartcard or IUC number"
                  disabled={loading}
                  className={cn(
                    "h-[52px] w-full rounded-xl border-border bg-card px-4 text-[15px] font-medium text-foreground transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
                    smartCardError && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                  )}
                />
                {smartCardError && (
                  <p className="text-[12.5px] font-medium text-rose-500 flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {smartCardError}
                  </p>
                )}
              </div>

              {packageChoices.length > 0 ? (
                <PremiumSelect
                  label="Package Plan"
                  required
                  value={packageCode}
                  onChange={(e) => setPackageCode(e.target.value)}
                  options={packageChoices.map((item) => ({
                    value: String(item?.code || item?.id || '').trim(),
                    label: String(item?.name || item?.code || '').trim()
                  }))}
                  disabled={loading}
                />
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-foreground/90">
                    Package code <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={packageCode}
                    onChange={(e) => setPackageCode(e.target.value)}
                    placeholder="e.g. dstv-padi"
                    disabled={loading}
                    className={cn(
                      "h-[52px] w-full rounded-xl border-border bg-card px-4 text-[15px] font-medium text-foreground transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
                      packageError && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                    )}
                  />
                  {packageError && (
                    <p className="text-[12.5px] font-medium text-rose-500 flex items-center gap-1.5 mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {packageError}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-semibold text-foreground/90">
                    Phone number <span className="text-rose-500">*</span>
                  </label>
                  <div className="text-[11px] text-muted-foreground">
                    Bal: ₦{formatMoney(wallet?.balance || 0)}
                  </div>
                </div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="08012345678"
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
                <label className="text-[13px] font-semibold text-foreground/90">Amount <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[15px] font-semibold text-muted-foreground">₦</span>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="5400"
                    disabled={loading}
                    className={cn(
                      "h-[52px] w-full rounded-xl border-border bg-card pl-8 pr-4 text-[16px] font-semibold text-foreground transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
                      amountError && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                    )}
                  />
                </div>
                {amountError && (
                  <p className="text-[12.5px] font-medium text-rose-500 flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {amountError}
                  </p>
                )}
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
                  message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') || message.toLowerCase().includes('unable')
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
                {busy ? 'Processing...' : `Pay ₦${Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatMoney(parsedAmount) : '0.00'}`}
              </Button>
            </form>
          </div>

          {/* Instructions Sidebar */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm sticky top-6">
            <div className="bg-secondary/50 border-b border-border p-4 text-center">
              <h3 className="font-semibold text-[15px] text-[#2563eb] dark:text-blue-400">Customer Care & Support</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-4 rounded-xl border bg-card/50">
                <div className="font-semibold text-[14px] text-foreground mb-1">Clear DSTV/GOTV Errors</div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Send <strong className="text-foreground">RESET (Smartcard/IUC Number)</strong> to <strong className="text-foreground">30333</strong> (DSTV) or <strong className="text-foreground">4688</strong> (GOtv) to clear E16 errors after payment.
                </p>
              </div>
              
              <div className="p-4 rounded-xl border bg-card/50">
                <div className="font-semibold text-[14px] text-foreground mb-1">StarTimes Support</div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Dial <strong className="text-foreground">08172396860</strong> for StarTimes 24/7 customer support.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Always ensure your decoder is powered ON when making a payment to avoid delays in signal activation.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
