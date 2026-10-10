import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatMoney } from '@/lib/format';
import { motion } from 'framer-motion';

export function ProfitMetricsCard({ profitData }) {
  if (!profitData) return null;

  const periods = [
    { key: 'daily', label: 'Today', description: 'Since 12:00 AM', glow: 'from-emerald-500/20 to-transparent', orb: 'bg-emerald-500/30', text: 'text-emerald-400' },
    { key: 'weekly', label: 'This Week', description: 'Since Monday', glow: 'from-blue-500/20 to-transparent', orb: 'bg-blue-500/30', text: 'text-blue-400' },
    { key: 'monthly', label: 'This Month', description: 'Since 1st', glow: 'from-purple-500/20 to-transparent', orb: 'bg-purple-500/30', text: 'text-purple-400' },
    { key: 'all_time', label: 'All-Time', description: 'Lifetime Volume', glow: 'from-brand/20 to-transparent', orb: 'bg-brand/30', text: 'text-brand' },
  ];

  return (
    <Card className="h-full relative overflow-hidden border border-border/40 bg-card/40 backdrop-blur-2xl shadow-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[5rem] -z-10" />
      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-xl font-bold tracking-tight">Period Analytics</CardTitle>
        <CardDescription>Revenue & Profit margins by time frame</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="grid gap-4 grid-cols-2">
          {periods.map((period) => {
            const data = profitData[period.key] || { revenue: 0, profit_estimate: 0, tx_count: 0 };
            return (
              <motion.div 
                key={period.key} 
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-background/50 p-4 shadow-sm group"
              >
                <div className={`absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-100 ${period.glow}`} />
                <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-50 ${period.orb}`} />
                
                <div className="relative z-10">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1">{period.label}</div>
                  
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Profit</span>
                    <span className={`text-xl font-extrabold tracking-tight drop-shadow-sm ${period.text}`}>
                      ₦{formatMoney(data.profit_estimate)}
                    </span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Revenue</div>
                      <div className="text-xs font-semibold text-foreground/90 mt-0.5">₦{formatMoney(data.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Tx Volume</div>
                      <div className="text-xs font-semibold text-foreground/90 mt-0.5">{data.tx_count.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
