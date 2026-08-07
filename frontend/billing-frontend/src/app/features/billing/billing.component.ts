import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
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
    CommonModule, FormsModule, MatIconModule,
    MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="billing-page">
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>receipt_long</mat-icon>
          </div>
          <div>
            <h1>Billing</h1>
            <p class="subtitle">Search products, build the cart and generate bills instantly</p>
          </div>
        </div>
      </div>

      <div class="billing-layout">
        <div class="billing-form">
          <div class="search-card">
            <div class="section-header">
              <div class="section-icon blue">
                <mat-icon>search</mat-icon>
              </div>
              <div>
                <h2>Search Products</h2>
                <p class="section-desc">Type the product name to add items</p>
              </div>
            </div>
            <div class="section-divider"></div>
            <div class="search-box">
              <mat-icon class="search-ico">search</mat-icon>
              <input class="search-field" [(ngModel)]="searchTerm" name="searchTerm"
                     (input)="onSearch()" placeholder="Search product by name...">
            </div>

            <div class="search-results" *ngIf="searchResults.length > 0">
              <div class="search-item" *ngFor="let p of searchResults" (click)="addToCart(p)">
                <div class="search-item-info">
                  <span class="search-item-name">{{ p.productName }}</span>
                  <span class="search-item-sub" *ngIf="p.tamilName">{{ p.tamilName }}</span>
                </div>
                <span class="search-item-price">₹{{ p.price }}</span>
              </div>
            </div>
          </div>

          <div class="cart-card" *ngIf="cart.length > 0">
            <div class="section-header">
              <div class="section-icon green">
                <mat-icon>shopping_cart</mat-icon>
              </div>
              <div>
                <h2>Cart</h2>
                <p class="section-desc">{{ cart.length }} item{{ cart.length === 1 ? '' : 's' }}</p>
              </div>
            </div>
            <div class="section-divider"></div>
            <div class="cart-item" *ngFor="let item of cart; let i = index">
              <div class="cart-item-info">
                <span class="cart-item-name" title="{{ item.productName }}">{{ item.productName }}</span>
                <span class="cart-item-price">₹{{ item.price }}</span>
              </div>
              <div class="cart-item-actions">
                <button class="qty-btn" (click)="updateQuantity(i, -1)">
                  <mat-icon>remove</mat-icon>
                </button>
                <span class="qty">{{ item.quantity }}</span>
                <button class="qty-btn" (click)="updateQuantity(i, 1)">
                  <mat-icon>add</mat-icon>
                </button>
                <button class="qty-btn delete" (click)="removeFromCart(i)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="billing-summary" *ngIf="cart.length > 0">
          <div class="summary-card">
            <div class="section-header">
              <div class="section-icon purple">
                <mat-icon>receipt</mat-icon>
              </div>
              <div>
                <h2>Order Summary</h2>
                <p class="section-desc">Bill breakdown</p>
              </div>
            </div>
            <div class="section-divider"></div>

            <div class="summary-rows">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>₹{{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="summary-row tax" *ngFor="let slab of taxSlabs">
                <span>SGST ({{ slab.sgstRate }}%)</span>
                <span>₹{{ formatMoney(slab.sgstAmount) }}</span>
              </div>
              <div class="summary-row tax" *ngFor="let slab of taxSlabs">
                <span>CGST ({{ slab.cgstRate }}%)</span>
                <span>₹{{ formatMoney(slab.cgstAmount) }}</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row total">
                <span>Grand Total</span>
                <span>₹{{ totalAmount.toFixed(2) }}</span>
              </div>
            </div>

            <div class="payment-buttons">
              <button class="btn btn-primary" (click)="generateQRInvoice()" [disabled]="generating">
                <mat-icon>qr_code</mat-icon> Generate QR
              </button>
              <button class="btn btn-secondary" (click)="generateCashInvoice()" [disabled]="generating">
                <mat-icon>payments</mat-icon> Cash
              </button>
            </div>
          </div>
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
            <button class="btn btn-secondary" (click)="printCashReceipt()">
              <mat-icon>print</mat-icon> Print
            </button>
            <button class="btn btn-primary" (click)="changeToQr()">
              <mat-icon>qr_code</mat-icon> Change to QR
            </button>
            <button class="btn btn-neutral" (click)="dialogRef?.close()">
              <mat-icon>close</mat-icon> Close
            </button>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    :host {
      font-family: 'Inter', sans-serif;
      display: block;
    }

    /* ====== PAGE ====== */
    .billing-page {
      background: #F8FAFC;
      min-height: 100vh;
      padding: 32px 40px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #1E40AF, #3B82F6);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-icon mat-icon {
      color: white;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
    }

    .subtitle {
      font-size: 14px;
      color: #64748B;
      margin-top: 2px;
    }

    /* ====== LAYOUT ====== */
    .billing-layout {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    .billing-form {
      flex: 1;
      min-width: 0;
    }

    .billing-summary {
      flex: 0 0 360px;
    }

    /* ====== CARDS ====== */
    .search-card,
    .cart-card,
    .summary-card {
      background: #FFFFFF;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      border: 1px solid #E5E7EB;
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .section-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: white;
    }

    .section-icon.blue { background: linear-gradient(135deg, #1E40AF, #3B82F6); }
    .section-icon.green { background: linear-gradient(135deg, #047857, #10B981); }
    .section-icon.purple { background: linear-gradient(135deg, #6D28D9, #8B5CF6); }

    .section-header h2 {
      font-size: 17px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    .section-desc {
      font-size: 13px;
      color: #64748B;
      margin-top: 1px;
    }

    .section-divider {
      height: 1px;
      background: #E5E7EB;
      margin: 16px 0;
    }

    /* ====== SEARCH ====== */
    .search-box {
      position: relative;
    }

    .search-ico {
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      color: #9CA3AF;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .search-field {
      width: 100%;
      height: 54px;
      border: 1px solid #E5E7EB;
      border-radius: 27px;
      padding: 0 20px 0 52px;
      font-size: 15px;
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      color: #1E293B;
      outline: none;
      background: #FFFFFF;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    .search-field::placeholder {
      color: #9CA3AF;
    }

    .search-field:focus {
      border-color: #1D4ED8;
      box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
    }

    .search-results {
      margin-top: 12px;
      border: 1px solid #E5E7EB;
      border-radius: 14px;
      overflow: hidden;
      background: #FFFFFF;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    }

    .search-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #F1F5F9;
      transition: background 0.15s ease;
    }

    .search-item:last-child {
      border-bottom: none;
    }

    .search-item:hover {
      background: #F8FAFC;
    }

    .search-item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .search-item-name {
      font-size: 15px;
      font-weight: 500;
      color: #1E293B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-item-sub {
      font-size: 12px;
      color: #64748B;
    }

    .search-item-price {
      color: #059669;
      font-size: 15px;
      font-weight: 600;
      white-space: nowrap;
    }

    /* ====== CART ====== */
    .cart-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #F1F5F9;
    }

    .cart-item:last-child {
      border-bottom: none;
    }

    .cart-item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .cart-item-name {
      font-weight: 500;
      color: #1E293B;
      font-size: 15px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cart-item-price {
      color: #64748B;
      font-size: 13px;
    }

    .cart-item-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .qty-btn {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      border: 1px solid #E5E7EB;
      background: #FFFFFF;
      color: #1D4ED8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .qty-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .qty-btn:hover {
      background: #EEF2FF;
      border-color: #BFDBFE;
    }

    .qty-btn.delete {
      color: #6B7280;
    }

    .qty-btn.delete:hover {
      background: #FEF2F2;
      border-color: #FCA5A5;
      color: #DC2626;
    }

    .qty {
      min-width: 28px;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
      color: #1E293B;
    }

    /* ====== SUMMARY ====== */
    .summary-card {
      margin-bottom: 0;
    }

    .summary-rows {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .summary-row.tax {
      font-size: 13px;
      color: #64748B;
    }

    .summary-row.total {
      font-size: 20px;
      font-weight: 700;
      color: #1E293B;
    }

    .summary-row.total span:last-child {
      color: #1D4ED8;
    }

    .summary-divider {
      height: 1px;
      background: #E5E7EB;
    }

    /* ====== BUTTONS ====== */
    .btn {
      flex: 0 1 auto;
      width: 100%;
      min-width: 160px;
      height: 52px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .btn-primary {
      background: #1D4ED8;
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(29, 78, 216, 0.25);
    }

    .btn-primary:hover:not(:disabled) {
      background: #1E40AF;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(29, 78, 216, 0.3);
    }

    .btn-primary:disabled {
      background: #93C5FD;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-secondary {
      background: #DBEAFE;
      color: #1D4ED8;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #BFDBFE;
    }

    .btn-secondary:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .btn-neutral {
      background: #F3F4F6;
      color: #374151;
    }

    .btn-neutral:hover {
      background: #E5E7EB;
    }

    .payment-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }

    /* ====== RECEIPT DIALOG ====== */
    .receipt-card {
      text-align: center;
      font-family: 'Poppins', sans-serif;
    }

    .receipt-card h3 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 0;
      margin-bottom: 16px;
      color: #1E293B;
    }

    .receipt-details {
      margin: 16px 0;
    }

    .receipt-details p {
      margin: 6px 0;
      font-size: 14px;
      color: #374151;
    }

    .status-cash {
      color: #059669;
      font-weight: 600;
    }

    .receipt-actions {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .receipt-actions .btn {
      width: auto;
      min-width: 0;
      padding: 0 20px;
    }

    /* ====== RESPONSIVE ====== */
    @media (max-width: 1023.98px) {
      .billing-layout {
        flex-direction: column;
      }

      .billing-form,
      .billing-summary {
        width: 100%;
        flex: 1;
      }
    }

    @media (max-width: 767.98px) {
      .billing-page {
        padding: 20px 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 24px;
      }

      .page-header h1 {
        font-size: 24px;
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
      }
    }
  `]
})
export class BillingComponent implements OnInit {
  allProducts: Product[] = [];
  searchResults: Product[] = [];
  searchTerm = '';
  cart: (InvoiceItemRequest & { productName: string; price: number; gstPercentage: number })[] = [];
  subtotal = 0;
  taxSlabs: TaxSlab[] = [];
  totalAmount = 0;
  generating = false;
  formatMoney = formatMoney;

  showCashReceipt = false;
  createdInvoice: Invoice | null = null;
  qrCodeDataUrl = '';
  company: Company | null = null;
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
    this.totalAmount = this.subtotal;
  }

  generateQRInvoice(): void {
    this.generating = true;

    const request = {
      items: this.cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
      paymentMethod: 'upi'
    };

    this.invoiceService.createInvoice(request).subscribe({
      next: (invoice) => {
        this.createdInvoice = invoice;
        this.cart = [];
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
      this.snackBar.open('Invoice created! Show QR to guest.', 'Close', { duration: 4000 });
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
        onChangeToCash: () => this.switchToCash()
      }
    });
  }
  generateCashInvoice(): void {
    this.generating = true;

    const request = {
      items: this.cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
      paymentMethod: 'cash'
    };

    this.invoiceService.createInvoice(request).subscribe({
      next: (invoice) => {
        this.createdInvoice = invoice;
        this.showCashReceipt = true;
        this.cart = [];
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
