'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, ShieldCheck, Sparkles, X, AlertCircle, Loader2, Landmark, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatBankDisplayName, formatAccountNumber, getBankStyle } from '@/lib/format';

export function LinkBvnNinModal({ open, onClose, onSuccess, prefillPhone = '' }) {
  const [docType, setDocType] = useState('nin'); // 'nin' | 'bvn'
  const [idNumber, setIdNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(prefillPhone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedAccounts, setGeneratedAccounts] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState(null);

  const cleanId = idNumber.replace(/\D/g, '').slice(0, 11);
  const isValidLength = cleanId.length === 11;

  const handleIdChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setIdNumber(val);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidLength) {
      setError(`Please enter a valid 11-digit ${docType.toUpperCase()}.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        bvn: docType === 'bvn' ? cleanId : null,
        nin: docType === 'nin' ? cleanId : null,
        phone_number: phoneNumber ? phoneNumber.trim() : null,
      };

      const res = await apiFetch('/wallet/bank-transfer-accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const accounts = Array.isArray(res?.accounts) ? res.accounts : [];
      if (accounts.length > 0) {
        setGeneratedAccounts(accounts);
        if (onSuccess) onSuccess(accounts);
      } else if (res?.message) {
        throw new Error(res.message);
      } else {
        throw new Error('Could not provision virtual accounts. Please verify your details.');
      }
    } catch (err) {
      setError(err?.message || `Failed to link ${docType.toUpperCase()}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const copyNumber = async (accNum) => {
    try {
      await navigator.clipboard.writeText(String(accNum));
      setCopiedAccount(accNum);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (_) {}
  };

  const handleClose = () => {
    setIdNumber('');
    setError('');
    setGeneratedAccounts(null);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[320] flex items-end justify-center bg-black/70 backdrop-blur-md p-0 sm:items-center sm:p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-border/60 bg-card p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>

          {!generatedAccounts ? (
            /* STEP 1: Form View */
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Link NIN or BVN</h2>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[10px] font-bold">
                      Automated
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instantly unlock automated 24/7 dedicated PalmPay, Moniepoint &amp; Titan transfer accounts.
                  </p>
                </div>
              </div>

              {/* Document Type Switcher */}
              <div className="flex rounded-2xl bg-secondary/80 p-1 border border-border/50">
                <button
                  type="button"
                  onClick={() => { setDocType('nin'); setIdNumber(''); setError(''); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    docType === 'nin'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  NIN (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => { setDocType('bvn'); setIdNumber(''); setError(''); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    docType === 'bvn'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                  BVN
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 11-digit Number Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                      {docType === 'nin' ? 'National Identity Number (NIN)' : 'Bank Verification Number (BVN)'}
                    </label>
                    <span className={`font-mono text-[11px] font-semibold ${cleanId.length === 11 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {cleanId.length} / 11 digits
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={`Enter 11-digit ${docType.toUpperCase()}`}
                      value={cleanId}
                      onChange={handleIdChange}
                      disabled={loading}
                      maxLength={11}
                      className="h-14 font-mono text-xl tracking-[0.2em] rounded-2xl bg-secondary/40 border-border/60 focus-visible:ring-primary/50 text-center select-all font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {docType === 'nin'
                      ? '💡 Dial *346# on your registered SIM to retrieve your NIN.'
                      : '💡 Dial *565*0# on your registered SIM to check your BVN.'}
                  </p>
                </div>

                {/* Optional Phone Number */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    Registered Mobile Number <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    className="h-11 rounded-xl bg-secondary/40 border-border/60"
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{error}</span>
                  </motion.div>
                )}

                {/* Privacy & CBN Notice */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    <strong>CBN Compliance &amp; Encryption:</strong> We do <strong>NOT</strong> store your raw {docType.toUpperCase()} in plaintext. It is verified securely via banking rails to automatically provision your personalized accounts.
                  </span>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!isValidLength || loading}
                  className="h-14 w-full rounded-2xl bg-primary text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition active:scale-[0.98] mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Provisioning Dedicated Accounts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Link &amp; Generate Virtual Accounts
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* STEP 2: Celebratory Success Container */
            <div className="space-y-6 text-center py-2">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">Virtual Accounts Activated!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Your dedicated transfer accounts are ready. Any money sent to these account numbers funds your wallet automatically 24/7.
                </p>
              </div>

              {/* Generated Accounts List */}
              <div className="space-y-3 text-left">
                {generatedAccounts.map((acc) => {
                  const bankName = formatBankDisplayName(acc.bank_name);
                  const formattedNum = formatAccountNumber(acc.account_number);
                  const style = getBankStyle(acc.bank_name);
                  const isCopied = copiedAccount === acc.account_number;

                  return (
                    <div
                      key={acc.account_number}
                      className="rounded-2xl border border-border/60 bg-secondary/50 p-4 flex items-center justify-between gap-3 shadow-sm hover:border-primary/40 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-inner ${style.iconBg}`}>
                          <Landmark className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{bankName}</div>
                          <div className="text-base font-black font-mono tracking-wider text-foreground select-all">
                            {formattedNum}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {acc.account_name || 'Personal Virtual Wallet'}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant={isCopied ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => copyNumber(acc.account_number)}
                        className={`rounded-xl px-3 h-8 text-xs font-bold shrink-0 transition ${
                          isCopied ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : ''
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={handleClose}
                className="h-12 w-full rounded-2xl bg-primary text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
              >
                Done &amp; View My Wallet
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
