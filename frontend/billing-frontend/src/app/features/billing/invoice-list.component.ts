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

      <mat-form-field appearance="outline" class="search-field" *ngIf="!isHotel">
        <mat-label>Customer Name</mat-label>
        <input matInput [(ngModel)]="searchCustomerName" (input)="applyFilter()" placeholder="e.g. Ravi">
      </mat-form-field>

      <mat-form-field appearance="outline" class="search-field" *ngIf="!isHotel">
        <mat-label>Phone</mat-label>
        <input matInput [(ngModel)]="searchPhone" (input)="applyFilter()" placeholder="e.g. 9876543210">
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

        <ng-container matColumnDef="customerName">
          <th mat-header-cell *matHeaderCellDef mat-sort-header> Customer </th>
          <td mat-cell *matCellDef="let row"> {{ row.customerName }} </td>
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
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
    </div>

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
  searchCustomerName = '';
  searchPhone = '';
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
        if (!this.isHotel) {
          this.displayedColumns = ['invoiceNumber', 'customerName', 'totalAmount', 'paymentStatus', 'invoiceDate', 'actions'];
        } else {
          this.displayedColumns = ['invoiceNumber', 'totalAmount', 'paymentStatus', 'invoiceDate', 'actions'];
        }
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

  matchInvoice(invoice: Invoice): boolean {
    const invoiceNo = (invoice.invoiceNumber || '').toLowerCase();
    const custName  = (invoice.customerName || '').toLowerCase();
    const phone     = (invoice.customerPhone || '').toString();
    const invDate   = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;

    if (this.searchInvoiceNo && !invoiceNo.includes(this.searchInvoiceNo.toLowerCase())) return false;
    if (this.searchCustomerName && !custName.includes(this.searchCustomerName.toLowerCase())) return false;
    if (this.searchPhone && !phone.includes(this.searchPhone)) return false;
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
    this.searchCustomerName = '';
    this.searchPhone = '';
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
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        qrCodeDataUrl: this.qrCodeDataUrl,
        showMarkCompleted: true,
        onCompleted: () => this.completePayment(inv),
        isHotel: this.isHotel
      }
    });
  }
}
