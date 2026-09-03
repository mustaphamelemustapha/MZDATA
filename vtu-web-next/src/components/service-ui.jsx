'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function NetworkCard({ networkKey, label, selected, onClick }) {
  const logoSrc = `/brand/networks/${networkKey}.png`;
  
  // Custom glowing gradients based on network
  const gradients = {
    mtn: 'from-yellow-400/20 to-yellow-600/20 ring-yellow-400/50',
    airtel: 'from-red-500/20 to-red-700/20 ring-red-500/50',
    glo: 'from-green-500/20 to-green-700/20 ring-green-500/50',
    '9mobile': 'from-emerald-700/20 to-emerald-900/20 ring-emerald-700/50',
  };

  const bgGradient = gradients[networkKey] || 'from-primary/20 to-primary/10 ring-primary/50';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'relative flex h-24 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border transition-all duration-300',
        selected
          ? `border-transparent bg-gradient-to-br ${bgGradient} ring-2 ring-offset-2 ring-offset-background`
          : 'border-border bg-card/50 hover:bg-card hover:shadow-md'
      )}
    >
      {/* Background blur for glassmorphism */}
      <div className="absolute inset-0 -z-10 bg-background/40 backdrop-blur-xl" />

      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm">
        <Image
          src={logoSrc}
          alt={label}
          width={40}
          height={40}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
      <span className={cn('text-xs font-semibold', selected ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground shadow-sm"
          >
            <Check className="h-3 w-3" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function PremiumReceipt({ title = 'Order Summary', items = [], total, totalLabel = 'Total Cost', onConfirm, isBusy, disabled, buttonText = 'Confirm & Purchase', errorMessage }) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-border/50 bg-card/80 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:bg-card/40 dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">Secure transaction</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative rounded-[24px] border border-border/50 bg-secondary/50 p-5 backdrop-blur-sm">
            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground text-right max-w-[60%] truncate">{item.value || '—'}</span>
                </div>
              ))}
            </div>

            {/* Dashed line */}
            <div className="my-5 border-t border-dashed border-border/80" />

            <div className="flex items-end justify-between gap-4">
              <span className="text-sm text-muted-foreground">{totalLabel}</span>
              <span className="text-3xl font-bold tracking-tight text-primary">
                ₦{total}
              </span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive break-words"
          >
            {errorMessage}
          </motion.div>
        )}

        <div className="mt-6">
          <Button
            className="group relative h-14 w-full overflow-hidden rounded-[20px] bg-primary text-base font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(var(--primary),0.25)] transition-all hover:bg-primary/90 hover:shadow-[0_16px_32px_rgba(var(--primary),0.35)] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            onClick={onConfirm}
            disabled={disabled || isBusy}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <span className="relative flex items-center justify-center gap-2">
              {isBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {buttonText}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
          </Button>
          
          <p className="mt-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            256-bit Secure Encryption
          </p>
        </div>
      </div>
    </div>
  );
}

export function PlanCard({ plan, selected, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-start justify-between gap-3 rounded-[24px] border p-5 text-left transition-all duration-300',
        selected
          ? 'border-primary bg-primary/5 shadow-[0_8px_24px_rgba(var(--primary),0.15)] ring-1 ring-primary/50'
          : 'border-border/60 bg-card/40 hover:border-border hover:bg-card hover:shadow-md'
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div>
          <div className={cn("text-lg font-bold tracking-tight transition-colors", selected ? "text-primary" : "text-foreground")}>
            {plan.data_size || plan.plan_name}
          </div>
          {plan.data_size && (
            <div className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {plan.plan_name}
            </div>
          )}
        </div>
        <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300", selected ? "border-primary bg-primary text-primary-foreground" : "border-border/80 bg-background/50 text-transparent")}>
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 w-full flex items-end justify-between">
        <div className={cn("text-xl font-semibold tracking-tight transition-colors", selected ? "text-primary" : "text-foreground")}>
          ₦{Number(plan.price).toLocaleString()}
        </div>
        <div className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground bg-secondary/80 px-2 py-1 rounded-md">
          {plan.validity || '30 Days'}
        </div>
      </div>
    </motion.button>
  );
}
