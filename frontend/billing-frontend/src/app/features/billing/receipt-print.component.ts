import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../shared/models/models';
import { Company } from '../../shared/models/company.model';

@Component({
  selector: 'app-receipt-print',
  standalone: true,
  imports: [CommonModule],
  template: ``
})
export class ReceiptPrintComponent {

  static print(invoice: Invoice, company: Company | null, paymentMethod: string): void {
    const line = '--------------------------------------';

    const companyName = company?.companyName || 'Smart Billing';
    const gst = company?.gstNumber || '';
    const phone = company?.phoneNumber || '';
    const email = company?.email || '';
    const addr1 = company?.addressLine1 || '';
    const addr2 = company?.addressLine2 || '';
    const city = company?.city || '';
    const pincode = company?.pincode || '';

    const addressParts = [addr1, addr2, [city, pincode].filter(Boolean).join(' - ')].filter(Boolean);
    const addressLines = addressParts.length > 0 ? addressParts.join('\n      ') : '';

    let invDate = new Date();
    if (invoice.invoiceDate) {
      const raw = invoice.invoiceDate;
      if (typeof raw === 'string' && raw.includes('T')) {
        invDate = new Date(raw);
      } else if (typeof raw === 'string') {
        invDate = new Date(raw);
      } else {
        invDate = new Date(raw as any);
      }
      if (isNaN(invDate.getTime())) invDate = new Date();
    }

    const dateStr = invDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = invDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

    const COL_ITEM = 14;
    const COL_QTY = 4;
    const COL_PRICE = 7;
    const COL_AMT = 9;
    const TOTAL_WIDTH = COL_ITEM + COL_QTY + COL_PRICE + COL_AMT;

    const formatRow = (name: string, qty: number | string, price: number, amount: number): string => {
      const n = name.length > COL_ITEM ? name.substring(0, COL_ITEM) : name;
      const q = String(qty).padStart(COL_QTY);
      const p = ('₹' + price.toFixed(0)).padStart(COL_PRICE);
      const a = ('₹' + amount.toFixed(2)).padStart(COL_AMT);
      return n.padEnd(COL_ITEM) + q + ' ' + p + ' ' + a;
    };

    const formatSummaryRow = (label: string, value: number): string => {
      return ' ' + label.padEnd(COL_ITEM + COL_QTY + COL_PRICE + 2) + ('₹' + value.toFixed(2)).padStart(COL_AMT);
    };

    const items = (invoice.items || []).map((item: any) => {
      const name = item.productName || '';
      const qty = item.quantity || 0;
      const price = item.price || 0;
      const total = qty * price;
      return ' ' + formatRow(name, qty, price, total);
    }).join('\n');

    const slabs = (invoice.taxSlabs || []).slice().sort((a: any, b: any) => a.gstRate - b.gstRate);
    let gstBreakdown: string;
    if (slabs.length > 0) {
      gstBreakdown = slabs.map((s: any) =>
        ' ' + formatSummaryRow('SGST (' + s.sgstRate + '%)', s.sgstAmount || 0) + '\n ' +
        formatSummaryRow('CGST (' + s.cgstRate + '%)', s.cgstAmount || 0)
      ).join('\n');
    } else {
      const taxPercent = company?.taxPercentage && company.taxPercentage > 0 ? company.taxPercentage : 3;
      const halfRate = (taxPercent / 2).toFixed(1);
      gstBreakdown = ' ' + formatSummaryRow('SGST (' + halfRate + '%)', invoice.sgstAmount || 0) + '\n ' +
        formatSummaryRow('CGST (' + halfRate + '%)', invoice.cgstAmount || 0);
    }

    const includedGstRow = ' ' + formatSummaryRow('Included GST', invoice.gstAmount || 0);

    const html = `<!DOCTYPE html>
<html>
<head>
<title>${invoice.invoiceNumber || 'Receipt'}</title>
<style>
  @page {
    size: 80mm auto;
    margin: 0;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    line-height: 1.35;
    width: 80mm;
    padding: 4mm 3mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .dash-line { font-size: 12px; white-space: pre; line-height: 1.4; }
  .shop-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
  .shop-info { font-size: 11px; line-height: 1.3; margin-top: 2px; }
  .invoice-title { font-size: 13px; font-weight: bold; letter-spacing: 2px; margin: 1px 0; }
  .info-row { font-size: 12px; line-height: 1.6; white-space: pre; }
  .table-header { font-weight: bold; font-size: 12px; white-space: pre; }
  .item-row { font-size: 12px; line-height: 1.5; white-space: pre; }
  .summary-row { font-size: 12px; line-height: 1.6; white-space: pre; }
  .grand-total { font-size: 14px; font-weight: bold; white-space: pre; }
  .footer { margin-top: 6px; }
  .footer-text { font-size: 11px; line-height: 1.4; }
</style>
</head>
<body>

<div class="center">
  <div class="shop-name">${companyName.toUpperCase()}</div>
  ${addressLines ? '<div class="shop-info">' + addressLines + '</div>' : ''}
  ${phone ? '<div class="shop-info">Phone : ' + phone + '</div>' : ''}
  ${gst ? '<div class="shop-info">GSTIN : ' + gst + '</div>' : ''}
  ${email ? '<div class="shop-info">Email : ' + email + '</div>' : ''}
</div>

<div class="dash-line">${line}</div>
<div class="center invoice-title">BILL</div>
<div class="dash-line">${line}</div>

<div style="margin: 6px 0;">
  <div class="info-row"> Bill No     : ${(invoice.invoiceNumber || '').split('-').pop()}</div>
  <div class="info-row"> Date        : ${dateStr}</div>
  <div class="info-row"> Time        : ${timeStr}</div>
</div>

<div class="dash-line">${line}</div>
<div class="table-header"> ${'Item'.padEnd(COL_ITEM)} ${'Qty'.padStart(COL_QTY)} ${'Price'.padStart(COL_PRICE)} ${'Amount'.padStart(COL_AMT)}</div>
<div class="dash-line">${line}</div>

<div class="item-row">${items}</div>

<div class="dash-line">${line}</div>
<div class="summary-row"> ${formatSummaryRow('Subtotal', invoice.subtotal || 0)}</div>
<div class="summary-row" style="font-size: 10px; color: #555;">${includedGstRow}</div>
<div class="summary-row">${gstBreakdown}
</div>

<div class="dash-line">${line}</div>
<div class="summary-row"> ${formatSummaryRow('GRAND TOTAL', invoice.totalAmount || 0)}</div>
<div class="dash-line">${line}</div>

<div class="center footer">
  <div class="footer-text" style="font-size: 10px;">* Prices are inclusive of GST *</div>
  ${company?.billFooter
    ? '<div class="footer-text bold" style="margin-top:4px; white-space: pre-line;">' + company.billFooter + '</div>'
    : '<div class="footer-text bold" style="margin-top:4px;">Thank You!!!</div>' +
      '<div class="footer-text" style="margin-top:2px;">Visit Again</div>'}
</div>

</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }
}
