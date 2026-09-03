'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { PremiumReceipt } from '@/components/service-ui';

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

const meterTypes = ['prepaid', 'postpaid'];

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

  const phoneError = cleanPhone && !validNigerianPhone(phone) ? 'Enter a valid Nigerian phone number.' : '';
  const meterError = meterNumber && cleanMeter.length < 5 ? 'Enter a valid meter number.' : '';
  const amountError = amount && (!Number.isFinite(parsedAmount) || parsedAmount <= 0) ? 'Enter a valid amount.' : '';
  const canSubmit = Boolean(
    disco && meterType && cleanMeter && cleanPhone && !phoneError && !meterError && Number.isFinite(parsedAmount) && parsedAmount > 0 && !busy
  );

  const lookupReady = false;

  const submit = async () => {
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
    } catch (err) {
      setMessage(err?.message || 'Unable to process electricity payment right now.');
    } finally {
      setBusy(false);
    }
  };

  const summaryDisco = meterLabel(disco) || '—';

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Services"
        title="Electricity"
        description="Pay electricity bills with meter details, amount, and a clean wallet-funded checkout flow."
        actions={
          <Button variant="secondary" onClick={load} className="border-border bg-card text-muted-foreground hover:bg-secondary">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Pay electricity bill</CardTitle>
            <CardDescription>Select disco, meter type, and payment details before checkout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="axis-label">Disco / Provider</div>
                <select
                  value={disco}
                  onChange={(e) => setDisco(e.target.value)}
                  className="flex h-11 w-full rounded-2xl border border-border bg-input px-4 py-2 text-sm text-foreground outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                >
                  {!discos.length ? <option value="">Loading providers...</option> : null}
                  {discos.map((item) => (
                    <option key={item} value={item}>
                      {meterLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="axis-label">Meter type</div>
                <div className="grid grid-cols-2 gap-2">
                  {meterTypes.map((item) => {
                    const active = meterType === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setMeterType(item)}
                        className={cn(
                          'rounded-2xl border px-4 py-3 text-sm font-medium transition',
                          active
                            ? 'border-primary/35 bg-primary/10 text-foreground'
                            : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        {meterLabel(item)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="axis-label">Meter number</div>
                <Input value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} placeholder="Enter meter number" />
                <p className={cn('text-xs', meterError ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>
                  {meterError || 'Use the meter number exactly as registered.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="axis-label">Phone number</div>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="08012345678" />
                <p className={cn('text-xs', phoneError ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>
                  {phoneError || 'Used for provider notifications.'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="axis-label">Amount (NGN)</div>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="5000" />
              <p className={cn('text-xs', amountError ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>
                {amountError || 'Enter the bill amount to charge your wallet.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="sticky top-6 h-fit">
          <PremiumReceipt
            title="Electricity bill payment"
            items={[
              { label: 'Disco', value: summaryDisco },
              { label: 'Meter type', value: meterLabel(meterType) },
              { label: 'Meter number', value: cleanMeter || '—' },
              { label: 'Amount', value: `₦${Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatMoney(parsedAmount) : '0.00'}` },
              { label: 'Wallet balance', value: `₦${formatMoney(wallet?.balance || 0)}` }
            ]}
            total={Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatMoney(parsedAmount) : '0.00'}
            totalLabel="Total Cost"
            buttonText="Pay Electricity"
            onConfirm={submit}
            isBusy={busy}
            disabled={!canSubmit}
            errorMessage={message}
          />
        </div>
      </div>
    </div>
  );
}
