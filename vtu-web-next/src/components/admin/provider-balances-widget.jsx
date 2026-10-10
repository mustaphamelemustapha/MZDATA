import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ServerCrash, RefreshCw } from 'lucide-react';
import { adminGetProviderBalances } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ProviderBalancesWidget() {
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchBalances = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminGetProviderBalances();
      if (res?.balances) {
        setBalances(res.balances);
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

  const THRESHOLD = 5000;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand/10 text-brand">
            <Wallet className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-foreground tracking-tight">API Balances</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchBalances} 
          disabled={loading}
          className="h-8 w-8 rounded-full"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <ServerCrash className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Failed to load balances</p>
        </div>
      ) : (
        <div className="space-y-3">
          {['amigo', 'smeplug', 'clubkonnect'].map((provider) => {
            const rawVal = balances?.[provider];
            const isError = typeof rawVal === 'string' && (rawVal.startsWith('CK Error') || rawVal.startsWith('Error') || isNaN(Number(rawVal)));
            const bal = isError ? 0 : Number(rawVal ?? 0);
            const isLow = !isError && bal < THRESHOLD;
            
            return (
              <div key={provider} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isError ? "bg-amber-500" : isLow ? "bg-destructive animate-pulse" : "bg-emerald-500"
                  )} />
                  <span className="text-sm font-medium capitalize text-foreground">{provider}</span>
                </div>
                {loading && !balances ? (
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                ) : isError ? (
                  <div className="text-right">
                    <span 
                      className="text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block max-w-[170px] truncate" 
                      title={rawVal}
                    >
                      {rawVal.replace('CK Error: ', '').replace('Error: ', '')}
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
