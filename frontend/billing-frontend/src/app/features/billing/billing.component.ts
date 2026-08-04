import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService } from '../../shared/services/product.service';
import { InvoiceService } from '../../shared/services/invoice.service';
import { CompanyService } from '../../shared/services/company.service';
import { Product, Invoice, InvoiceItemRequest, TaxSlab } from '../../shared/models/models';
import { Company } from '../../shared/models/company.model';
import { aggregateTaxSlabs, formatMoney } from '../../shared/utils/gst.util';
import { QrDialogComponent } from './qr-dialog.component';
import { PaymentSuccessDialogComponent } from './payment-success-dialog.component';
import { ReceiptPrintComponent } from './receipt-print.component';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatSnackBarModule, MatDialogModule
  ],
  template: `
    <h2>Billing</h2>

    <div class="billing-layout">
      <div class="billing-form">
        <mat-card>
          <mat-card-content>
            <div class="product-search">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search product by name</mat-label>
                <input matInput [(ngModel)]="searchTerm" name="searchTerm" (input)="onSearch()">
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>

              <div class="search-results" *ngIf="searchResults.length > 0">
                <div class="search-item" *ngFor="let p of searchResults"
                     (click)="addToCart(p)">
                  <span>{{ p.productName }}</span>
                  <span class="price">₹{{ p.price }}</span>
                  <!-- Stock hidden for hotel use case
                  <span class="stock">Stock: {{ p.stock }}</span>
                  -->
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="cart-card" *ngIf="cart.length > 0">
          <mat-card-header>
            <mat-card-title>Cart</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="cart-item" *ngFor="let item of cart; let i = index">
              <span class="cart-item-name" title="{{ item.productName }}">{{ item.productName }}</span>
              <span class="cart-item-price">₹{{ item.price }}</span>
              <div class="cart-item-actions">
                <button mat-icon-button (click)="updateQuantity(i, -1)">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="qty">{{ item.quantity }}</span>
                <button mat-icon-button (click)="updateQuantity(i, 1)">
                  <mat-icon>add</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="removeFromCart(i)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="billing-summary" *ngIf="cart.length > 0">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Order Summary</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary-row">
              <span>Subtotal</span>
              <span>₹{{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="tax-slab-row" *ngFor="let slab of taxSlabs">
              <span>SGST ({{ slab.sgstRate }}%)</span>
              <span>₹{{ formatMoney(slab.sgstAmount) }}</span>
            </div>
            <div class="tax-slab-row" *ngFor="let slab of taxSlabs">
              <span>CGST ({{ slab.cgstRate }}%)</span>
              <span>₹{{ formatMoney(slab.cgstAmount) }}</span>
            </div>
            <div class="summary-row discount">
              <mat-form-field appearance="outline" class="discount-field">
                <mat-label>Discount (₹)</mat-label>
                <input matInput type="number" [(ngModel)]="discount" (input)="calculateTotal()">
              </mat-form-field>
            </div>
            <hr>
            <div class="summary-row total">
              <span>Total</span>
              <span>₹{{ totalAmount.toFixed(2) }}</span>
            </div>

            <div class="payment-buttons">
              <button mat-raised-button color="primary" class="full-width"
                      (click)="generateQRInvoice()"
                      [disabled]="generating">
                <mat-icon>qr_code</mat-icon> Generate QR
              </button>
              <button mat-raised-button color="accent" class="full-width"
                      (click)="generateCashInvoice()"
                      [disabled]="generating">
                <mat-icon>payments</mat-icon> Cash
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- Cash Receipt Dialog -->
    <ng-template #cashReceiptDialog>
      <div class="receipt-card">
        <h3><mat-icon>receipt_long</mat-icon> {{ createdInvoice?.invoiceNumber }}</h3>
        <div class="receipt-details">
          <p><strong>Amount:</strong> ₹{{ createdInvoice?.totalAmount }}</p>
          <p><strong>Payment:</strong> <span class="status-cash">Cash</span></p>
        </div>
        <div class="receipt-actions">
          <button mat-raised-button color="accent" (click)="printCashReceipt()">
            <mat-icon>print</mat-icon> Print
          </button>
          <button mat-raised-button color="primary" (click)="changeToQr()">
            <mat-icon>qr_code</mat-icon> Change to QR
          </button>
          <button mat-stroked-button (click)="dialogRef?.close()">
            <mat-icon>close</mat-icon> Close
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    h2 { margin-bottom: 20px; }
    .billing-layout { display: flex; gap: 24px; }
    .billing-form { flex: 2; }
    .billing-summary { flex: 1; }
    .full-width { width: 100%; }
    .product-search { margin-top: 16px; }
    .search-field { width: 100%; }
    .search-results {
      border: 1px solid #ddd;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      background: white;
    }
    .search-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 16px;
      cursor: pointer;
      border-bottom: 1px solid #eee;
    }
    .search-item:hover { background: #f5f5f5; }
    .price { color: #4caf50; font-weight: 500; }
    .stock { color: #999; font-size: 12px; }
    .cart-item {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .cart-item-name {
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cart-item-price { color: #666; font-size: 13px; }
    .cart-item-actions { display: flex; align-items: center; gap: 4px; }
    .qty { min-width: 24px; text-align: center; font-weight: 500; font-size: 12px; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .tax-slab-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      color: #555;
      font-size: 13px;
    }
    .total { font-size: 18px; font-weight: 700; color: #333; }
    .discount-field { width: 120px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 12px 0; }
    .payment-buttons { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }

    .receipt-card {
      text-align: center;
    }
    .receipt-card h3 {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 0; margin-bottom: 16px;
    }
    .receipt-details { margin: 16px 0; }
    .receipt-details p { margin: 6px 0; font-size: 14px; }
    .status-cash { color: #4caf50; font-weight: 500; }
    .receipt-actions { display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }

    @media (max-width: 1023.98px) {
      .billing-layout {
        flex-direction: column;
      }
      .billing-form,
      .billing-summary {
        width: 100%;
      }
    }

    @media (max-width: 767.98px) {
      :host {
        display: block;
        padding: 16px;
      }
      h2 {
        font-size: 24px;
        margin-bottom: 16px;
      }
      .cart-item {
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 8px;
      }
      .cart-item-actions {
        justify-content: flex-end;
      }
      .payment-buttons button {
        height: 48px;
      }
      .receipt-card {
        padding: 20px 16px;
      }
      .receipt-actions button {
        flex: 1;
      }
    }

    @media (max-width: 479.98px) {
      .billing-layout {
        gap: 16px;
      }
      .cart-item-actions .qty {
        min-width: 20px;
        font-size: 11px;
      }
    }
  `]
})
export class BillingComponent implements OnInit {
  allProducts: Product[] = [];
  searchResults: Product[] = [];
  searchTerm = '';
  cart: (InvoiceItemRequest & { productName: string; price: number; gstPercentage: number })[] = [];
  discount = 0;
  subtotal = 0;
  taxSlabs: TaxSlab[] = [];
  totalAmount = 0;
  generating = false;
  formatMoney = formatMoney;

