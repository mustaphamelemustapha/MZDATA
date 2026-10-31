import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Wallet, ServerCrash, RefreshCw, Settings2 } from 'lucide-react';
import { adminGetProviderBalances, apiFetch } from '@/lib/api';
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
      const [balRes, provRes] = await Promise.allSettled([
        adminGetProviderBalances(),
        apiFetch('/admin/integrations/providers'),
      ]);

      const res = balRes.status === 'fulfilled' ? balRes.value : null;
      const integrationProviders = provRes.status === 'fulfilled' && Array.isArray(provRes.value)
        ? provRes.value
        : null;

      // Helper to check if a provider is allowed to be shown on the admin homepage
      const shouldShowProvider = (identifierOrName) => {
        if (!integrationProviders) return true;
        const key = String(identifierOrName || '').toLowerCase().trim();
        const match = integrationProviders.find(
          (p) =>
            String(p.identifier || '').toLowerCase().trim() === key ||
            String(p.name || '').toLowerCase().trim() === key
        );
        // If not in integrations or turned OFF (is_active === false), do NOT show on admin homepage
        if (!match || !match.is_active) return false;
        const cfg = match.additional_config && typeof match.additional_config === 'object' ? match.additional_config : {};
        if ('show_balance_on_dashboard' in cfg && cfg.show_balance_on_dashboard === false) {
          return false;
        }
        return true;
      };

      const findIntegrationMeta = (identifierOrName) => {
        if (!integrationProviders) return null;
        const key = String(identifierOrName || '').toLowerCase().trim();
        return integrationProviders.find(
          (p) =>
            String(p.identifier || '').toLowerCase().trim() === key ||
            String(p.name || '').toLowerCase().trim() === key
        ) || null;
      };

      if (Array.isArray(res?.providers)) {
        const filtered = res.providers.filter(
          (p) => p.is_active !== false && p.show_balance_on_dashboard !== false && shouldShowProvider(p.identifier || p.name)
        );
        setProviders(filtered);
      } else if (res?.balances && typeof res.balances === 'object') {
        const mapped = Object.entries(res.balances)
          .filter(([key]) => shouldShowProvider(key))
          .map(([key, val]) => {
            const meta = findIntegrationMeta(key);
            const rawThreshold = meta?.additional_config?.low_balance_threshold;
            const threshold = rawThreshold !== undefined && rawThreshold !== null && rawThreshold !== '' && !isNaN(Number(rawThreshold))
              ? Number(rawThreshold)
              : 5000;
            const isErr = typeof val === 'string' && (val.startsWith('CK Error') || val.startsWith('Error') || isNaN(Number(val)));
            const numBal = isErr ? 0 : Number(val ?? 0);
            return {
              identifier: meta?.identifier || key,
              name: meta?.name || key,
              balance: isErr ? null : numBal,
              error: isErr ? val : null,
              low_balance_threshold: threshold,
              is_low: !isErr && threshold > 0 && numBal < threshold,
            };
          });
        setProviders(mapped);
      } else if (integrationProviders) {
        // Fallback to active providers stored in integrations DB if balance endpoint returned empty
        const activeShown = integrationProviders
          .filter((p) => p.is_active && shouldShowProvider(p.identifier))
          .map((p) => {
            const rawThreshold = p?.additional_config?.low_balance_threshold;
            const threshold = rawThreshold !== undefined && rawThreshold !== null && rawThreshold !== '' && !isNaN(Number(rawThreshold))
              ? Number(rawThreshold)
              : 5000;
            const numBal = Number(p.balance ?? 0);
            return {
              identifier: p.identifier,
              name: p.name,
              balance: numBal,
              error: null,
              low_balance_threshold: threshold,
              is_low: threshold > 0 && numBal < threshold,
            };
          });
        setProviders(activeShown);
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
