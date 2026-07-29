import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomerService } from '../../shared/services/customer.service';
import { ProductService } from '../../shared/services/product.service';
import { InvoiceService } from '../../shared/services/invoice.service';
import { CompanyService } from '../../shared/services/company.service';
import { Customer, Product, Invoice, InvoiceItemRequest } from '../../shared/models/models';
import { Company } from '../../shared/models/company.model';
import { QrDialogComponent } from './qr-dialog.component';
import { PaymentSuccessDialogComponent } from './payment-success-dialog.component';
import { ReceiptPrintComponent } from './receipt-print.component';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatAutocompleteModule,
    MatSnackBarModule, MatDialogModule
  ],
  template: `
    <h2>Billing</h2>

    <div class="billing-layout">
      <div class="billing-form">
        <mat-card>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width" *ngIf="!isHotel">
              <mat-label>Select Customer</mat-label>
              <input #customerInput matInput type="text"
                     (input)="onCustomerInput($event)"
                     [matAutocomplete]="customerAuto">
              <mat-autocomplete #customerAuto="matAutocomplete"
                                [displayWith]="displayCustomer"
                                (optionSelected)="onCustomerSelected($event)">
                <mat-option *ngFor="let c of filteredCustomers" [value]="c">
                  {{ c.customerName }} - {{ c.phone }}
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>

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
              <div class="cart-item-info">
                <span class="product-name">{{ item.productName }}</span>
                <span class="product-price">₹{{ item.price }} each</span>
              </div>
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
            <div class="summary-row">
              <span>SGST (1.5%)</span>
              <span>₹{{ sgstAmount.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>CGST (1.5%)</span>
              <span>₹{{ cgstAmount.toFixed(2) }}</span>
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

    <!-- Cash Receipt Display -->
    <div class="result-overlay" *ngIf="showCashReceipt" (click)="showCashReceipt = false">
      <div class="receipt-card" (click)="$event.stopPropagation()">
        <h3><mat-icon>receipt_long</mat-icon> {{ createdInvoice?.invoiceNumber }}</h3>
        <div class="receipt-details">
          <p><strong>Amount:</strong> ₹{{ createdInvoice?.totalAmount }}</p>
          <p><strong>Payment:</strong> <span class="status-cash">Cash</span></p>
        </div>
        <div class="receipt-actions">
          <button mat-raised-button color="accent" (click)="printReceipt()">
            <mat-icon>print</mat-icon> Print
          </button>
          <button mat-stroked-button (click)="showCashReceipt = false">
            <mat-icon>close</mat-icon> Close
          </button>
        </div>
      </div>
    </div>
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .product-name { font-weight: 500; }
    .product-price { color: #666; font-size: 13px; margin-left: 8px; }
    .cart-item-actions { display: flex; align-items: center; gap: 4px; }
    .qty { min-width: 30px; text-align: center; font-weight: 500; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .total { font-size: 18px; font-weight: 700; color: #333; }
    .discount-field { width: 120px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 12px 0; }
    .payment-buttons { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }

    .result-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 1000;
    }
    .receipt-card {
      background: white; border-radius: 8px; padding: 24px;
      max-width: 400px; width: 90%; text-align: center;
    }
    .receipt-card h3 {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 0; margin-bottom: 16px;
    }
    .qr-image { margin: 16px 0; }
    .qr-image img { width: 220px; height: 220px; display: block; margin: 0 auto; }
    .receipt-details { margin: 16px 0; }
    .receipt-details p { margin: 6px 0; font-size: 14px; }
    .status-pending { color: #ff9800; font-weight: 500; }
    .status-cash { color: #4caf50; font-weight: 500; }
    .receipt-actions { display: flex; gap: 8px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
  `]
})
export class BillingComponent implements OnInit {
  @ViewChild('customerInput') customerInput!: ElementRef<HTMLInputElement>;
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  customerSearchText = '';
  allProducts: Product[] = [];
  searchResults: Product[] = [];
  searchTerm = '';
  selectedCustomerId: number | null = null;
  cart: (InvoiceItemRequest & { productName: string; price: number })[] = [];
  discount = 0;
  subtotal = 0;
  gstAmount = 0;
  sgstAmount = 0;
  cgstAmount = 0;
  totalAmount = 0;
  generating = false;