  showCashReceipt = false;
  createdInvoice: Invoice | null = null;
  qrCodeDataUrl = '';
  company: Company | null = null;
  isHotel = false;
  dialogRef: any;
  switchingToQr = false;

  @ViewChild('cashReceiptDialog') cashReceiptDialog!: TemplateRef<any>;

  constructor(
    private productService: ProductService,
    private invoiceService: InvoiceService,
    private companyService: CompanyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe(p => this.allProducts = p);
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company = data;
        this.isHotel = data.shopType !== 'Super Market';
      },
      error: () => {}
    });
  }

  onSearch(): void {
    if (this.searchTerm.length < 1) {
      this.searchResults = [];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.searchResults = this.allProducts.filter(p =>
      p.status === 'active' && (
        p.productName.toLowerCase().includes(term) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(term)) ||
        (p.aliases && p.aliases.some(a => a.toLowerCase().includes(term)))
      )
    ).slice(0, 5);
  }

  addToCart(product: Product): void {
    const existing = this.cart.find(c => c.productId === product.productId);
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({
        productId: product.productId,
        productName: product.productName,
        quantity: 1,
        price: product.price,
        gstPercentage: product.gstPercentage || 0
      });
    }
    this.calculateTotal();
    this.searchResults = [];
    this.searchTerm = '';
  }

  updateQuantity(index: number, delta: number): void {
    const item = this.cart[index];
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart.splice(index, 1);
    }
    this.calculateTotal();
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.calculateTotal();
  }

  calculateTotal(): void {
    this.subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.taxSlabs = aggregateTaxSlabs(this.cart.map(item => ({
      total: item.price * item.quantity,
      gstPercentage: item.gstPercentage
    })));
    // Total is same as subtotal since GST is included in prices
    this.totalAmount = this.subtotal - this.discount;
  }

  generateQRInvoice(): void {
    // Walk-in customer is resolved automatically by the backend
    this.generating = true;

    const request = {
      items: this.cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
      discount: this.discount,
      paymentMethod: 'upi'
    };

    this.invoiceService.createInvoice(request).subscribe({
      next: (invoice) => {
        this.createdInvoice = invoice;
        this.cart = [];
        this.discount = 0;
        this.calculateTotal();
        this.generateQRCode(invoice);
      },
      error: (err) => {
        this.generating = false;
        this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 5000 });
      }
    });
  }

  private completeQrPayment(): void {
    const inv = this.createdInvoice;
    if (!inv) return;
    this.dialog.open(PaymentSuccessDialogComponent, {
      width: '360px',
      disableClose: true,
      data: { invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount }
    });
    this.printReceiptFor(inv, 'UPI/QR');
    this.createdInvoice = null;
    this.generating = false;
  }

  private printReceiptFor(inv: Invoice, paymentMethod: string): void {
    ReceiptPrintComponent.print(inv, this.company, paymentMethod);
  }

  generateQRCode(invoice: Invoice): void {
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
      this.generating = false;
      this.openQRPopup();
      this.snackBar.open('Invoice created! Show QR to customer.', 'Close', { duration: 4000 });
    }).catch(() => {
      this.qrCodeDataUrl = '';
      this.generating = false;
    });
  }

  openQRPopup(): void {
    if (!this.createdInvoice) return;
    const inv = this.createdInvoice;
    this.dialog.open(QrDialogComponent, {
      width: '400px',
      data: {
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount,
        qrCodeDataUrl: this.qrCodeDataUrl,
        onCompleted: () => this.completeQrPayment(),
        onChangeToCash: () => this.switchToCash(),
        isHotel: this.isHotel
      }
    });
  }
  generateCashInvoice(): void {
    // Walk-in customer is resolved automatically by the backend
    this.generating = true;

    const request = {
      items: this.cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
      discount: this.discount,
      paymentMethod: 'cash'
    };

    this.invoiceService.createInvoice(request).subscribe({
      next: (invoice) => {
        this.createdInvoice = invoice;
        this.showCashReceipt = true;
        this.cart = [];
        this.discount = 0;
        this.calculateTotal();
        this.generating = false;
        this.snackBar.open('Invoice created! Cash payment.', 'Close', { duration: 4000 });
        this.openCashReceipt();
      },
      error: (err) => {
        this.generating = false;
        this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 5000 });
      }
    });
  }

  private openCashReceipt(): void {
    this.dialogRef = this.dialog.open(this.cashReceiptDialog!, {
      width: '400px'
    });
    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null;
      if (this.switchingToQr) {
        this.switchingToQr = false;
        return;
      }
      this.showCashReceipt = false;
      this.createdInvoice = null;
    });
  }

  private switchToCash(): void {
    const inv = this.createdInvoice;
    if (!inv) return;
    this.showCashReceipt = true;
    this.openCashReceipt();
  }

  changeToQr(): void {
    const inv = this.createdInvoice;
    if (!inv) return;
    this.switchingToQr = true;
    this.dialogRef?.close();
    this.generateQRCode(inv);
  }

  printCashReceipt(): void {
    this.printReceipt();
    this.dialogRef?.close();
  }

  printReceipt(): void {
    const inv = this.createdInvoice;
    if (!inv) return;

    this.printReceiptFor(inv, this.showCashReceipt ? 'CASH' : 'UPI/QR');

    if (this.showCashReceipt) {
      this.showCashReceipt = false;
      this.createdInvoice = null;
    }
  }
}
