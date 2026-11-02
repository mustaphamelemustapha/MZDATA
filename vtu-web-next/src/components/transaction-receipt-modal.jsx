'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock3, Download, Share2, X, XCircle } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { getActiveBrand } from '@/lib/brand';

function statusUi(status) {
  if (status === 'success') {
    return {
      label: 'Order successful',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      iconTone: 'text-emerald-700 bg-emerald-100 border-emerald-200',
    };
  }
  if (status === 'refunded') {
    return {
      label: 'Order refunded',
      badge: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: XCircle,
      iconTone: 'text-orange-700 bg-orange-100 border-orange-200',
    };
  }
  if (status === 'failed') {
    return {
      label: 'Order failed',
      badge: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: XCircle,
      iconTone: 'text-rose-700 bg-rose-100 border-rose-200',
    };
  }
  return {
    label: 'Order pending',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock3,
    iconTone: 'text-amber-700 bg-amber-100 border-amber-200',
  };
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function TransactionReceiptModal({ open, receipt, onClose, onDownload, onShare }) {
  const brand = getActiveBrand();
  const [actionNote, setActionNote] = useState('');
  const pdfReceiptRef = useRef(null);
  const canUseDom = typeof document !== 'undefined';
  const status = useMemo(() => statusUi(receipt?.status), [receipt?.status]);
  const StatusIcon = status.icon;

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) setActionNote('');
  }, [open]);

  const rows = useMemo(() => {
    if (!receipt) return [];
    const baseRows = [
      { label: 'Time', value: formatDate(receipt.createdAt) },
      { label: 'Reference', value: receipt.reference || 'N/A' },
    ];
    if (receipt.customer) baseRows.push({ label: 'Customer', value: receipt.customer });
    for (const item of receipt.meta || []) {
      if (!item?.label || item?.value == null || item?.value === '') continue;
      baseRows.push({ label: item.label, value: String(item.value) });
    }
    return baseRows;
  }, [receipt]);

  const handleShare = async () => {
    if (!onShare) return;
    const result = await onShare(pdfReceiptRef.current);
    if (result?.mode === 'clipboard') setActionNote('Receipt copied. You can now paste and share.');
    else if (result?.mode === 'file-share') setActionNote('Receipt file ready in your share sheet.');
    else if (result?.mode === 'share') setActionNote('Share sheet opened.');
    else setActionNote('Sharing is not available on this device.');
  };

  const modal = (
    <AnimatePresence>
      {open && receipt ? (
        <motion.div
          className="fixed inset-0 z-[310] flex items-end justify-center bg-black/65 px-0 py-0 md:items-center md:px-4 md:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="h-[100dvh] w-full max-w-[560px] overflow-hidden rounded-none border-0 bg-[#eef2f7] shadow-2xl md:h-auto md:max-h-[92vh] md:rounded-3xl md:border md:border-slate-200"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-[#2563eb] via-[#2f6ceb] to-[#3b82f6] px-6 pb-7 pt-8">
              <div className="mx-auto flex w-fit flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg overflow-hidden">
                  <Image src={brand.icon} alt={brand.name} width={44} height={44} className="h-11 w-11 object-contain rounded-lg" />
                </div>
                <div className="mt-3 text-4xl font-semibold tracking-tight text-white">{brand.name}</div>
                <div className="mt-1 text-lg text-blue-100">Order Receipt</div>
              </div>
            </div>

            <div className="max-h-[calc(100dvh-180px)] space-y-4 overflow-y-auto px-5 py-5 md:max-h-[calc(92vh-180px)] md:px-6">
              <div className="mx-auto -mt-2 mb-2 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
              <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${status.iconTone}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xl font-semibold tracking-tight text-slate-900">{status.label}</div>
                      <div className="mt-1 text-sm font-medium text-slate-500">{receipt.service}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="mt-4 flex items-center justify-start">
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${status.badge}`}>
                    ● {receipt.status === 'success' ? 'Successful' : receipt.status === 'refunded' ? 'Refunded' : receipt.status === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>

                <div className="mt-4 text-5xl font-semibold tracking-tight text-slate-900">
                  ₦{formatMoney(receipt.amount || 0)}
                </div>

                {receipt.message ? (
                  <p className="mt-3 text-base leading-7 text-slate-600">{receipt.message}</p>
                ) : null}

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                  {rows.map((row) => (
                    <div key={`${row.label}-${row.value}`} className="flex items-start justify-between gap-3 border-b border-slate-200 py-3 last:border-b-0">
                      <span className="text-base font-medium text-slate-500">{row.label}</span>
                      <span className="text-base font-semibold text-slate-900 text-right">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    onClick={() => onDownload?.(pdfReceiptRef.current)}
                    className="h-12 border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Download receipt
                  </Button>
                  <Button onClick={handleShare} className="h-12 bg-[#2563eb] text-white hover:bg-[#1d4ed8]">
                    <Share2 className="h-4 w-4" />
                    Share receipt
                  </Button>
                </div>
                {actionNote ? <p className="mt-2 text-xs text-slate-500">{actionNote}</p> : null}
              </div>
              <div className="pb-1 text-center text-xs font-medium text-slate-400">meledata.ng</div>
            </div>
          </motion.div>

          <div className="pointer-events-none fixed -left-[9999px] top-0 w-[900px]">
            <div ref={pdfReceiptRef} className="w-[900px] overflow-hidden rounded-[28px] bg-[#f3f6fb] text-slate-900">
              <div className="bg-gradient-to-br from-[#2563eb] via-[#2f6ceb] to-[#3b82f6] px-12 pb-12 pt-14">
                <div className="mx-auto flex w-fit flex-col items-center">
                  <div className="rounded-2xl bg-white px-5 py-4 shadow-lg overflow-hidden">
                    <Image src={brand.logo} alt={brand.name} width={220} height={56} className="h-12 w-auto object-contain rounded-lg" />
                  </div>
                  <div className="mt-5 text-[46px] font-semibold tracking-tight text-white">Order Receipt</div>
                </div>
              </div>
              <div className="px-10 py-10">
                <div className="rounded-[24px] border border-slate-200 bg-white px-8 py-8 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-center">
                    <span className={`rounded-full border px-4 py-1.5 text-[24px] font-semibold ${status.badge}`}>
                      ● {receipt.status === 'success' ? 'Successful' : receipt.status === 'refunded' ? 'Refunded' : receipt.status === 'failed' ? 'Failed' : 'Pending'}
                    </span>
                  </div>

                  <div className="mt-5 text-center text-[52px] font-semibold tracking-tight text-slate-900">
                    ₦{formatMoney(receipt.amount || 0)}
                  </div>
                  <div className="mt-2 text-center text-[30px] font-medium text-slate-700">{receipt.service}</div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3">
                    {rows.map((row) => (
                      <div key={`pdf-${row.label}-${row.value}`} className="flex items-start justify-between gap-6 border-b border-slate-200 py-4 last:border-b-0">
                        <span className="text-[24px] text-slate-500">{row.label}</span>
                        <span className="max-w-[60%] text-right text-[24px] font-semibold text-slate-900">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {receipt.message ? (
                    <div className="mt-5 rounded-xl border border-slate-200 bg-white px-5 py-4 text-[22px] leading-9 text-slate-700">{receipt.message}</div>
                  ) : null}
                </div>

                <div className="mt-6 text-center text-[22px] font-medium text-slate-500">www.meledata.ng</div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (!canUseDom) return null;
  return createPortal(modal, document.body);
}
