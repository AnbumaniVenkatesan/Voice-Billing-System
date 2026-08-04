import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InvoiceService } from '../../shared/services/invoice.service';
import { CompanyService } from '../../shared/services/company.service';
import { Invoice } from '../../shared/models/models';
import { Company } from '../../shared/models/company.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReceiptPrintComponent } from './receipt-print.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatDialogModule
  ],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div>
            <h1>Bill History</h1>
            <p class="subtitle">Transaction history and bill records</p>
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
          <span class="table-count">{{ dataSource.filteredData.length }} invoices found</span>
        </div>

        <div class="table-wrapper">
          <table mat-table [dataSource]="dataSource" matSort class="reports-table">
            <ng-container matColumnDef="invoiceNumber">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Invoice # </th>
              <td mat-cell *matCellDef="let row">
                <span class="invoice-number">{{ row.invoiceNumber }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Amount </th>
              <td mat-cell *matCellDef="let row">
                <span class="amount-value">&#8377;{{ row.totalAmount | number:'1.2-2' }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="paymentStatus">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge completed">
                  <mat-icon>check_circle</mat-icon> Completed
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="invoiceDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header> Date </th>
              <td mat-cell *matCellDef="let row">{{ row.invoiceDate | date:'dd MMM yyyy, h:mm a' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef> Actions </th>
              <td mat-cell *matCellDef="let row">
                <button class="action-btn view" (click)="viewInvoice(row)" title="View">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
        <div class="paginator-wrapper">
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
        </div>
      </div>

      <!-- Mobile Cards -->
      <div class="mobile-invoice-list" *ngIf="dataSource.filteredData.length > 0">
        <div class="mobile-invoice-card" *ngFor="let row of displayedInvoices">
          <div class="mic-top">
            <span class="mic-number">{{ row.invoiceNumber }}</span>
            <span class="mic-status completed">
              <mat-icon>check_circle</mat-icon> Completed
            </span>
          </div>
          <div class="mic-rows">
            <div class="mic-row">
              <span class="mic-label">Date</span>
              <span class="mic-value">{{ row.invoiceDate | date:'dd MMM yyyy, h:mm a' }}</span>
            </div>
            <div class="mic-row">
              <span class="mic-label">Amount</span>
              <span class="mic-value mic-amount">&#8377;{{ row.totalAmount | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="mic-actions">
            <button class="mic-btn view" (click)="viewInvoice(row)">
              <mat-icon>visibility</mat-icon> View
            </button>
            <button class="mic-btn print" (click)="printInvoice(row)">
              <mat-icon>print</mat-icon> Print
            </button>
          </div>
        </div>
      </div>

      <!-- Invoice Detail -->
      <div class="invoice-detail" *ngIf="selectedInvoice">
        <h3>Invoice: {{ selectedInvoice.invoiceNumber }}</h3>
        <p class="detail-date"><strong>Date:</strong> {{ selectedInvoice.invoiceDate | date:'medium' }}</p>

        <table class="detail-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of selectedInvoice.items">
              <td>{{ item.productName }}</td>
              <td>{{ item.quantity }}</td>
              <td>&#8377;{{ item.price }}</td>
              <td>&#8377;{{ item.total }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3"><strong>Subtotal</strong></td>
              <td>&#8377;{{ selectedInvoice.subtotal }}</td>
            </tr>
            <tr *ngIf="selectedInvoice.discount > 0">
              <td colspan="3"><strong>Discount</strong></td>
              <td>-&#8377;{{ selectedInvoice.discount }}</td>
            </tr>
            <tr *ngFor="let slab of selectedInvoice.taxSlabs">
              <td colspan="3"><strong>SGST ({{ slab.sgstRate }}%)</strong></td>
              <td>&#8377;{{ slab.sgstAmount }}</td>
            </tr>
            <tr *ngFor="let slab of selectedInvoice.taxSlabs">
              <td colspan="3"><strong>CGST ({{ slab.cgstRate }}%)</strong></td>
              <td>&#8377;{{ slab.cgstAmount }}</td>
            </tr>
            <tr>
              <td colspan="3"><strong>Total</strong></td>
              <td><strong>&#8377;{{ selectedInvoice.totalAmount }}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div class="detail-actions">
          <button mat-button (click)="selectedInvoice = null">Close</button>
          <button mat-raised-button color="primary" (click)="reprintInvoice()">
            <mat-icon>print</mat-icon> Print
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

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

    .input-wrap input {
      border: none;
      outline: none;
      background: transparent;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      color: #1E293B;
      width: 100%;
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
    }

    .table-count {
      font-size: 14px;
      font-weight: 500;
      color: #64748B;
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
      text-transform: capitalize;
      background: #F1F5F9;
      color: #475569;
    }

    .status-badge.completed,
    .status-badge.paid {
      background: #DCFCE7;
      color: #15803D;
    }

    .status-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .status-badge.failed {
      background: #FEF2F2;
      color: #991B1B;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 200ms ease;
      margin-right: 6px;
    }

    .action-btn:last-child {
      margin-right: 0;
    }

    .action-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .action-btn.view {
      background: #EEF2FF;
      color: #1D4ED8;
    }

    .action-btn.view:hover {
      background: #DBEAFE;
    }

    .paginator-wrapper {
      padding: 12px 24px 16px;
      display: flex;
      justify-content: flex-end;
    }

    .invoice-detail {
      margin-top: 24px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
      padding: 24px;
    }

    .invoice-detail h3 {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 700;
      color: #1E293B;
    }

    .detail-date {
      font-size: 13px;
      color: #64748B;
      margin: 0 0 12px;
    }

    .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }

    .detail-table th,
    .detail-table td {
      padding: 10px 16px;
      text-align: left;
      border-bottom: 1px solid #F1F5F9;
      font-size: 14px;
    }

    .detail-table th {
      background: #EEF2FF;
      color: #1E40AF;
      font-weight: 600;
    }

    .detail-table tfoot td {
      border-top: 2px solid #E5E7EB;
    }

    .detail-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    /* ====== MOBILE INVOICE CARDS ====== */
    .mobile-invoice-list {
      display: none;
      flex-direction: column;
      gap: 14px;
    }

    .mobile-invoice-card {
      background: #fff;
      border: 1px solid #F1F5F9;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .mic-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .mic-number {
      font-size: 16px;
      font-weight: 700;
      color: #1E293B;
    }

    .mic-status {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: capitalize;
      background: #DCFCE7;
      color: #15803D;
    }

    .mic-status mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .mic-status.failed {
      background: #FEF2F2;
      color: #991B1B;
    }

    .mic-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 0;
      border-top: 1px solid #F1F5F9;
      border-bottom: 1px solid #F1F5F9;
    }

    .mic-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .mic-label {
      font-size: 13px;
      color: #64748B;
    }

    .mic-value {
      font-size: 14px;
      font-weight: 500;
      color: #1E293B;
      text-align: right;
    }

    .mic-amount {
      font-weight: 700;
      color: #047857;
    }

    .mic-actions {
      display: flex;
      gap: 10px;
    }

    .mic-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex: 1;
      height: 44px;
      border: none;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .mic-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .mic-btn.view {
      background: #EEF2FF;
      color: #1D4ED8;
    }

    .mic-btn.view:hover {
      background: #DBEAFE;
    }

    .mic-btn.print {
      background: #ECFDF5;
      color: #047857;
    }

    .mic-btn.print:hover {
      background: #D1FAE5;
    }

    .mic-btn.view:hover {
      background: #DBEAFE;
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
      .table-wrapper {
        display: none;
      }
      .mobile-invoice-list {
        display: flex;
      }
      .invoice-detail {
        padding: 16px;
      }
      .invoice-detail h3 {
        font-size: 17px;
        word-break: break-all;
      }
      .detail-table {
        display: block;
        overflow-x: auto;
      }
      .invoice-detail .mat-mdc-button,
      .invoice-detail button {
        height: 44px;
      }
    }

    @media (max-width: 479.98px) {
      .reports-table {
        min-width: 640px;
      }
      .mic-actions {
        flex-direction: row;
      }
      .mic-btn {
        flex: 1 1 0;
        min-width: 0;
        height: 44px;
        padding: 0 6px;
        font-size: 12px;
      }
      .mic-value {
        max-width: 60%;
      }
    }
  `]
})
export class InvoiceListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['invoiceNumber', 'totalAmount', 'paymentStatus', 'invoiceDate', 'actions'];
  dataSource = new MatTableDataSource<Invoice>();
  selectedInvoice: Invoice | null = null;
  company: Company | null = null;
  isHotel = false;

  searchInvoiceNo = '';
  searchFromDate: Date | null = null;
  searchToDate: Date | null = null;
  fromDateStr = '';
  toDateStr = '';

  private allInvoices: Invoice[] = [];

  constructor(
    private invoiceService: InvoiceService,
    private companyService: CompanyService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company = data;
        this.isHotel = data.shopType !== 'Super Market';
        this.displayedColumns = ['invoiceNumber', 'totalAmount', 'paymentStatus', 'invoiceDate', 'actions'];
      },
      error: () => {}
    });
  }

  loadInvoices(): void {
    this.invoiceService.getAllInvoices().subscribe({
      next: (data) => {
        this.allInvoices = data;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.filterPredicate = (invoice: Invoice, _filter: string) => {
          return this.matchInvoice(invoice);
        };
      }
    });
  }

  get displayedInvoices(): Invoice[] {
    const filtered = this.dataSource.filteredData;
    if (!filtered || filtered.length === 0) return [];
    const paginator = this.dataSource.paginator;
    if (!paginator) return filtered;
    const start = paginator.pageIndex * paginator.pageSize;
    return filtered.slice(start, start + paginator.pageSize);
  }

  matchInvoice(invoice: Invoice): boolean {
    const invoiceNo = (invoice.invoiceNumber || '').toLowerCase();
    const invDate   = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;

    if (this.searchInvoiceNo && !invoiceNo.includes(this.searchInvoiceNo.toLowerCase())) return false;
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
    this.searchFromDate = null;
    this.searchToDate = null;
    this.fromDateStr = '';
    this.toDateStr = '';
    this.dataSource.filter = '';
    this.dataSource.data = [...this.allInvoices];
  }

  viewInvoice(invoice: Invoice): void {
    this.invoiceService.getInvoiceById(invoice.invoiceId).subscribe({
      next: (detail) => this.selectedInvoice = detail
    });
  }

  reprintInvoice(): void {
    if (!this.selectedInvoice) return;
    ReceiptPrintComponent.print(this.selectedInvoice, this.company, 'CASH');
  }

  printInvoice(row: Invoice): void {
    this.selectedInvoice = row;
    this.reprintInvoice();
  }
}
