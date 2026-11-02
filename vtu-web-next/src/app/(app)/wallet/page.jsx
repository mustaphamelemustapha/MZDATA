'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, Wallet2, ChevronLeft, ChevronRight, Landmark } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime, formatMoney, formatBankDisplayName, getBankAppSearchHint, formatAccountNumber, sortFundingAccounts, getBankStyle } from '@/lib/format';
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

  const [copied, setCopied] = useState(false);

  const sortedAccounts = useMemo(() => sortFundingAccounts(accounts), [accounts]);
  const activeAccount = sortedAccounts[activeIndex] || sortedAccounts[0];

  const copy = async (value) => {
    if (!value) return;
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-40px)] bg-background px-4 py-5 text-foreground md:-mx-6 md:-my-5 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
      <div className="space-y-6 pb-28 md:pb-8">
      <PageHeader
        eyebrow="Wallet"
        title="Balance, transfer details, and ledger"
        description="A focused wallet workspace with the information the user needs to fund accounts and review movements."
        actions={(
          <Button variant="secondary" onClick={() => load()} className="border-white/10 bg-background/50 text-muted-foreground hover:bg-card hover:text-foreground backdrop-blur-sm">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="relative overflow-hidden border border-border/40 bg-card/40 backdrop-blur-2xl shadow-xl">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/20 rounded-full blur-[4rem] pointer-events-none" />
          <CardHeader className="relative z-10">
            <CardTitle>Wallet overview</CardTitle>
            <CardDescription>Live balance and operational state.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center justify-between rounded-[2rem] border border-primary/20 bg-card/60 backdrop-blur-3xl p-6 sm:p-8 shadow-[0_24px_50px_rgba(234,115,69,0.06)] overflow-hidden">
              <div className="relative z-10">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Available balance</div>
                <div className="mt-2 text-4xl sm:text-5xl font-mono font-semibold tracking-tight text-foreground">₦{formatMoney(wallet?.balance || 0)}</div>
                <div className="mt-3 text-sm text-muted-foreground">{loading ? 'Syncing wallet data...' : 'Wallet synced and secure.'}</div>
              </div>
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                <Wallet2 className="h-8 w-8" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { label: 'Ledger entries', value: String(ledger.length) },
                { label: 'Transfer accounts', value: String(accounts.length) },
                { label: 'Status', value: wallet?.status || 'active' },
              ].map((item) => (
                <div key={item.label} className="group relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-background/50 p-5 transition-all hover:bg-background/80 hover:shadow-md">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">{item.label}</div>
                  <div className="mt-2 text-2xl font-bold text-foreground/90">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-border/40 bg-card/40 backdrop-blur-2xl shadow-xl">
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-[4rem] pointer-events-none" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle>Instant Funding Accounts</CardTitle>
              <CardDescription>Automated 24/7 dedicated transfer accounts.</CardDescription>
            </div>
            {sortedAccounts.length > 1 && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-background p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  disabled={activeIndex === 0}
                  onClick={() => { setActiveIndex((prev) => Math.max(0, prev - 1)); setCopied(false); }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-semibold px-1 select-none">
                  {activeIndex + 1}/{sortedAccounts.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  disabled={activeIndex === sortedAccounts.length - 1}
                  onClick={() => { setActiveIndex((prev) => Math.min(sortedAccounts.length - 1, prev + 1)); setCopied(false); }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            {/* Quick Bank Tabs */}
            {sortedAccounts.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {sortedAccounts.map((acc, idx) => {
                  const style = getBankStyle(acc.bank_name);
                  const isSelected = activeIndex === idx;
                  return (
                    <button
                      key={acc.account_number}
                      type="button"
                      onClick={() => { setActiveIndex(idx); setCopied(false); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                        isSelected
                          ? `${style.badgeBg} ${style.borderAccent} shadow-sm ring-1 ring-primary/30`
                          : 'border-border/60 bg-secondary/40 text-muted-foreground hover:bg-secondary/70'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      {style.shortName}
                    </button>
                  );
                })}
              </div>
            )}

            {activeAccount ? (() => {
              const bankName = formatBankDisplayName(activeAccount.bank_name);
              const searchHint = getBankAppSearchHint(activeAccount.bank_name);
              const formattedAccNum = formatAccountNumber(activeAccount.account_number);
              const style = getBankStyle(activeAccount.bank_name);

              return (
                <div className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/5 via-card/70 to-transparent p-6 transition-all duration-300 shadow-[0_12px_28px_rgba(234,115,69,0.12)] dark:shadow-[0_16px_36px_rgba(234,115,69,0.18)]">
                  {/* Bank Name Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-inner font-bold ${style.iconBg}`}>
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Bank Name</div>
                        <div className="text-lg font-black tracking-tight text-foreground leading-snug">
                          {bankName}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  </div>

                  {/* Bank App Search Hint for Local Users */}
                  <div className="mt-4 rounded-xl bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground/80 flex items-center gap-2 border border-border/50">
                    <span className="text-primary font-bold">ℹ️</span>
                    <span>{searchHint}</span>
                  </div>

                  {/* Big Readable Account Number */}
                  <div className="mt-5">
                    <div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Account Number</div>
                    <div className="mt-1 text-3xl sm:text-4xl font-black tracking-[0.14em] text-foreground font-mono select-all">
                      {formattedAccNum}
                    </div>
                  </div>

                  {/* Account Name */}
                  <div className="mt-3 text-[11px] font-black text-foreground/80 uppercase tracking-widest">
                    ACCOUNT NAME: <span className="text-primary">{String(activeAccount.account_name || 'Digital Wallet').toUpperCase()}</span>
                  </div>

                  {/* Copy Account Button */}
                  <Button
                    variant={copied ? "default" : "secondary"}
                    className={`mt-6 w-full rounded-2xl h-12 font-bold text-sm transition-all border-white/10 ${
                      copied ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : 'bg-background/70 hover:bg-background'
                    }`}
                    onClick={() => copy(activeAccount.account_number)}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Account Number
                      </>
                    )}
                  </Button>
                </div>
              );
            })() : (
              <div className="rounded-[1.5rem] border border-dashed border-border/50 bg-secondary/30 p-6 text-sm text-muted-foreground text-center backdrop-blur-sm">
                Dedicated accounts will appear here once generated.
              </div>
            )}
            <div className="mt-4 p-5 border border-primary/10 rounded-[1.5rem] bg-primary/5 text-[11px] text-foreground/80 leading-relaxed flex gap-3 items-start backdrop-blur-sm">
              <span className="text-base select-none mt-0.5">🔒</span>
              <span>
                <strong>Privacy Guarantee:</strong> We do <strong>NOT</strong> store or keep your BVN or NIN. Identity verification is securely routed directly to our CBN-licensed banking partners to automatically generate your personalized funding accounts.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="relative overflow-hidden border border-border/40 bg-card/40 backdrop-blur-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold tracking-tight">Ledger</CardTitle>
          <CardDescription>Wallet movements in clean chronological order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ledger.length === 0 ? <div className="text-sm text-muted-foreground">No ledger records yet.</div> : null}
          {ledger.map((item) => (
            <div key={item.id || item.reference} className="group relative overflow-hidden flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-background/50 p-4 transition-all hover:bg-background/80 hover:shadow-md">
              <div className="relative z-10">
                <div className="text-sm font-bold text-foreground/90">{item.description || item.reference || 'Wallet entry'}</div>
                <div className="text-[11px] text-muted-foreground/70 mt-1">{formatDateTime(item.created_at)}</div>
              </div>
              <div className={`relative z-10 text-[15px] font-extrabold tracking-tight ${String(item.entry_type || '').toLowerCase() === 'credit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {String(item.entry_type || '').toLowerCase() === 'credit' ? '+' : '-'}₦{formatMoney(item.amount || 0)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
