'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, RefreshCw, Wallet2, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, ledgerRes, accountRes] = await Promise.allSettled([
        apiFetch('/wallet/me'),
        apiFetch('/wallet/ledger'),
        apiFetch('/wallet/bank-transfer-accounts'),
      ]);
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value);
      if (ledgerRes.status === 'fulfilled') setLedger(Array.isArray(ledgerRes.value) ? ledgerRes.value : []);
      if (accountRes.status === 'fulfilled') {
        const accs = Array.isArray(accountRes.value?.accounts) ? accountRes.value.accounts : [];
        setAccounts(accs);
        setActiveIndex(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const copy = async (value) => {
    await navigator.clipboard.writeText(String(value || ''));
  };

  const activeAccount = accounts[activeIndex] || accounts[0];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Wallet"
        title="Balance, transfer details, and ledger"
        description="A focused wallet workspace with the information the user needs to fund accounts and review movements."
        actions={(
          <Button variant="secondary" onClick={() => load()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Wallet overview</CardTitle>
            <CardDescription>Live balance and operational state.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-3xl border border-border bg-secondary p-5">
              <div>
                <div className="axis-label">Available balance</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">₦{formatMoney(wallet?.balance || 0)}</div>
                <div className="mt-2 text-sm text-muted-foreground">{loading ? 'Syncing wallet data...' : 'Wallet loaded from the existing API.'}</div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-primary">
                <Wallet2 className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { label: 'Ledger entries', value: String(ledger.length) },
                { label: 'Transfer accounts', value: String(accounts.length) },
                { label: 'Status', value: wallet?.status || 'active' },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-border bg-secondary p-4">
                  <div className="axis-label">{item.label}</div>
                  <div className="mt-2 text-xl font-semibold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Funding details</CardTitle>
              <CardDescription>Dedicated top-up accounts.</CardDescription>
            </div>
            {accounts.length > 1 && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-background p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-semibold px-1 select-none">
                  {activeIndex + 1}/{accounts.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  disabled={activeIndex === accounts.length - 1}
                  onClick={() => setActiveIndex((prev) => Math.min(accounts.length - 1, prev + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAccount ? (
              <div className="rounded-3xl border border-blue-500/20 bg-secondary p-5 transition-all duration-300 hover:scale-[1.01] shadow-[0_12px_28px_rgba(37,99,235,0.12)] dark:shadow-[0_16px_36px_rgba(37,99,235,0.18)] dark:border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold tracking-widest text-primary uppercase">{activeAccount.bank_name}</div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-xs font-black uppercase text-emerald-700 dark:text-emerald-400">
                    Active
                  </span>
                </div>
                <div className="mt-3 text-3xl font-bold tracking-[0.12em] text-foreground font-mono">{activeAccount.account_number}</div>
                <div className="mt-3 text-sm font-black text-foreground uppercase tracking-wide">ACCOUNT NAME: {String(activeAccount.account_name || 'MZDATA Wallet').toUpperCase()}</div>
                <Button variant="secondary" className="mt-4 w-full rounded-2xl" onClick={() => copy(activeAccount.account_number)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Account Number
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground text-center">
                Dedicated accounts will appear here once generated.
              </div>
            )}
            <div className="mt-4 p-4 border border-blue-500/20 rounded-2xl bg-blue-500/5 text-xs text-foreground leading-relaxed flex gap-2.5 items-start">
              <span className="text-base select-none">🔒</span>
              <span>
                <strong>Privacy Guarantee:</strong> MZDATA does <strong>NOT</strong> store or keep your BVN or NIN. This identity verification is securely routed directly to our central CBN-licensed payment partner (Monnify) to automatically generate your personalized funding accounts.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
          <CardDescription>Wallet movements in clean chronological order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ledger.length === 0 ? <div className="text-sm text-muted-foreground">No ledger records yet.</div> : null}
          {ledger.map((item) => (
            <div key={item.id || item.reference} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary p-4">
              <div>
                <div className="text-sm font-medium text-foreground">{item.description || item.reference || 'Wallet entry'}</div>
                <div className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</div>
              </div>
              <div className={`text-sm font-semibold ${String(item.entry_type || '').toLowerCase() === 'credit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {String(item.entry_type || '').toLowerCase() === 'credit' ? '+' : '-'}₦{formatMoney(item.amount || 0)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
