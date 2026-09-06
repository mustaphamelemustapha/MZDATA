import { formatMoney } from '@/lib/format';
import { sanitizeProviderMessage } from '@/lib/transaction-status';

function timestampLabel(date) {
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

export function buildTransactionReceipt({
  service,
  status,
  message,
  amount,
  reference,
  phone,
  meta = [],
  customer,
}) {
  return {
    id: `receipt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    service: service || 'MZDATA Transaction',
    status: ['success', 'failed', 'pending', 'refunded'].includes(status) ? status : 'pending',
    message: sanitizeProviderMessage(message || ''),
    amount: Number.isFinite(Number(amount)) ? Number(amount) : 0,
    reference: String(reference || 'N/A'),
    customer: customer || phone || '',
    meta: Array.isArray(meta) ? meta.filter((item) => item?.label && item?.value !== undefined && item?.value !== null) : [],
    createdAt: new Date().toISOString(),
  };
}

export function receiptShareText(receipt) {
  const amountLine = `₦${formatMoney(receipt.amount || 0)}`;
  const lines = [
    'MZDATA Transaction Receipt',
    `Amount: ${amountLine}`,
    `Service: ${receipt.service}`,
    `Ref: ${receipt.reference}`,
    `Status: ${String(receipt.status || 'pending').toUpperCase()}`,
    `Date: ${timestampLabel(new Date(receipt.createdAt))}`,
  ];

  if (receipt.customer) lines.push(`Customer: ${receipt.customer}`);
  for (const item of receipt.meta || []) lines.push(`${item.label}: ${item.value}`);
  if (receipt.message) lines.push(`Note: ${receipt.message}`);

  return lines.join('\n');
}

function safeFileName(value) {
  return String(value || 'transaction').replace(/[^a-zA-Z0-9_-]/g, '');
}

async function renderReceiptCanvas(sourceNode) {
  if (typeof window === 'undefined' || !sourceNode) return null;
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas(sourceNode, {
    scale: Math.min(3, typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2),
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });
}

function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function buildReceiptPdf(receipt, canvas) {
  const { jsPDF } = await import('jspdf');

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const usableWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * usableWidth) / canvas.width;

  if (imgHeight <= pageHeight - margin * 2) {
    pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, imgHeight, undefined, 'FAST');
  } else {
    const pageCanvas = document.createElement('canvas');
    const pageContext = pageCanvas.getContext('2d');
    const pagePxHeight = Math.floor((canvas.width * (pageHeight - margin * 2)) / usableWidth);
    pageCanvas.width = canvas.width;
    pageCanvas.height = pagePxHeight;

    let rendered = 0;
    while (rendered < canvas.height) {
      pageContext.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageContext.drawImage(canvas, 0, rendered, canvas.width, pagePxHeight, 0, 0, canvas.width, pagePxHeight);
      const pageData = pageCanvas.toDataURL('image/png');
      const ratio = Math.min(usableWidth / canvas.width, (pageHeight - margin * 2) / pagePxHeight);
      const targetWidth = canvas.width * ratio;
      const targetHeight = pagePxHeight * ratio;
      if (rendered > 0) pdf.addPage();
      pdf.addImage(pageData, 'PNG', margin, margin, targetWidth, targetHeight, undefined, 'FAST');
      rendered += pagePxHeight;
    }
  }
  return pdf;
}

export async function downloadReceipt(receipt, sourceNode) {
  if (typeof window === 'undefined' || !sourceNode) return { ok: false };
  
  try {
    const canvas = await renderReceiptCanvas(sourceNode);
    if (!canvas) return { ok: false };
    const pdf = await buildReceiptPdf(receipt, canvas);

    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
    if (isIOS) {
      const blob = pdf.output('blob');
      const url = window.URL.createObjectURL(blob);
      window.location.assign(url);
    } else {
      pdf.save(`MZDATA-Receipt-${safeFileName(receipt.reference)}.pdf`);
    }
    return { ok: true };
  } catch (error) {
    console.error('Download receipt error:', error);
    return { ok: false };
  }
}

export async function shareReceipt(receipt, sourceNode) {
  const text = receiptShareText(receipt);

  if (typeof navigator !== 'undefined' && navigator.share && sourceNode) {
    try {
      const canvas = await renderReceiptCanvas(sourceNode);
      const imageBlob = canvas ? await canvasToBlob(canvas, 'image/png', 1) : null;
      if (imageBlob) {
        const file = new File(
          [imageBlob],
          `MZDATA-Receipt-${safeFileName(receipt.reference)}.png`,
          { type: 'image/png' }
        );
        const payload = {
          title: 'MZDATA Transaction Receipt',
          text,
          files: [file],
        };
        if (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })) {
          await navigator.share(payload);
          return { mode: 'file-share' };
        }
      }
    } catch (error) {
      if (error?.name === 'AbortError') return { mode: 'none' };
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'MZDATA Transaction Receipt',
        text,
      });
      return { mode: 'share' };
    } catch (error) {
      // Ignore AbortError (user cancelled), but fallback to clipboard for others if needed
      if (error.name === 'AbortError') return { mode: 'none' };
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { mode: 'clipboard' };
    } catch {
      // Fallback
    }
  }

  return { mode: 'none' };
}
