import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/models/models';

export interface ProductSearchResult {
  product: Product;
  spokenText: string;
  quantity: number;
  unit: string;
}

@Component({
  selector: 'app-product-search-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="dialog-overlay">
      <div class="dialog-container">
        <div class="dialog-header">
          <div class="header-content">
            <div class="dialog-icon">
              <mat-icon>search</mat-icon>
            </div>
            <div>
              <h2>Search Product</h2>
              <p class="mapping-info">
                Mapping "<strong>{{ data.spokenText }}</strong>"
                ({{ data.quantity }} {{ data.unit }})
              </p>
            </div>
          </div>
          <button class="close-btn" (click)="onCancel()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="search-section">
          <div class="search-bar">
            <mat-icon class="search-icon">search</mat-icon>
            <input #searchInput
                   type="text"
                   [(ngModel)]="searchText"
                   (ngModelChange)="onSearch()"
                   placeholder="Type product name or code..."
                   class="search-input"
                   autofocus>
            <button class="clear-search" *ngIf="searchText" (click)="searchText = ''; onSearch()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <mat-progress-bar *ngIf="loading" mode="indeterminate" class="loading-bar"></mat-progress-bar>

        <div class="dialog-body">
          <!-- Empty State -->
          <div class="empty-state" *ngIf="!loading && products.length === 0 && searchText.length > 0">
            <div class="empty-icon">
              <mat-icon>search_off</mat-icon>
            </div>
            <h3>No products found</h3>
            <p>We couldn't find any products matching "{{ searchText }}"</p>
            <p class="empty-hint">Try searching with a different name or code</p>
          </div>

          <!-- Initial State -->
          <div class="empty-state" *ngIf="!loading && products.length === 0 && searchText.length === 0">
            <div class="empty-icon">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <h3>Start typing to search</h3>
            <p>Enter a product name or code to find matching items</p>
          </div>

          <!-- Product Grid -->
          <div class="product-grid" *ngIf="products.length > 0">
            <div class="product-card"
                 *ngFor="let p of products"
                 [class.selected]="selectedProductId === p.productId"
                 (click)="selectedProductId = p.productId">
              <div class="product-card-header">
                <div class="product-avatar">
                  <mat-icon>inventory_2</mat-icon>
                </div>
                <div class="stock-badge" [class.low]="getStockLevel(p) === 'low'" [class.out]="getStockLevel(p) === 'out'">
                  {{ getStockLabel(p) }}
                </div>
              </div>
              <div class="product-card-body">
                <h4 class="product-name">{{ p.productName }}</h4>
                <p class="product-tamil" *ngIf="p.tamilName">{{ p.tamilName }}</p>
                <div class="product-meta">
                  <div class="product-price">
                    <span class="currency">\u20B9</span>
                    <span class="amount">{{ p.price }}</span>
                  </div>
                </div>
              </div>
              <div class="product-card-footer">
                <button class="select-product-btn" (click)="selectProduct(p); $event.stopPropagation()">
                  <mat-icon>check_circle</mat-icon>
                  Select
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="cancel-btn" (click)="onCancel()">
            <mat-icon>close</mat-icon>
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    :host {
      display: block;
    }

    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }

    .dialog-container {
      background: white;
      border-radius: 20px;
      width: 100%;
      max-width: 680px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
      animation: dialogEnter 300ms ease;
      overflow: hidden;
    }

    @keyframes dialogEnter {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 24px 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .dialog-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #1E40AF, #3B82F6);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .dialog-icon mat-icon {
      color: white;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .dialog-header h2 {
      font-family: 'Poppins', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
    }

    .mapping-info {
      font-size: 13px;
      color: #64748B;
      margin-top: 2px;
    }

    .mapping-info strong {
      color: #1E40AF;
      font-weight: 600;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #F1F5F9;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 200ms ease;
      color: #64748B;
    }

    .close-btn:hover {
      background: #E2E8F0;
      color: #1E293B;
    }

    .close-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .search-section {
      padding: 16px 24px 0;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 56px;
      background: #F8FAFC;
      border: 2px solid #E5E7EB;
      border-radius: 999px;
      padding: 0 20px;
      transition: all 250ms ease;
    }

    .search-bar:focus-within {
      border-color: #1E40AF;
      background: white;
      box-shadow: 0 0 0 4px rgba(30, 64, 175, 0.1);
    }

    .search-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #64748B;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: 'Poppins', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: #1E293B;
    }

    .search-input::placeholder {
      color: #94A3B8;
      font-weight: 400;
    }

    .clear-search {
      width: 32px;
      height: 32px;
      border: none;
      background: #E2E8F0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 200ms ease;
      color: #64748B;
      flex-shrink: 0;
    }

    .clear-search:hover {
      background: #CBD5E1;
    }

    .clear-search mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .loading-bar {
      margin-top: 8px;
    }

    .loading-bar ::ng-deep .mdc-linear-progress__bar-inner {
      border-color: #1E40AF;
    }

    .dialog-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 24px;
      min-height: 200px;
      max-height: 480px;
    }

    .dialog-body::-webkit-scrollbar {
      width: 6px;
    }

    .dialog-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .dialog-body::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 10px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      width: 72px;
      height: 72px;
      background: #F1F5F9;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .empty-icon mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #94A3B8;
    }

    .empty-state h3 {
      font-family: 'Poppins', sans-serif;
      font-size: 17px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 6px;
    }

    .empty-state p {
      font-size: 14px;
      color: #64748B;
      max-width: 300px;
    }

    .empty-hint {
      font-size: 12px !important;
      color: #94A3B8 !important;
      margin-top: 8px;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }

    .product-card {
      background: white;
      border: 1.5px solid #E5E7EB;
      border-radius: 16px;
      padding: 18px;
      cursor: pointer;
      transition: all 250ms ease;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .product-card:hover {
      border-color: #93C5FD;
      box-shadow: 0 8px 24px rgba(30, 64, 175, 0.1);
      transform: translateY(-2px);
    }

    .product-card.selected {
      border-color: #1E40AF;
      background: #EFF6FF;
      box-shadow: 0 8px 24px rgba(30, 64, 175, 0.15);
    }

    .product-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .product-avatar {
      width: 40px;
      height: 40px;
      background: #DBEAFE;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .product-card.selected .product-avatar {
      background: #1E40AF;
    }

    .product-avatar mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #1E40AF;
    }

    .product-card.selected .product-avatar mat-icon {
      color: white;
    }

    .stock-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      background: #ECFDF5;
      color: #047857;
    }

    .stock-badge.low {
      background: #FEF3C7;
      color: #B45309;
    }

    .stock-badge.out {
      background: #FEF2F2;
      color: #991B1B;
    }

    .product-card-body {
      flex: 1;
    }

    .product-name {
      font-family: 'Poppins', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 2px;
      line-height: 1.3;
    }

    .product-tamil {
      font-size: 13px;
      color: #64748B;
      margin-bottom: 10px;
    }

    .product-meta {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-top: 8px;
    }

    .product-price {
      display: flex;
      align-items: baseline;
    }

    .currency {
      font-size: 14px;
      font-weight: 600;
      color: #047857;
    }

    .amount {
      font-size: 20px;
      font-weight: 700;
      color: #047857;
    }

    .product-unit {
      font-size: 12px;
      color: #94A3B8;
      font-weight: 500;
    }

    .product-card-footer {
      border-top: 1px solid #F1F5F9;
      padding-top: 12px;
    }

    .select-product-btn {
      width: 100%;
      height: 40px;
      border: none;
      border-radius: 10px;
      background: #1E40AF;
      color: white;
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 250ms ease;
    }

    .select-product-btn:hover {
      background: #1D4ED8;
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
    }

    .select-product-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .dialog-footer {
      padding: 16px 24px 20px;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #E5E7EB;
    }

    .cancel-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 42px;
      padding: 0 20px;
      border: 1.5px solid #E5E7EB;
      border-radius: 12px;
      background: white;
      color: #64748B;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 250ms ease;
    }

    .cancel-btn:hover {
      background: #F1F5F9;
      border-color: #CBD5E1;
      color: #1E293B;
    }

    .cancel-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 600px) {
      .dialog-overlay { padding: 12px; }
      .dialog-container { max-height: 92vh; }
      .dialog-header { padding: 16px 16px 0; }
      .search-section { padding: 12px 16px 0; }
      .dialog-footer { padding: 12px 16px; }
      .close-btn {
        width: 44px;
        height: 44px;
      }
      .product-grid { grid-template-columns: 1fr; }
      .dialog-body { max-height: 60vh; }
      .select-product-btn,
      .cancel-btn {
        height: 48px;
      }
      .dialog-footer {
        justify-content: stretch;
      }
      .cancel-btn {
        flex: 1;
        justify-content: center;
      }
    }
  `]
})
export class ProductSearchDialogComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchText = '';
  products: Product[] = [];
  loading = false;
  selectedProductId: number | null = null;

  constructor(
    private dialogRef: MatDialogRef<ProductSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      spokenText: string;
      quantity: number;
      unit: string;
    },
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.searchText = this.data.spokenText;
    this.onSearch();
  }

  getStockLevel(p: Product): string {
    const stock = (p as any).stock ?? (p as any).quantity ?? 0;
    if (stock <= 0) return 'out';
    if (stock <= 5) return 'low';
    return 'normal';
  }

  getStockLabel(p: Product): string {
    const stock = (p as any).stock ?? (p as any).quantity ?? null;
    if (stock === null || stock === undefined) return 'In Stock';
    if (stock <= 0) return 'Out of Stock';
    if (stock <= 5) return 'Low: ' + stock;
    return 'In Stock';
  }

  onSearch(): void {
    if (!this.searchText || this.searchText.trim().length < 1) {
      this.products = [];
      return;
    }
    this.loading = true;
    this.productService.searchProducts(this.searchText.trim()).subscribe({
      next: (products) => {
        this.products = products.filter(p => p.status === 'active');
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.loading = false;
      }
    });
  }

  selectProduct(product: Product): void {
    this.dialogRef.close({
      product,
      spokenText: this.data.spokenText,
      quantity: this.data.quantity,
      unit: this.data.unit
    } as ProductSearchResult);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
