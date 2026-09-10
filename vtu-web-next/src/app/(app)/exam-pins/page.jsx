'use client';

import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, RefreshCw, Info } from 'lucide-react';
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
  if (!value) return true;
  const digits = normalizePhone(value);
  return /^0[789][01]\d{8}$/.test(digits) || /^234[789][01]\d{8}$/.test(digits);
}

function titleCase(value) {
  return String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());
}

const unitPrice = 2000;

export default function ExamPinsPage() {
  const [catalog, setCatalog] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [exam, setExam] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [phone, setPhone] = useState('');

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

  const examTypes = stringifyList(catalog?.exam_types);

  useEffect(() => {
    if (!exam && examTypes.length) setExam(examTypes[0]);
  }, [exam, examTypes]);

  const qty = Number.parseInt(quantity || '0', 10);
  const cleanPhone = normalizePhone(phone);
  
  const phoneError = cleanPhone && !validNigerianPhone(phone) ? 'Enter a valid Nigerian phone number.' : '';
  const quantityError = quantity && (!Number.isFinite(qty) || qty < 1 || qty > 10) ? 'Quantity must be between 1 and 10.' : '';
  const total = Number.isFinite(qty) && qty > 0 ? qty * unitPrice : 0;

  const canSubmit = Boolean(exam && Number.isFinite(qty) && qty >= 1 && qty <= 10 && !phoneError && !quantityError && !busy);

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setMessage('');
    try {
      const res = await apiFetch('/services/exam/purchase', {
        method: 'POST',
        body: JSON.stringify({
          exam,
          quantity: qty,
          phone_number: cleanPhone || null,
        }),
      });
      const pins = Array.isArray(res?.pins) && res.pins.length ? ` Pins: ${res.pins.join(', ')}` : '';
      setMessage(`Exam PIN purchase submitted. Reference: ${res?.reference || '—'}.${pins}`);
      setQuantity('1');
    } catch (err) {
      setMessage(err?.message || 'Unable to purchase exam PINs right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-40px)] bg-background px-4 py-5 text-foreground md:-mx-6 md:-my-5 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <div className="mx-auto max-w-6xl space-y-6 pb-28 md:pb-8 pt-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Buy Exam PINs</h1>
            <p className="text-[15px] text-muted-foreground">
              Purchase result checker PINs for WAEC, NECO, NABTEB, or JAMB.
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
              <GraduationCap className="w-64 h-64" />
            </div>

            <form onSubmit={submit} className="relative z-10 space-y-6 max-w-2xl">
              
              <PremiumSelect
                label="Exam Body"
                required
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                options={examTypes.map(item => ({ value: item, label: titleCase(item) }))}
                placeholder="Loading exam types..."
                disabled={loading || !examTypes.length}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-foreground/90">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputMode="numeric"
                    placeholder="1"
                    disabled={loading}
                    className={cn(
                      "h-[52px] w-full rounded-xl border-border bg-card px-4 text-[15px] font-medium text-foreground transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
                      quantityError && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                    )}
                  />
                  {quantityError && (
                    <p className="text-[12.5px] font-medium text-rose-500 flex items-center gap-1.5 mt-1.5">
                      <Info className="w-3.5 h-3.5" />
                      {quantityError}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-foreground/90">
                    Amount (Auto-calculated)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[15px] font-semibold text-muted-foreground">₦</span>
                    <Input
                      value={formatMoney(total)}
                      readOnly
                      disabled
                      className="h-[52px] w-full rounded-xl border-border bg-muted/50 pl-8 pr-4 text-[16px] font-semibold text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-semibold text-foreground/90">
                    Phone number (Optional)
                  </label>
                  <div className="text-[11px] text-muted-foreground">
                    Bal: ₦{formatMoney(wallet?.balance || 0)}
                  </div>
                </div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="08012345678"
                  disabled={loading}
                  className={cn(
                    "h-[52px] w-full rounded-xl border-border bg-card px-4 text-[15px] font-medium text-foreground transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
                    phoneError && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                  )}
                />
                {phoneError && (
                  <p className="text-[12.5px] font-medium text-rose-500 flex items-center gap-1.5 mt-1.5">
                    <Info className="w-3.5 h-3.5" />
                    {phoneError}
                  </p>
                )}
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
                {busy ? 'Processing...' : `Pay ₦${formatMoney(total)}`}
              </Button>
            </form>
          </div>

          {/* Instructions Sidebar */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm sticky top-6">
            <div className="bg-secondary/50 border-b border-border p-4 text-center">
              <h3 className="font-semibold text-[15px] text-[#2563eb] dark:text-blue-400">How to Use Result Pins</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-4 rounded-xl border bg-card/50">
                <div className="font-semibold text-[14px] text-foreground mb-1">WAEC</div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Go to <a href="https://www.waecdirect.org" target="_blank" rel="noreferrer" className="text-primary hover:underline">waecdirect.org</a>. Enter your Exam Number, select your Exam Year and Type. Enter the Serial Number and PIN generated here to view your result.
                </p>
              </div>
              
              <div className="p-4 rounded-xl border bg-card/50">
                <div className="font-semibold text-[14px] text-foreground mb-1">NECO</div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Go to <a href="https://result.neco.gov.ng" target="_blank" rel="noreferrer" className="text-primary hover:underline">result.neco.gov.ng</a>. Select Exam Year and Type, enter the PIN generated here and your Registration Number.
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Your generated PINs will always be available in your transaction history. You can view them anytime.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
