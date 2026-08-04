import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InvoiceService } from '../../shared/services/invoice.service';
import { CompanyService } from '../../shared/services/company.service';
import { Invoice } from '../../shared/models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatTableModule,
    MatPaginatorModule, MatDatepickerModule,
    MatNativeDateModule, MatTooltipModule
  ],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>analytics</mat-icon>
          </div>
          <div>
            <h1>Reports</h1>
            <p class="subtitle">Transaction history and invoice records</p>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-row">
          <div class="filter-group">
            <label>Invoice #</label>
            <div class="input-wrap">
              <mat-icon>search</mat-icon>
              <input type="text" [(ngModel)]="searchInvoiceNo" (input)="applyFilter()" placeholder="Search invoice...">
            </div>
          </div>
          <div class="filter-group">
            <label>Status</label>
            <div class="input-wrap">
              <mat-icon>flag</mat-icon>
              <select [(ngModel)]="searchStatus" (change)="applyFilter()">
                <option value="">All</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="filter-group">
            <label>From</label>
            <div class="input-wrap">
              <mat-icon>event</mat-icon>
              <input type="date" [(ngModel)]="fromDateStr" (change)="onDateFilter()">
            </div>
          </div>
          <div class="filter-group">
            <label>To</label>
            <div class="input-wrap">
              <mat-icon>event</mat-icon>
              <input type="date" [(ngModel)]="toDateStr" (change)="onDateFilter()">
            </div>
          </div>
          <div class="filter-group filter-actions">
            <button class="btn-clear" (click)="clearFilters()">
              <mat-icon>clear_all</mat-icon>
              Clear All
            </button>
          </div>
        </div>
      </div>

      <!-- Invoice Table -->
      <div class="table-section">
        <div class="table-header-row">
          <span class="table-count">{{ filteredInvoices.length }} invoices found</span>
          <button class="btn-export" (click)="exportCsv()">
            <mat-icon>file_download</mat-icon>
            Export CSV
          </button>
        </div>

        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" class="reports-table">
            <ng-container matColumnDef="invoiceNumber">
              <th mat-header-cell *matHeaderCellDef>Invoice #</th>
              <td mat-cell *matCellDef="let row">
                <span class="invoice-number">{{ row.invoiceNumber }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let row">
                <span class="amount-value">\u20B9{{ row.totalAmount | number:'1.2-2' }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="paymentStatus">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge completed">
                  <mat-icon>check_circle</mat-icon> Completed
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="invoiceDate">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let row">{{ row.invoiceDate | date:'dd MMM yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button class="btn-view" matTooltip="View report" (click)="viewDetails(row)">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="recentColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: recentColumns;"></tr>
          </table>
        </div>
        <div class="paginator-wrapper">
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
        </div>
      </div>
    </div>

    <!-- View Report Dialog -->
    <div class="view-overlay" *ngIf="viewInvoice" (click)="viewInvoice = null">
      <div class="view-card" (click)="$event.stopPropagation()">
        <div class="view-header">
          <div>
            <h3>{{ viewInvoice.invoiceNumber }}</h3>
            <p class="view-meta">
              {{ viewInvoice.invoiceDate | date:'dd MMM yyyy, h:mm a' }}
              <span class="status-badge completed">
                <mat-icon>check_circle</mat-icon> Completed
              </span>
            </p>
          </div>
          <button class="btn-view-close" matTooltip="Close" (click)="viewInvoice = null">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="view-body">
          <table class="view-items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of viewInvoice.items">
                <td>{{ item.productName }}</td>
                <td>{{ item.quantity }}</td>
                <td>₹{{ item.price | number:'1.2-2' }}</td>
                <td>₹{{ (item.price * item.quantity) | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="view-summary">
            <div class="view-sum-row">
              <span>Subtotal</span>
              <span>₹{{ viewInvoice.subtotal | number:'1.2-2' }}</span>
            </div>
            <div class="view-sum-row" *ngFor="let slab of viewInvoice.taxSlabs">
              <span>GST ({{ slab.gstRate }}%)</span>
              <span>₹{{ slab.gstAmount | number:'1.2-2' }}</span>
            </div>
            <div class="view-sum-row" *ngIf="viewInvoice.discount > 0">
              <span>Discount</span>
              <span>-₹{{ viewInvoice.discount | number:'1.2-2' }}</span>
            </div>
            <div class="view-sum-row total">
              <span>Total</span>
              <span>₹{{ viewInvoice.totalAmount | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
        <div class="view-actions">
          <button class="btn-close" (click)="viewInvoice = null">
            <mat-icon>close</mat-icon> Close
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      font-family: 'Poppins', sans-serif;
      display: block;
      background: #F8FAFC;
      min-height: 100vh;
      padding: 32px;
    }

    .reports-page {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #1E40AF, #3B82F6);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon {
      font-size: 28px;
      color: #fff;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
    }

    .subtitle {
      font-size: 14px;
      color: #64748B;
      margin: 2px 0 0;
    }

    .filter-bar {
      background: #fff;
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
      margin-bottom: 24px;
    }

    .filter-row {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 160px;
    }

    .filter-group label {
      font-size: 12px;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #F8FAFC;
      border: 1.5px solid #E5E7EB;
      border-radius: 10px;
      padding: 0 12px;
      height: 42px;
      transition: all 200ms ease;
    }

    .input-wrap:focus-within {
      border-color: #1E40AF;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.08);
      background: #fff;
    }

    .input-wrap mat-icon {
      font-size: 18px;
      color: #94A3B8;
    }

    .input-wrap input,
    .input-wrap select {
      border: none;
      outline: none;
      background: transparent;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      color: #1E293B;
      width: 100%;
    }

    .input-wrap select {
      cursor: pointer;
    }

    .filter-actions {
      justify-content: flex-end;
    }

    .btn-clear {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 42px;
      padding: 0 20px;
      border: 1.5px solid #E5E7EB;
      border-radius: 10px;
      background: #fff;
      color: #64748B;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .btn-clear:hover {
      border-color: #EF4444;
      color: #EF4444;
      background: #FEF2F2;
    }

    .table-section {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
      overflow: hidden;
    }

    .table-header-row {
      padding: 20px 24px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .table-count {
      font-size: 14px;
      font-weight: 500;
      color: #64748B;
    }

    .btn-export {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 20px;
      border: none;
      border-radius: 10px;
      background: #1E40AF;
      color: #fff;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .btn-export:hover {
      background: #1D4ED8;
      box-shadow: 0 4px 14px rgba(30, 64, 175, 0.3);
    }

    .btn-export mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .btn-view {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 8px;
      background: #EEF2FF;
      color: #1E40AF;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .btn-view:hover {
      background: #DBEAFE;
    }

    .btn-view mat-icon {
      font-size: 19px;
      width: 19px;
      height: 19px;
    }

    /* ====== VIEW DIALOG ====== */
    .view-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .view-card {
      background: #fff;
      border-radius: 20px;
      width: 100%;
      max-width: 640px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      padding: 28px;
    }

    .view-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }

    .view-header h3 {
      margin: 0 0 6px;
      font-size: 20px;
      font-weight: 700;
      color: #1E293B;
      font-family: 'Poppins', sans-serif;
    }

    .view-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin: 0;
      font-size: 13px;
      color: #64748B;
    }

    .btn-view-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 10px;
      background: #F1F5F9;
      color: #64748B;
      cursor: pointer;
      transition: all 200ms ease;
      flex-shrink: 0;
    }

    .btn-view-close:hover {
      background: #E2E8F0;
      color: #1E293B;
    }

    .btn-view-close mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .view-body {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .view-items {
      width: 100%;
      border-collapse: collapse;
    }

    .view-items th {
      text-align: left;
      padding: 10px 12px;
      background: #F8FAFC;
      font-family: 'Poppins', sans-serif;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748B;
      border-bottom: 1px solid #E5E7EB;
    }

    .view-items td {
      padding: 10px 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      color: #1E293B;
      border-bottom: 1px solid #F1F5F9;
    }

    .view-summary {
      background: #F8FAFC;
      border-radius: 12px;
      padding: 16px;
    }

    .view-sum-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      color: #334155;
    }

    .view-sum-row.total {
      border-top: 1px solid #E5E7EB;
      margin-top: 6px;
      padding-top: 12px;
      font-size: 16px;
      font-weight: 700;
      color: #1E293B;
    }

    .view-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn-close {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 42px;
      padding: 0 24px;
      border: none;
      border-radius: 10px;
      background: #1E40AF;
      color: #fff;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .btn-close:hover {
      background: #1D4ED8;
    }

    .btn-close mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .reports-table {
      width: 100%;
    }

    .reports-table th {
      background: #EEF2FF;
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #1E40AF;
      padding: 14px 16px;
      border-bottom: 1px solid #E5E7EB;
    }

    .reports-table td {
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      color: #1E293B;
      padding: 14px 16px;
      border-bottom: 1px solid #F1F5F9;
    }

    .reports-table tr:last-child td {
      border-bottom: none;
    }

    .reports-table tr:hover td {
      background: #F8FAFC;
    }

    .invoice-number {
      font-weight: 600;
      color: #1E40AF;
    }

    .amount-value {
      font-weight: 600;
      color: #047857;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .status-badge.completed,
    .status-badge.paid {
      background: #DCFCE7;
      color: #15803D;
    }

    .status-badge.failed {
      background: #FEF2F2;
      color: #991B1B;
    }

    .paginator-wrapper {
      padding: 12px 24px 16px;
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      :host { padding: 16px; }
      .page-header { margin-bottom: 20px; }
      .header-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
      }
      .header-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      h1 { font-size: 24px; }
      .subtitle { font-size: 13px; }
      .filter-row { flex-direction: column; }
      .filter-group { min-width: 100%; }
      .filter-bar { padding: 16px; }
      .btn-clear { height: 48px; }
      .table-header-row { padding: 16px 16px 12px; }
      .paginator-wrapper {
        padding: 8px 8px 12px;
        justify-content: center;
      }
    }

    @media (max-width: 479.98px) {
      .reports-table {
        min-width: 560px;
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  dataSource = new MatTableDataSource<Invoice>();
  recentColumns: string[] = ['invoiceNumber', 'totalAmount', 'paymentStatus', 'invoiceDate', 'actions'];

  searchInvoiceNo = '';
  searchStatus = '';
  searchFromDate: Date | null = null;
  searchToDate: Date | null = null;
  fromDateStr = '';
  toDateStr = '';

  viewInvoice: Invoice | null = null;

  filteredInvoices: Invoice[] = [];
  private allInvoices: Invoice[] = [];

  constructor(
    private invoiceService: InvoiceService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.invoiceService.getAllInvoices().subscribe(invoices => {
      this.allInvoices = invoices;
      this.filteredInvoices = invoices;
      this.dataSource.data = invoices;
      this.dataSource.paginator = this.paginator;
      this.dataSource.filterPredicate = (_invoice: Invoice, _filter: string) => {
        return this.matchInvoice(_invoice);
      };
    });

    this.companyService.getCompany().subscribe({
      next: () => {
        this.recentColumns = ['invoiceNumber', 'totalAmount', 'paymentStatus', 'invoiceDate', 'actions'];
      },
      error: () => {}
    });
  }

  matchInvoice(invoice: Invoice): boolean {
    const invoiceNo = (invoice.invoiceNumber || '').toLowerCase();
    const status = (invoice.paymentStatus || '').toLowerCase();
    const invDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;

    if (this.searchInvoiceNo && !invoiceNo.includes(this.searchInvoiceNo.toLowerCase())) return false;
    if (this.searchStatus && status !== this.searchStatus.toLowerCase()) return false;
    if (this.searchFromDate && invDate && invDate < this.stripTime(this.searchFromDate)) return false;
    if (this.searchToDate && invDate && invDate > this.stripTimeEnd(this.searchToDate)) return false;
    return true;
  }

  private stripTime(d: Date): Date {
    const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
  }

  private stripTimeEnd(d: Date): Date {
    const r = new Date(d); r.setHours(23, 59, 59, 999); return r;
  }

  applyFilter(): void {
    this.dataSource.filter = 'trigger';
    this.filteredInvoices = this.allInvoices.filter(inv => this.matchInvoice(inv));
  }

  onDateFilter(): void {
    if (this.fromDateStr) {
      this.searchFromDate = new Date(this.fromDateStr);
    } else {
      this.searchFromDate = null;
    }
    if (this.toDateStr) {
      this.searchToDate = new Date(this.toDateStr);
    } else {
      this.searchToDate = null;
    }
    this.applyFilter();
  }

  clearFilters(): void {
    this.searchInvoiceNo = '';
    this.searchStatus = '';
    this.searchFromDate = null;
    this.searchToDate = null;
    this.fromDateStr = '';
    this.toDateStr = '';
    this.dataSource.filter = '';
    this.dataSource.data = [...this.allInvoices];
    this.filteredInvoices = [...this.allInvoices];
  }

  viewDetails(invoice: Invoice): void {
    this.viewInvoice = invoice;
  }

  exportCsv(): void {
    const esc = (v: any) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };

    const header = ['Invoice #', 'Date', 'Time', 'Items', 'Subtotal', 'GST', 'Discount', 'Total', 'Status'];
    const lines: string[] = [header.map(esc).join(',')];

    for (const inv of this.filteredInvoices) {
      const date = inv.invoiceDate ? new Date(inv.invoiceDate) : null;
      const dStr = date ? date.toLocaleDateString('en-IN') : '';
      const tStr = date ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
      const itemCount = (inv.items || []).reduce((s, i) => s + i.quantity, 0);
      lines.push([
        inv.invoiceNumber,
        dStr,
        tStr,
        itemCount,
        inv.subtotal,
        inv.gstAmount,
        inv.discount,
        inv.totalAmount,
        inv.paymentStatus
      ].map(esc).join(','));
    }

    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
