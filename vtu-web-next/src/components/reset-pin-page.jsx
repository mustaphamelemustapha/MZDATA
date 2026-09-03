'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { resetPinRequest, warmBackend } from '@/lib/api';

function Field({ label, helper, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</label>
        {helper ? <span className="text-[11px] text-muted-foreground">{helper}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function ResetPinPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 20);
    return () => window.clearTimeout(id);
  }, []);

  const handlePinChange = (val, setter) => {
    const nums = val.replace(/[^0-9]/g, '').slice(0, 4);
    setter(nums);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return setError('Invalid or missing reset token. Please request a new link.');
    if (!pin || pin.length !== 4) return setError('Please enter a 4-digit PIN.');
    if (pin !== confirmPin) return setError('PINs do not match.');
    
    setError('');
    setLoading(true);
    try {
      await warmBackend();
      await resetPinRequest(token, pin);
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Failed to reset transaction PIN. The link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className={`relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8 transition-all duration-300 ease-out ${
          mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1.5 scale-[0.995]'
        }`}
      >
        <Card className="w-full max-w-[420px] border border-border bg-card shadow-[0_8px_20px_rgba(0,0,0,0.14)] backdrop-blur-sm">
          <CardHeader className="space-y-3 px-6 pb-6 pt-8 text-center sm:px-7">
            <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-card ring-1 ring-border">
              <img src="/brand/mzdata-icon.png" alt="MZDATA logo" className="h-full w-full object-contain" />
            </div>
            <CardTitle className="text-[1.6rem] font-semibold tracking-[-0.025em] text-foreground">
              Reset Transaction PIN
            </CardTitle>
            <CardDescription className="mx-auto max-w-[300px] text-sm leading-6 text-muted-foreground">
              {success ? 'Your transaction PIN has been successfully updated.' : 'Enter your new 4-digit transaction PIN to continue making purchases.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-8 sm:px-7">
            {success ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                  <p className="text-sm text-foreground">
                    You can now use your new PIN for transactions.
                  </p>
                </div>
                <Link href="/login" className="block">
                  <Button
                    className="h-[50px] w-full rounded-[8px] border border-primary/20 bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(249,115,22,0.12)] transition-all duration-200 hover:bg-primary/90"
                  >
                    Return to Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <Field label="New PIN">
                  <div className="relative">
                    <Input
                      className="h-[50px] rounded-[8px] border border-border bg-input px-4 pr-12 text-[0.98rem] text-foreground placeholder:text-muted-foreground caret-foreground shadow-none transition-all duration-200 hover:border-primary/45 focus:border-primary/70 focus:ring-2 focus:ring-primary/20 tracking-[0.2em] font-medium"
                      value={pin}
                      onChange={(e) => handlePinChange(e.target.value, setPin)}
                      placeholder="••••"
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      autoComplete="off"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((prev) => !prev)}
                      className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm PIN">
                  <div className="relative">
                    <Input
                      className="h-[50px] rounded-[8px] border border-border bg-input px-4 pr-12 text-[0.98rem] text-foreground placeholder:text-muted-foreground caret-foreground shadow-none transition-all duration-200 hover:border-primary/45 focus:border-primary/70 focus:ring-2 focus:ring-primary/20 tracking-[0.2em] font-medium"
                      value={confirmPin}
                      onChange={(e) => handlePinChange(e.target.value, setConfirmPin)}
                      placeholder="••••"
                      type={showConfirmPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      autoComplete="off"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin((prev) => !prev)}
                      className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                {error ? <div className="rounded-[10px] border border-rose-400/15 bg-rose-500/8 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

                <Button
                  className="h-[50px] w-full rounded-[8px] border border-primary/20 bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(249,115,22,0.12)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_10px_20px_rgba(249,115,22,0.14)] active:scale-[0.98] active:shadow-[0_6px_14px_rgba(249,115,22,0.10)]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Reset PIN
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
