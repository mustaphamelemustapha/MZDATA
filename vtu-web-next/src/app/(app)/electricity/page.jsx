'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PremiumSelect } from '@/components/ui/premium-select';
import { cn } from '@/lib/utils';

function stringifyList(items) {
  return Array.isArray(items) ? items.map((item) => String(item || '').trim()).filter(Boolean) : [];
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function validNigerianPhone(value) {
  const digits = normalizePhone(value);
  return /^0[789][01]\d{8}$/.test(digits) || /^234[789][01]\d{8}$/.test(digits);
}

function meterLabel(value) {
  return String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());
}

export default function ElectricityPage() {
  const [catalog, setCatalog] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [disco, setDisco] = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [phone, setPhone] = useState('');
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

  const discos = stringifyList(catalog?.electricity_discos);

  useEffect(() => {
    if (!disco && discos.length) setDisco(discos[0]);
  }, [disco, discos]);

  const parsedAmount = Number.parseFloat(amount || '0');
  const cleanPhone = normalizePhone(phone);
  const cleanMeter = String(meterNumber || '').trim();

  const phoneError = cleanPhone && !bypassValidator && !validNigerianPhone(phone) 
    ? 'Enter a valid Nigerian phone number.' 
    : '';
  const meterError = meterNumber && cleanMeter.length < 5 
    ? 'Enter a valid meter number.' 
    : '';
  const amountError = amount && (!Number.isFinite(parsedAmount) || parsedAmount <= 0) 
    ? 'Enter a valid amount.' 
    : '';
    
  const canSubmit = Boolean(
    disco && meterType && cleanMeter && cleanPhone && (!phoneError || bypassValidator) && !meterError && Number.isFinite(parsedAmount) && parsedAmount > 0 && !busy
  );

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setMessage('');
    try {
      const res = await apiFetch('/services/electricity/purchase', {
        method: 'POST',
        body: JSON.stringify({
          disco,
          meter_type: meterType,
          meter_number: cleanMeter,
          phone_number: cleanPhone,
          amount: parsedAmount,
        }),
      });
      const tokenLine = res?.token ? ` Token: ${res.token}` : '';
      setMessage(`Electricity payment submitted. Reference: ${res?.reference || '—'}.${tokenLine}`);
      setAmount('');
      setMeterNumber('');
    } catch (err) {
      setMessage(err?.message || 'Unable to process electricity payment right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-40px)] bg-background px-4 py-5 text-foreground md:-mx-6 md:-my-5 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <div className="mx-auto max-w-6xl space-y-6 pb-28 md:pb-8 pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Pay Electricity Bill</h1>
            <p className="text-[15px] text-muted-foreground">
              Purchase tokens for prepaid meters or pay postpaid bills.
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
              <Lightbulb className="w-64 h-64" />
            </div>

            <form onSubmit={submit} className="relative z-10 space-y-6 max-w-2xl">
              
              <PremiumSelect
                label="Disco / Provider"
                required
                value={disco}
                onChange={(e) => setDisco(e.target.value)}
                options={discos.map(item => ({ value: item, label: meterLabel(item) }))}
                placeholder="Loading providers..."
                disabled={loading || !discos.length}
              />

              <PremiumSelect
                label="Meter Type"
                required
                value={meterType}
                onChange={(e) => setMeterType(e.target.value)}
                options={[
                  { value: 'prepaid', label: 'Prepaid' },
                  { value: 'postpaid', label: 'Postpaid' },
                ]}
                disabled={loading}
              />

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-foreground/90">
                  Meter number <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                  placeholder="Enter meter number"
                  disabled={loading}
                  className={cn(
                    "h-[52px] w-full rounded-xl border-border bg-card px-4 text-[15px] font-medium text-foreground transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
                    meterError && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                  )}
                />
                {meterError && (
                  <p className="text-[12.5px] font-medium text-rose-500 flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {meterError}
                  </p>
                )}
              </div>

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
                    placeholder="5000"
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
              <h3 className="font-semibold text-[15px] text-[#2563eb] dark:text-blue-400">How to Load Electricity Token</h3>
            </div>
            <div className="p-5 text-[14px] leading-relaxed text-muted-foreground space-y-4">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">1</div>
                <p>Ensure your prepaid meter is turned on and connected to power.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">2</div>
                <p>Enter the 20-digit token exactly as it appears on your receipt.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">3</div>
                <p>Press <strong className="text-foreground">"Enter"</strong> or the <strong className="text-foreground">Red Button</strong> (depending on your meter model) to accept the token.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">4</div>
                <p>If successful, the meter will display "ACCEPT" and the units will be added.</p>
              </div>
            </div>
            <div className="bg-amber-500/10 border-t border-amber-500/20 p-4">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Keep your token safe! It is tied exclusively to the meter number provided during purchase and cannot be used on another meter.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
