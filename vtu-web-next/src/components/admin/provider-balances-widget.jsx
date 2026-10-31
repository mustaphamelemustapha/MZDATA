import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Wallet, ServerCrash, RefreshCw, Settings2 } from 'lucide-react';
import { adminGetProviderBalances } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ProviderBalancesWidget() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminGetProviderBalances();
      if (Array.isArray(res?.providers)) {
        setProviders(res.providers);
      } else if (res?.balances && typeof res.balances === 'object') {
        const mapped = Object.entries(res.balances).map(([key, val]) => {
          const isErr = typeof val === 'string' && (val.startsWith('CK Error') || val.startsWith('Error') || isNaN(Number(val)));
          const numBal = isErr ? 0 : Number(val ?? 0);
          return {
            identifier: key,
            name: key,
            balance: isErr ? null : numBal,
            error: isErr ? val : null,
            low_balance_threshold: 5000,
            is_low: !isErr && numBal < 5000,
          };
        });
        setProviders(mapped);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand/10 text-brand">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground tracking-tight leading-none">API Balances</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Selected providers &amp; low-balance alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            title="Configure displayed providers & thresholds"
          >
            <Link href="/admin/integrations">
              <Settings2 className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchBalances}
            disabled={loading}
            className="h-8 w-8 rounded-full"
            title="Refresh balances"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <ServerCrash className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Failed to load balances</p>
        </div>
      ) : loading && providers.length === 0 ? (
        <div className="space-y-3">
          {[1, 2].map((idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground space-y-2">
          <p className="text-xs">No providers selected for dashboard display.</p>
          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
            <Link href="/admin/integrations">Select Providers</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((item) => {
            const isError = Boolean(item.error);
            const bal = Number(item.balance ?? 0);
            const threshold = Number(item.low_balance_threshold ?? 5000);
            const isLow = !isError && threshold > 0 && bal < threshold;

            return (
              <div key={item.identifier} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isError ? "bg-amber-500" : isLow ? "bg-destructive animate-pulse" : "bg-emerald-500"
                  )} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium capitalize text-foreground truncate">{item.name || item.identifier}</div>
                    {threshold > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        Alert &lt; ₦{formatMoney(threshold)}
                      </div>
                    )}
                  </div>
                </div>
                {isError ? (
                  <div className="text-right">
                    <span
                      className="text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block max-w-[150px] truncate"
                      title={item.error}
                    >
                      {String(item.error).replace('CK Error: ', '').replace('Error: ', '')}
                    </span>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className={cn("text-sm font-semibold", isLow ? "text-destructive" : "text-foreground")}>
                      ₦{formatMoney(bal)}
                    </div>
                    {isLow && <div className="text-[10px] text-destructive font-medium uppercase tracking-wider">Low Balance</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