  showCashReceipt = false;
  createdInvoice: Invoice | null = null;
  qrCodeDataUrl = '';
  company: Company | null = null;
  isHotel = false;

  constructor(
    private customerService: CustomerService,
    private productService: ProductService,
    private invoiceService: InvoiceService,
    private companyService: CompanyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.customerService.getAllCustomers().subscribe(c => {
      this.customers = c;
      this.filteredCustomers = c;
    });
    this.productService.getAllProducts().subscribe(p => this.allProducts = p);
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company = data;
        this.isHotel = data.shopType !== 'Super Market';
      },
      error: () => {}
    });
  }

  filterCustomers(): void {
    if (typeof this.customerSearchText !== 'string') return;
    const term = this.customerSearchText.toLowerCase();
    this.filteredCustomers = this.customers.filter(c =>
      c.customerName.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  }

  onCustomerInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customerSearchText = value;
    this.selectedCustomerId = null;
    this.filterCustomers();
  }

  onCustomerSelected(event: any): void {
    const c: Customer = event.option.value;
    this.selectedCustomerId = c.customerId;
    this.customerSearchText = `${c.customerName} - ${c.phone}`;
    if (this.customerInput) {
      this.customerInput.nativeElement.value = this.customerSearchText;
    }
  }

  displayCustomer = (customer: Customer | null): string => {
    if (!customer) return this.customerSearchText;
    return `${customer.customerName} - ${customer.phone}`;
  };

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
        price: product.price
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
    const taxPercent = (this.company?.taxPercentage && this.company.taxPercentage > 0) ? this.company.taxPercentage : 3;
    // Inclusive GST: reverse-calculate from subtotal
    this.gstAmount = Math.round(this.subtotal * taxPercent / (100 + taxPercent) * 100) / 100;
    this.sgstAmount = Math.round(this.gstAmount / 2 * 100) / 100;
    this.cgstAmount = Math.round((this.gstAmount - this.sgstAmount) * 100) / 100;
    // Total is same as subtotal since GST is included in prices
    this.totalAmount = this.subtotal - this.discount;
  }

  generateQRInvoice(): void {
    // Auto-assign walk-in customer (ID 1) if none selected
    const customerId = this.selectedCustomerId || 1;
    this.generating = true;

    const request = {
      customerId: customerId,
      items: this.cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
      discount: this.discount
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
    this.invoiceService.markCompleted(inv.invoiceId, 'upi').subscribe({
      next: () => {
        this.dialog.open(PaymentSuccessDialogComponent, {
          width: '360px',
          disableClose: true,
          data: { invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount }
        });
        this.printReceiptFor(inv, 'UPI/QR');
        this.createdInvoice = null;
        this.generating = false;
      },
      error: () => this.snackBar.open('Error updating status', 'Close', { duration: 3000 })
    });
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
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        qrCodeDataUrl: this.qrCodeDataUrl,
        onCompleted: () => this.completeQrPayment(),
        isHotel: this.isHotel
      }
    });
  }
  generateCashInvoice(): void {
    // Auto-assign walk-in customer (ID 1) if none selected
    const customerId = this.selectedCustomerId || 1;
    this.generating = true;

    const request = {
      customerId: customerId,
      items: this.cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
      discount: this.discount
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
      },
      error: (err) => {
        this.generating = false;
        this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 5000 });
      }
    });
  }

  printReceipt(): void {
    const inv = this.createdInvoice;
    if (!inv) return;

    if (this.showCashReceipt) {
      this.invoiceService.markCompleted(inv.invoiceId, 'cash').subscribe({
        next: () => {
          this.dialog.open(PaymentSuccessDialogComponent, {
            width: '360px',
            disableClose: true,
            data: { invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount }
          });
        },
        error: () => console.error('Failed to mark completed')
      });
    }

    this.printReceiptFor(inv, this.showCashReceipt ? 'CASH' : 'UPI/QR');

    if (this.showCashReceipt) {
      this.showCashReceipt = false;
      this.createdInvoice = null;
    }
  }
}
