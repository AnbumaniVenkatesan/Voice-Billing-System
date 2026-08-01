import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InvoiceService } from '../../shared/services/invoice.service';
import { CompanyService } from '../../shared/services/company.service';
import { Invoice } from '../../shared/models/models';
import { Company } from '../../shared/models/company.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { QrDialogComponent } from './qr-dialog.component';
import { PaymentSuccessDialogComponent } from './payment-success-dialog.component';
import { ReceiptPrintComponent } from './receipt-print.component';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule, MatDialogModule
  ],
  template: `
    <h2>Invoice History</h2>

    <div class="search-bar">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Invoice #</mat-label>
        <input matInput [(ngModel)]="searchInvoiceNo" (input)="applyFilter()" placeholder="e.g. INV-2026-001">
      </mat-form-field>

      <mat-form-field appearance="outline" class="search-field date-field">
        <mat-label>From Date</mat-label>
        <input matInput [matDatepicker]="fromPicker" [(ngModel)]="searchFromDate" (dateChange)="applyFilter()">
        <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
        <mat-datepicker #fromPicker></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="outline" class="search-field date-field">
        <mat-label>To Date</mat-label>
        <input matInput [matDatepicker]="toPicker" [(ngModel)]="searchToDate" (dateChange)="applyFilter()">
        <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
        <mat-datepicker #toPicker></mat-datepicker>
      </mat-form-field>

      <button mat-stroked-button color="warn" (click)="clearFilters()" class="clear-btn">
        <mat-icon>clear</mat-icon> Clear
      </button>
    </div>

    <div class="table-container">
      <table mat-table [dataSource]="dataSource" matSort>
        <ng-container matColumnDef="invoiceNumber">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> Invoice # </th>
          <td mat-cell *matCellDef="let row"> {{ row.invoiceNumber }} </td>
        </ng-container>

        <ng-container matColumnDef="totalAmount">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> Amount </th>
          <td mat-cell *matCellDef="let row"> ₹{{ row.totalAmount }} </td>
        </ng-container>

        <ng-container matColumnDef="paymentStatus">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> Status </th>
          <td mat-cell *matCellDef="let row">
            <span [class]="'status-' + row.paymentStatus">{{ row.paymentStatus }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="invoiceDate">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> Date </th>
          <td mat-cell *matCellDef="let row"> {{ row.invoiceDate | date:'medium' }} </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> Actions </th>
          <td mat-cell *matCellDef="let row">
            <button mat-icon-button color="primary" (click)="viewInvoice(row)">
              <mat-icon>visibility</mat-icon>
            </button>
            <button mat-icon-button color="accent" (click)="initiatePayment(row)"
                    *ngIf="row.paymentStatus?.toLowerCase() === 'pending'">
              <mat-icon>payment</mat-icon>
            </button>

          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>

    <div class="mobile-invoice-list" *ngIf="dataSource.filteredData.length > 0">
      <div class="mobile-invoice-card" *ngFor="let row of displayedInvoices">
        <div class="mic-top">
          <span class="mic-number">{{ row.invoiceNumber }}</span>
          <span [class]="'status-' + row.paymentStatus" class="mic-status">{{ row.paymentStatus }}</span>
        </div>
        <div class="mic-rows">
          <div class="mic-row">
            <span class="mic-label">Date</span>
            <span class="mic-value">{{ row.invoiceDate | date:'medium' }}</span>
          </div>
          <div class="mic-row">
            <span class="mic-label">Amount</span>
            <span class="mic-value mic-amount">₹{{ row.totalAmount }}</span>
          </div>
        </div>
        <div class="mic-actions">
          <button class="mic-btn view" (click)="viewInvoice(row)">
            <mat-icon>visibility</mat-icon> View
          </button>
          <button class="mic-btn print" (click)="printInvoice(row)">
            <mat-icon>print</mat-icon> Print
          </button>
          <button class="mic-btn pay" (click)="initiatePayment(row)"
                  *ngIf="row.paymentStatus?.toLowerCase() === 'pending'">
            <mat-icon>payment</mat-icon> Pay
          </button>
        </div>
      </div>
    </div>

    <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>

    <div class="invoice-detail" *ngIf="selectedInvoice">
      <h3>Invoice: {{ selectedInvoice.invoiceNumber }}</h3>
      <p><strong>Date:</strong> {{ selectedInvoice.invoiceDate | date:'medium' }}</p>

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
            <td>₹{{ item.price }}</td>
            <td>₹{{ item.total }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>Subtotal</strong></td>
            <td>₹{{ selectedInvoice.subtotal }}</td>
          </tr>
          <tr *ngIf="selectedInvoice.discount > 0">
            <td colspan="3"><strong>Discount</strong></td>
            <td>-₹{{ selectedInvoice.discount }}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>SGST (1.5%)</strong></td>
            <td>₹{{ selectedInvoice.sgstAmount }}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>CGST (1.5%)</strong></td>
            <td>₹{{ selectedInvoice.cgstAmount }}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>Total</strong></td>
            <td><strong>₹{{ selectedInvoice.totalAmount }}</strong></td>
          </tr>
        </tfoot>
      </table>

      <button mat-button (click)="selectedInvoice = null">Close</button>
      <button mat-raised-button color="primary" (click)="reprintInvoice()">
        <mat-icon>print</mat-icon> Print
      </button>
    </div>

  `,
  styles: [`
    h2 { margin-bottom: 20px; }
    .search-bar {
      display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
      margin-bottom: 20px; background: white; padding: 16px; border-radius: 8px;
    }
    .search-field { flex: 1 1 160px; min-width: 140px; }
    .date-field { flex: 1 1 180px; }
    .clear-btn { height: 56px; }
    .table-container { overflow: auto; background: white; border-radius: 8px; margin-bottom: 40px; }
    table { width: 100%; }
    .status-pending { color: #ff9800; font-weight: 500; text-transform: capitalize; }
    .status-completed { color: #4caf50; font-weight: 500; text-transform: capitalize; }
    .status-failed { color: #f44336; font-weight: 500; text-transform: capitalize; }
    .invoice-detail {
      margin-top: 24px;
      background: white;
      padding: 24px;
      border-radius: 8px;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .detail-table th, .detail-table td {
      padding: 10px 16px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    .detail-table th { background: #f5f5f5; }
    .detail-table tfoot td { border-top: 2px solid #ddd; }
    .qr-card {
      margin-top: 24px; background: white; padding: 24px;
      border-radius: 8px; border: 2px solid #4caf50;
    }
    .qr-content { display: flex; flex-direction: column; align-items: center; margin: 16px 0; }
    .qr-image { background: white; padding: 16px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 16px; }
    .qr-image img { width: 220px; height: 220px; display: block; }
    .qr-details { text-align: center; }
    .qr-details p { margin: 6px 0; font-size: 14px; }
    .qr-actions { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }

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
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: capitalize;
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
      color: #2E7D32;
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
      font-family: 'Roboto', sans-serif;
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

    .mic-btn.pay {
      background: #FFFBEB;
      color: #B45309;
    }

    .mic-btn.pay:hover {
      background: #FEF3C7;
    }

    @media (max-width: 767.98px) {
      h2 {
        font-size: 24px;
      }
      :host {
        display: block;
        padding: 16px;
      }
      .search-bar {
        padding: 12px;
      }
      .search-field {
        flex: 1 1 100%;
        min-width: 100%;
      }
      .date-field {
        flex: 1 1 calc(50% - 4px);
        min-width: calc(50% - 4px);
      }
      .clear-btn {
        width: 100%;
        height: 48px;
      }
      .table-container {
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
  qrCodeDataUrl = '';
  qrInvoice: Invoice | null = null;
  company: Company | null = null;
  isHotel = false;

  searchInvoiceNo = '';
  searchFromDate: Date | null = null;
  searchToDate: Date | null = null;

  private allInvoices: Invoice[] = [];

  constructor(
    private invoiceService: InvoiceService,
    private companyService: CompanyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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

  clearFilters(): void {
    this.searchInvoiceNo = '';
    this.searchFromDate = null;
    this.searchToDate = null;
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
    ReceiptPrintComponent.print(this.selectedInvoice, this.company, this.selectedInvoice.paymentStatus === 'completed' ? 'CASH' : 'PENDING');
  }

  printInvoice(row: Invoice): void {
    this.selectedInvoice = row;
    this.reprintInvoice();
  }

  initiatePayment(invoice: Invoice): void {
    this.qrInvoice = invoice;
    const upiId = this.company?.upiId || 'shop@upi';
    const shopName = this.company?.companyName || 'Smart Billing Shop';

    const paymentData = [
      'upi://pay',
      '?pa=' + encodeURIComponent(upiId),
      '&pn=' + encodeURIComponent(shopName),
      '&tn=Invoice ' + invoice.invoiceNumber,
      '&am=' + invoice.totalAmount,
      '&cu=INR'
    ].join('');

    QRCode.toDataURL(paymentData, {
      width: 256, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    }).then((url) => {
      this.qrCodeDataUrl = url;
      this.openQRPopup();
    }).catch(() => {
      this.snackBar.open('Error generating QR code', 'Close', { duration: 3000 });
    });
  }

  private completePayment(invoice: Invoice): void {
    this.invoiceService.markCompleted(invoice.invoiceId, 'upi').subscribe({
      next: () => {
        invoice.paymentStatus = 'completed';
        this.dialog.open(PaymentSuccessDialogComponent, {
          width: '360px',
          disableClose: true,
          data: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount }
        });
        this.autoPrintReceipt(invoice);
        this.loadInvoices();
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        this.snackBar.open('Error updating status', 'Close', { duration: 3000 });
      }
    });
  }

  autoPrintReceipt(invoice: any): void {
    ReceiptPrintComponent.print(invoice, this.company, 'CASH');
  }

  printQR(): void {
    const inv = this.qrInvoice;
    if (!inv) return;
    ReceiptPrintComponent.print(inv, this.company, 'UPI/QR');
  }

  openQRPopup(): void {
    if (!this.qrInvoice) return;
    const inv = this.qrInvoice;
    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount,
        qrCodeDataUrl: this.qrCodeDataUrl,
        showMarkCompleted: true,
        onCompleted: () => this.completePayment(inv),
        isHotel: this.isHotel
      }
    });
  }
}
