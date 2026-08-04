import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { InvoiceService } from '../../shared/services/invoice.service';
import { CompanyService } from '../../shared/services/company.service';
import { Invoice } from '../../shared/models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatTableModule,
    MatPaginatorModule, MatDatepickerModule,
    MatNativeDateModule
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
            <tr mat-header-row *matHeaderRowDef="recentColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: recentColumns;"></tr>
          </table>
        </div>
        <div class="paginator-wrapper">
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
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
  recentColumns: string[] = ['invoiceNumber', 'totalAmount', 'paymentStatus', 'invoiceDate'];

  searchInvoiceNo = '';
  searchStatus = '';
  searchFromDate: Date | null = null;
  searchToDate: Date | null = null;
  fromDateStr = '';
  toDateStr = '';

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
        this.recentColumns = ['invoiceNumber', 'totalAmount', 'paymentStatus', 'invoiceDate'];
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
}
