'use client';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Landmark,
  Loader2,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format';

export function WithdrawModal({
  open,
  onClose,
  onSuccess,
  onOpenKyc,
  walletBalance = 0,
  userProfile = null,
}) {
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const [accountNumber, setAccountNumber] = useState('');
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState('');
  const [resolveError, setResolveError] = useState('');

  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Check KYC status
  const isKycVerified = Boolean(
    userProfile?.kyc_verified ||
    userProfile?.has_bvn ||
    userProfile?.has_nin ||
    userProfile?.bvn_hash ||
    userProfile?.nin_hash
  );

  // Fetch banks on open
  useEffect(() => {
    if (!open || !isKycVerified || banks.length > 0) return;
    let mounted = true;
    setLoadingBanks(true);
    apiFetch('/wallet/banks')
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setBanks(list);
      })
      .catch((err) => {
        console.error('Failed to load banks:', err);
      })
      .finally(() => {
        if (mounted) setLoadingBanks(false);
      });
    return () => {
      mounted = false;
    };
  }, [open, isKycVerified, banks.length]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setBankSearch('');
      setSelectedBank(null);
      setShowBankDropdown(false);
      setAccountNumber('');
      setResolvedAccountName('');
      setResolveError('');
      setAmount('');
      setPin('');
      setSubmitError('');
      setReceipt(null);
      setCopiedRef(false);
    }
  }, [open]);

  // Filter banks
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks;
    const q = bankSearch.toLowerCase();
    return banks.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.code?.includes(q) ||
        b.slug?.toLowerCase().includes(q)
    );
  }, [banks, bankSearch]);

  // Real-time account resolution
  useEffect(() => {
    const cleanAcc = accountNumber.replace(/\D/g, '').slice(0, 10);
    if (cleanAcc.length !== 10 || !selectedBank?.code) {
      setResolvedAccountName('');
      setResolveError('');
      return;
    }

    let isCurrent = true;
    setResolvingAccount(true);
    setResolveError('');
    setResolvedAccountName('');

    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch('/wallet/resolve-bank-account', {
          method: 'POST',
          body: JSON.stringify({
            account_number: cleanAcc,
            bank_code: selectedBank.code,
          }),
        });
        if (!isCurrent) return;
        if (res?.account_name) {
          setResolvedAccountName(res.account_name);
          setResolveError('');
        } else {
          setResolveError('Could not verify account name. Check details.');
        }
      } catch (err) {
        if (!isCurrent) return;
        const msg = err?.data?.detail || err?.message || 'Could not verify account number.';
        setResolveError(msg);
      } finally {
        if (isCurrent) setResolvingAccount(false);
      }
    }, 450);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [accountNumber, selectedBank]);

  // Fee Calculation: 25 for <= 5000, 50 for > 5000
  const numAmount = parseFloat(amount) || 0;
  const transferFee = numAmount > 0 ? (numAmount <= 5000 ? 25 : 50) : 0;
  const totalDebit = numAmount > 0 ? numAmount + transferFee : 0;
  const isBalanceSufficient = walletBalance >= totalDebit;
  const isAmountValid = numAmount >= 100 && numAmount <= 100000;

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedBank || !accountNumber || !resolvedAccountName) {
      setSubmitError('Please complete bank and verified account number.');
      return;
    }
    if (!isAmountValid) {
      setSubmitError('Withdrawal amount must be between ₦100 and ₦100,000.');
      return;
    }
    if (!isBalanceSufficient) {
      setSubmitError(`Insufficient wallet balance. Required: ${formatMoney(totalDebit)}`);
      return;
    }
    if (!pin || pin.length < 4) {
      setSubmitError('Please enter your 4-digit transaction PIN.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await apiFetch('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          account_number: accountNumber.trim(),
          bank_code: selectedBank.code,
          bank_name: selectedBank.name,
          account_name: resolvedAccountName,
          amount: numAmount,
          pin: pin.trim(),
        }),
      });

      setReceipt(res);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      const msg = err?.data?.detail || err?.message || 'Withdrawal request could not be processed.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyRef = async (ref) => {
    if (!ref) return;
    try {
      await navigator.clipboard.writeText(String(ref));
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      setCopiedRef(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-2xl z-10 max-h-[92vh] flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors z-20"
        >
          <X className="h-4 w-4" />
        </button>

        {/* 1. KYC GATING SCREEN (IF NOT VERIFIED) */}
        {!isKycVerified ? (
          <div className="py-4 text-center flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner mb-4">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-extrabold tracking-tight text-foreground">
              Account Verification Required
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Account verification is required before making a withdrawal. Link your NIN or BVN to activate withdrawal and dedicated account services.
            </p>

            <div className="mt-6 w-full rounded-2xl bg-secondary/40 border border-border/50 p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                CBN Regulatory Compliance
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                To prevent fraud and protect your balance, the Central Bank of Nigeria mandates valid identity linkage for all bank transfers.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11 font-semibold"
                onClick={onClose}
              >
                Go Back
              </Button>
              <Button
                className="flex-1 rounded-xl h-11 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={() => {
                  onClose();
                  if (onOpenKyc) onOpenKyc();
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                Verify Now
              </Button>
            </div>
          </div>
        ) : receipt ? (
          /* 2. SUCCESS RECEIPT SCREEN */
          <div className="py-2 flex flex-col items-center text-center overflow-y-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 mb-3 shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h3 className="text-2xl font-black tracking-tight text-foreground">
              Withdrawal Initiated
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {receipt.message || 'Funds are on their way to your bank account.'}
            </p>

            <div className="mt-3 text-3xl font-black text-foreground tracking-tight">
              {formatMoney(receipt.amount)}
            </div>

            <div className="mt-5 w-full rounded-2xl border border-border/60 bg-secondary/30 p-4 text-left space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Recipient Name</span>
                <span className="font-bold text-foreground">{receipt.account_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Bank Name</span>
                <span className="font-bold text-foreground">{receipt.bank_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-mono font-bold text-foreground">{receipt.account_number}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Transfer Fee</span>
                <span className="font-semibold text-foreground">{formatMoney(receipt.fee)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Debited</span>
                <span className="font-bold text-foreground">{formatMoney(receipt.total_debited)}</span>
              </div>
              <div className="border-t border-border/40 pt-2 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Reference</span>
                <button
                  onClick={() => copyRef(receipt.reference)}
                  className="font-mono text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  {receipt.reference}
                  {copiedRef ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <Button
              className="mt-6 w-full rounded-xl h-11 font-bold shadow-md"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        ) : (
          /* 3. WITHDRAWAL FORM */
          <div className="overflow-y-auto pr-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-foreground">
                  Withdraw to Bank
                </h3>
                <p className="text-xs text-muted-foreground">
                  Instant Paystack transfer to any Nigerian bank
                </p>
              </div>
            </div>

            {/* Wallet Balance Pill */}
            <div className="mb-4 rounded-xl bg-secondary/50 border border-border/40 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                Available Balance
              </div>
              <div className="text-sm font-black text-foreground">
                {formatMoney(walletBalance)}
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              {/* Bank Selection */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">
                  Select Destination Bank
                </label>
                <div className="relative">
                  <div
                    onClick={() => setShowBankDropdown(!showBankDropdown)}
                    className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold shadow-sm hover:border-primary/50 transition-colors"
                  >
                    <span className={selectedBank ? 'text-foreground font-bold' : 'text-muted-foreground'}>
                      {selectedBank ? selectedBank.name : loadingBanks ? 'Loading banks...' : 'Choose bank...'}
                    </span>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Dropdown Menu */}
                  {showBankDropdown && (
                    <div className="absolute top-12 left-0 right-0 z-30 rounded-2xl border border-border bg-popover shadow-xl p-2 max-h-56 overflow-y-auto">
                      <div className="sticky top-0 bg-popover pb-2 z-10">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search bank name..."
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            className="h-8 pl-8 text-xs rounded-lg"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        {filteredBanks.map((bank) => (
                          <div
                            key={bank.code + bank.name}
                            onClick={() => {
                              setSelectedBank(bank);
                              setShowBankDropdown(false);
                              setBankSearch('');
                            }}
                            className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                              selectedBank?.code === bank.code
                                ? 'bg-primary text-primary-foreground font-bold'
                                : 'hover:bg-secondary text-foreground'
                            }`}
                          >
                            <span>{bank.name}</span>
                            {selectedBank?.code === bank.code && <Check className="h-3.5 w-3.5" />}
                          </div>
                        ))}
                        {filteredBanks.length === 0 && (
                          <div className="p-3 text-center text-xs text-muted-foreground">
                            No matching bank found.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 10-Digit Account Number */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">
                  10-Digit Account Number
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0123456789"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="h-11 font-mono text-sm tracking-wider pr-10 rounded-xl"
                  />
                  {resolvingAccount && (
                    <div className="absolute right-3 top-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                {/* Resolved Account Name */}
                {resolvedAccountName && (
                  <div className="mt-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                        Verified Account Name
                      </div>
                      <div className="text-xs font-extrabold text-foreground tracking-tight truncate">
                        {resolvedAccountName}
                      </div>
                    </div>
                  </div>
                )}

                {resolveError && (
                  <div className="mt-2 rounded-xl bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{resolveError}</span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Withdrawal Amount
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Min ₦100 • Max ₦100,000
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm font-bold text-muted-foreground">₦</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="100"
                    max="100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-11 pl-8 font-extrabold text-base rounded-xl"
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                  {[1000, 2000, 5000, 10000, 20000, 50000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(String(val))}
                      className="rounded-lg border border-border/70 bg-secondary/50 px-2 py-1 text-[11px] font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                    >
                      +{formatMoney(val)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const maxPossible = Math.max(0, Math.min(100000, walletBalance - 50));
                      setAmount(String(Math.floor(maxPossible)));
                    }}
                    className="rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Fee & Debit Summary */}
              {numAmount > 0 && (
                <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Withdrawal Amount:</span>
                    <span className="font-semibold text-foreground">{formatMoney(numAmount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      Transfer Fee {numAmount <= 5000 ? '(≤ ₦5,000)' : '(> ₦5,000)'}:
                    </span>
                    <span className="font-semibold text-foreground">{formatMoney(transferFee)}</span>
                  </div>
                  <div className="border-t border-border/40 pt-1.5 flex justify-between font-extrabold text-foreground">
                    <span>Total Debited:</span>
                    <span className={isBalanceSufficient ? 'text-primary' : 'text-destructive'}>
                      {formatMoney(totalDebit)}
                    </span>
                  </div>
                </div>
              )}

              {/* 4-Digit Transaction PIN */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">
                  4-Digit Transaction PIN
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="h-11 pl-9 font-mono text-center tracking-[0.5em] text-lg rounded-xl"
                  />
                </div>
              </div>

              {submitError && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  submitting ||
                  !selectedBank ||
                  accountNumber.length !== 10 ||
                  !resolvedAccountName ||
                  !isAmountValid ||
                  !isBalanceSufficient ||
                  pin.length < 4
                }
                className="w-full rounded-xl h-12 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Withdrawal...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    Confirm Withdrawal of {formatMoney(numAmount || 0)}
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
