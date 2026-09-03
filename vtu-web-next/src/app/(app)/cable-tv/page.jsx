'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Tv2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { PremiumReceipt } from '@/components/service-ui';

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

  const parsedAmount = Number.parseFloat(amount || '0');
  const cleanPhone = normalizePhone(phone);
  const cleanCard = String(smartcardNumber || '').trim();
  const cleanPackage = String(packageCode || '').trim();

  const phoneError = cleanPhone && !validNigerianPhone(phone) ? 'Enter a valid Nigerian phone number.' : '';
  const smartCardError = smartcardNumber && cleanCard.length < 5 ? 'Enter a valid smartcard or IUC number.' : '';
  const packageError = packageCode && !cleanPackage ? 'Enter a package code.' : '';
  const amountError = amount && (!Number.isFinite(parsedAmount) || parsedAmount <= 0) ? 'Enter a valid amount.' : '';
  const canSubmit = Boolean(
    provider && cleanCard && cleanPhone && cleanPackage && !phoneError && !smartCardError && !packageError && Number.isFinite(parsedAmount) && parsedAmount > 0 && !busy
  );

  const lookupReady = false;

  const submit = async () => {
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
    } catch (err) {
      setMessage(err?.message || 'Unable to process cable payment right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Services"
        title="Cable TV"
        description="Renew DSTV, GOtv, or StarTimes subscriptions through the wallet with clean transaction records."
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
            <CardTitle>Pay Cable TV</CardTitle>
            <CardDescription>Choose provider, enter smartcard details, select package, and submit payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="axis-label">Provider</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {providers.map((item) => {
                  const active = provider === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProvider(item.id)}
                      className={cn(
                        'rounded-2xl border px-4 py-3 text-left text-sm font-medium transition',
                        active
                          ? 'border-primary/35 bg-primary/10 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      {item.name}
                    </button>
                  );
                })}
                {!providers.length ? (
                  <div className="rounded-2xl border border-dashed border-border bg-secondary px-4 py-3 text-sm text-muted-foreground sm:col-span-3">
                    Provider catalog is still loading.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="axis-label">Smartcard / IUC number</div>
                <Input value={smartcardNumber} onChange={(e) => setSmartcardNumber(e.target.value)} placeholder="Enter smartcard number" />
                <p className={cn('text-xs', smartCardError ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>
                  {smartCardError || 'Use the registered smartcard or IUC number.'}
                </p>
              </div>
              <div className="space-y-2">
                <div className="axis-label">Phone number</div>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="08012345678" />
                <p className={cn('text-xs', phoneError ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>
                  {phoneError || 'Used by provider for transaction updates.'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="axis-label">Package code</div>
                {packageChoices.length ? (
                  <select
                    value={packageCode}
                    onChange={(e) => setPackageCode(e.target.value)}
                    className="flex h-11 w-full rounded-2xl border border-border bg-input px-4 py-2 text-sm text-foreground outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                  >
                    {packageChoices.map((item) => {
                      const code = String(item?.code || item?.id || '').trim();
                      const label = String(item?.name || code || '').trim();
                      return (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <Input value={packageCode} onChange={(e) => setPackageCode(e.target.value)} placeholder="e.g. dstv-padi" />
                )}
                <p className={cn('text-xs', packageError ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>
                  {packageError || (packageChoices.length ? 'Package list loaded from the provider catalog.' : 'Use your package code from support or provider docs.')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="axis-label">Amount (NGN)</div>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="5400" />
                <p className={cn('text-xs', amountError ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>
                  {amountError || 'Enter the package amount before checkout.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sticky top-6 h-fit">
          <PremiumReceipt
            title="Cable subscription"
            items={[
              { label: 'Provider', value: selectedProvider?.name || '—' },
              { label: 'Smartcard/IUC', value: cleanCard || '—' },
              { label: 'Package', value: cleanPackage || '—' },
              { label: 'Amount', value: `₦${Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatMoney(parsedAmount) : '0.00'}` },
              { label: 'Wallet balance', value: `₦${formatMoney(wallet?.balance || 0)}` }
            ]}
            total={Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatMoney(parsedAmount) : '0.00'}
            totalLabel="Total Cost"
            buttonText="Pay Cable"
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
