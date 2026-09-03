'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { resetPasswordRequest, warmBackend } from '@/lib/api';

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

export function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 20);
    return () => window.clearTimeout(id);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return setError('Invalid or missing reset token. Please request a new link.');
    if (!password) return setError('Please enter a new password.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    
    setError('');
    setLoading(true);
    try {
      await warmBackend();
      await resetPasswordRequest(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Failed to reset password. The link might be expired.');
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
              <img src="/brand/mzdata-logo.jpg" alt="MZDATA logo" className="h-full w-full object-contain" />
            </div>
            <CardTitle className="text-[1.6rem] font-semibold tracking-[-0.025em] text-foreground">
              Create New Password
            </CardTitle>
            <CardDescription className="mx-auto max-w-[300px] text-sm leading-6 text-muted-foreground">
              {success ? 'Your password has been successfully updated.' : 'Enter your new password below to regain access to your account.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-8 sm:px-7">
            {success ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                  <p className="text-sm text-foreground">
                    You can now sign in with your new password.
                  </p>
                </div>
                <Link href="/login" className="block">
                  <Button
                    className="h-[50px] w-full rounded-[8px] border border-primary/20 bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(249,115,22,0.12)] transition-all duration-200 hover:bg-primary/90"
                  >
                    Sign in to MZDATA
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <Field label="New Password">
                  <div className="relative">
                    <Input
                      className="h-[50px] rounded-[8px] border border-border bg-input px-4 pr-12 text-[0.98rem] text-foreground placeholder:text-muted-foreground caret-foreground shadow-none transition-all duration-200 hover:border-primary/45 focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a new secure password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm Password">
                  <div className="relative">
                    <Input
                      className="h-[50px] rounded-[8px] border border-border bg-input px-4 pr-12 text-[0.98rem] text-foreground placeholder:text-muted-foreground caret-foreground shadow-none transition-all duration-200 hover:border-primary/45 focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  Reset password
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
