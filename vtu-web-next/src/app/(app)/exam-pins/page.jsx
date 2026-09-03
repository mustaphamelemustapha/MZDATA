'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, RefreshCw, ReceiptText } from 'lucide-react';
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
  const phoneError = cleanPhone && !validNigerianPhone(phone) ? 'Enter a valid Nigerian phone number or leave it empty.' : '';
  const quantityError = quantity && (!Number.isFinite(qty) || qty < 1 || qty > 10) ? 'Quantity must be between 1 and 10.' : '';
  const total = Number.isFinite(qty) && qty > 0 ? qty * unitPrice : 0;

  const canSubmit = Boolean(exam && Number.isFinite(qty) && qty >= 1 && qty <= 10 && !phoneError && !quantityError && !busy);

  const submit = async () => {
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
    <div className="space-y-6 pb-10">
      <PageHeader
        eyebrow="Services"
        title="Exam PINs"
        description="Buy WAEC, NECO, or JAMB PINs from your wallet and keep the purchase record in history."
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
            <CardTitle>Buy Exam PIN</CardTitle>
            <CardDescription>Choose exam body, quantity, and optional phone reference.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="axis-label">Exam body</div>
                <select
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="flex h-11 w-full rounded-2xl border border-border bg-input px-4 py-2 text-sm text-foreground outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                >
                  {!examTypes.length ? <option value="">Loading exam types...</option> : null}
                  {examTypes.map((item) => (
                    <option key={item} value={item}>
                      {titleCase(item)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="axis-label">Quantity</div>
                <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="numeric" placeholder="1" />
                <p className={cn('text-xs', quantityError ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>
                  {quantityError || 'Allowed quantity: 1 to 10 PINs.'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="axis-label">Phone number (optional)</div>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="08012345678" />
              <p className={cn('text-xs', phoneError ? 'text-rose-600 dark:text-rose-300' : 'text-muted-foreground')}>
                {phoneError || 'Optional, used as a customer reference.'}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
              Receipt and purchased PIN details are tracked in your transaction history.
            </div>
          </CardContent>
        </Card>

        <div className="sticky top-6 h-fit">
          <PremiumReceipt
            title="Exam PIN purchase"
            items={[
              { label: 'Exam body', value: exam ? titleCase(exam) : '—' },
              { label: 'Quantity', value: Number.isFinite(qty) ? qty : '—' },
              { label: 'Unit price', value: `₦${formatMoney(unitPrice)}` },
              { label: 'Total', value: `₦${formatMoney(total)}` },
              { label: 'Wallet balance', value: `₦${formatMoney(wallet?.balance || 0)}` }
            ]}
            total={formatMoney(total)}
            totalLabel="Total Cost"
            buttonText="Buy PIN"
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
