'use client';

import { useCallback, useEffect, useState } from 'react';
import { Phone, RefreshCw, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
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

const defaultRecentRecipients = ['08012345678', '08134567890', '09023456789'];

export default function AirtimePage() {
  const [catalog, setCatalog] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [network, setNetwork] = useState('');
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

  const networks = stringifyList(catalog?.airtime_networks).map((item) => item.toLowerCase());

  useEffect(() => {
    if (!network && networks.length) setNetwork(networks[0]);
  }, [network, networks]);

  const parsedAmount = Number.parseFloat(amount || '0');
  const cleanPhone = normalizePhone(phone);
  const phoneError = cleanPhone && !bypassValidator && !validNigerianPhone(phone) 
    ? 'Enter a valid Nigerian phone number.' 
    : '';
  const amountError = amount && (!Number.isFinite(parsedAmount) || parsedAmount <= 0) 
    ? 'Enter a valid airtime amount.' 
    : '';
  const canSubmit = Boolean(network && cleanPhone && (!phoneError || bypassValidator) && Number.isFinite(parsedAmount) && parsedAmount > 0 && !busy);

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setMessage('');
    try {
      const res = await apiFetch('/services/airtime/purchase', {
        method: 'POST',
        body: JSON.stringify({ network, phone_number: cleanPhone, amount: parsedAmount }),
      });
      setMessage(`Airtime request submitted. Reference: ${res?.reference || '—'}`);
      setAmount('');
      setPhone('');
    } catch (err) {
      setMessage(err?.message || 'Unable to complete airtime purchase right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-40px)] bg-background px-4 py-5 text-foreground md:-mx-6 md:-my-5 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <div className="mx-auto max-w-6xl space-y-6 pb-28 md:pb-8 pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Buy Airtime</h1>
            <p className="text-[15px] text-muted-foreground">
              Top up supported Nigerian networks instantly and securely.
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
              <Phone className="w-64 h-64" />
            </div>

            <form onSubmit={submit} className="relative z-10 space-y-6 max-w-2xl">
              
              <PremiumSelect
                label="Network"
                required
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                options={networks.map(n => ({ value: n, label: n === '9mobile' ? '9mobile' : n.toUpperCase() }))}
                placeholder="--------"
                disabled={loading}
              />

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-semibold text-foreground/90">
                    Mobile number <span className="text-rose-500">*</span>
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
                
                {/* Recent Recipients */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {defaultRecentRecipients.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => setPhone(entry)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-foreground/90">Amount <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[15px] font-semibold text-muted-foreground">₦</span>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="1000"
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

          {/* Airtime Balance Codes Sidebar */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm sticky top-6">
            <div className="bg-secondary/50 border-b border-border p-4 text-center">
              <h3 className="font-semibold text-[15px] text-[#2563eb] dark:text-blue-400">Airtime Balance & Borrow Codes:</h3>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { label: 'MTN Airtime Bal', code: '*310#', bg: 'bg-[#fff9e6] border-[#ffe48c] text-[#8a6b00]', darkBg: 'dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' },
                { label: 'MTN Borrow (XtraTime)', code: '*303#', bg: 'bg-[#fff9e6] border-[#ffe48c] text-[#8a6b00]', darkBg: 'dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' },
                { label: 'Airtel Airtime Bal', code: '*310#', bg: 'bg-[#fdf2f8] border-[#fbcfe8] text-[#be185d]', darkBg: 'dark:bg-pink-500/10 dark:border-pink-500/20 dark:text-pink-400' },
                { label: 'Airtel Borrow Credit', code: '*303#', bg: 'bg-[#fdf2f8] border-[#fbcfe8] text-[#be185d]', darkBg: 'dark:bg-pink-500/10 dark:border-pink-500/20 dark:text-pink-400' },
                { label: 'Glo Airtime Bal', code: '*310#', bg: 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857]', darkBg: 'dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' },
                { label: '9mobile Airtime Bal', code: '*232#', bg: 'bg-[#f3f4f6] border-[#d1d5db] text-[#4b5563]', darkBg: 'dark:bg-gray-500/10 dark:border-gray-500/20 dark:text-gray-400' },
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
