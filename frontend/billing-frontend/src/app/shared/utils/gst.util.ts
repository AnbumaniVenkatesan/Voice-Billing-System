import { TaxSlab } from '../models/models';

export const ROUND_TWO = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function inclusiveGst(amount: number, gstPct: number): number {
  if (!gstPct || gstPct <= 0) return 0;
  return ROUND_TWO((amount * gstPct) / (100 + gstPct));
}

export function splitGst(amount: number, gstPct: number): { sgst: number; cgst: number } {
  if (!gstPct || gstPct <= 0) return { sgst: 0, cgst: 0 };
  const gst = inclusiveGst(amount, gstPct);
  const sgst = ROUND_TWO(gst / 2);
  const cgst = ROUND_TWO(gst - sgst);
  return { sgst, cgst };
}

export function aggregateTaxSlabs(items: { total: number; gstPercentage: number }[]): TaxSlab[] {
  const map = new Map<number, { sgst: number; cgst: number; gst: number }>();
  for (const item of items) {
    const rate = item.gstPercentage || 0;
    const { sgst, cgst } = splitGst(item.total || 0, rate);
    const cur = map.get(rate) || { sgst: 0, cgst: 0, gst: 0 };
    cur.sgst += sgst;
    cur.cgst += cgst;
    cur.gst += sgst + cgst;
    map.set(rate, cur);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, v]) => ({
      gstRate: rate,
      sgstRate: ROUND_TWO(rate / 2),
      cgstRate: ROUND_TWO(rate / 2),
      sgstAmount: ROUND_TWO(v.sgst),
      cgstAmount: ROUND_TWO(v.cgst),
      gstAmount: ROUND_TWO(v.gst),
    }));
}

export function formatMoney(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
