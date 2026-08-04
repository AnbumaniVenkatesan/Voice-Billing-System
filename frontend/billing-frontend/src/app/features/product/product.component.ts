import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductService } from '../../shared/services/product.service';
import { Product, ProductRequest, ExcelImportResponse, StockUpdateResponse } from '../../shared/models/models';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatChipsModule, MatSnackBarModule,
    MatDialogModule, MatProgressBarModule, MatTooltipModule
  ],
  template: `
    <div class="products-page">

      <div class="page-header">
        <h1 class="page-title">Product Inventory</h1>
      </div>

      <div class="page-layout">

        <!-- LEFT: Product Form -->
        <div class="left-panel">
          <div class="form-card">
            <div class="form-card-header">
              <div class="form-icon">
                <mat-icon>inventory_2</mat-icon>
              </div>
              <div>
                <h2 class="form-title">Manage Item</h2>
                <p class="form-subtitle">Update your inventory records with surgical precision.</p>
              </div>
            </div>

            <form (ngSubmit)="saveProduct()" class="product-form">

              <div class="form-group">
                <label class="field-label">Product Name</label>
                <input class="form-input" placeholder="Enter product name"
                       [(ngModel)]="formData.productName" name="productName"
                       (input)="onProductNameInput()" required>
              </div>

              <div class="form-group">
                <label class="field-label">Tamil Name</label>
                <input class="form-input" placeholder="Enter Tamil name"
                       [(ngModel)]="formData.tamilName" name="tamilName">
              </div>

              <div class="form-group">
                <label class="field-label">Alias Names</label>
                <div class="alias-chips-box">
                  <span class="alias-chip" *ngFor="let alias of formData.aliases; let i = index">
                    {{ alias }}
                    <mat-icon class="chip-x" (click)="removeAlias(i)">close</mat-icon>
                  </span>
                  <span class="alias-empty" *ngIf="formData.aliases.length === 0">No aliases added</span>
                </div>
                <div class="alias-input-row">
                  <input class="form-input alias-input" placeholder="Type alias & press Enter"
                         [(ngModel)]="newAliasInput" name="newAlias" (keyup.enter)="addAlias()">
                  <button type="button" class="btn-icon-add" (click)="addAlias()"
                          [disabled]="!newAliasInput.trim()">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="field-label">Price</label>
                <div class="price-input-wrapper">
                  <span class="price-symbol">₹</span>
                  <input class="form-input price-input" type="number" placeholder="0.00"
                         [(ngModel)]="formData.price" name="price" required>
                </div>
              </div>

              <div class="form-group">
                <label class="field-label">GST % (included in price)</label>
                <div class="gst-input-wrapper">
                  <input class="form-input" type="number" min="0" step="0.01" placeholder="0.00"
                         [(ngModel)]="formData.gstPercentage" name="gstPercentage">
                  <span class="gst-suffix">%</span>
                </div>
              </div>

              <div class="btn-group">
                <button type="submit" class="btn btn-primary"
                        [disabled]="!formData.productName.trim()">
                  <mat-icon>{{ editingId ? 'edit' : 'add' }}</mat-icon>
                  {{ editingId ? 'Update Product' : 'Add Product' }}
                </button>
                <button type="button" class="btn btn-neutral" (click)="cancelForm()">
                  <mat-icon>clear</mat-icon> Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- RIGHT: Product List -->
        <div class="right-panel">
          <div class="list-card">

            <div class="excel-actions">
              <button type="button" class="btn btn-excel" (click)="fileInput.click()">
                <mat-icon>upload_file</mat-icon>
                <span class="lbl-long">Import Excel</span><span class="lbl-short">Import</span>
              </button>
              <input #fileInput type="file" accept=".xlsx,.xls" hidden (change)="onFileSelected($event)">
              <button type="button" class="btn btn-excel" (click)="stockFileInput.click()">
                <mat-icon>upload_file</mat-icon>
                <span class="lbl-long">Update from Excel</span><span class="lbl-short">Update</span>
              </button>
              <input #stockFileInput type="file" accept=".xlsx,.xls" hidden (change)="onStockFileSelected($event)">
              <button type="button" class="btn btn-excel" (click)="exportExcel()">
                <mat-icon>download</mat-icon>
                <span class="lbl-long">Export Excel</span><span class="lbl-short">Export</span>
              </button>
            </div>

            <div class="search-box">
              <mat-icon class="search-ico">search</mat-icon>
              <input class="search-field" placeholder="Search product by name..."
                     (keyup)="applyFilter($event)">
            </div>

            <div class="table-wrapper">
              <table mat-table [dataSource]="dataSource" matSort class="product-table">

                <ng-container matColumnDef="productName">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Product</th>
                  <td mat-cell *matCellDef="let row">
                    <div class="product-cell">
                      <div class="product-avatar" [style.background]="getProductColor(row.productName)">
                        {{ row.productName.charAt(0).toUpperCase() }}
                      </div>
                      <div class="product-info">
                        <span class="product-name">{{ row.productName }}</span>
                        <span class="product-tamil" *ngIf="row.tamilName">{{ row.tamilName }}</span>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>Price</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="price-text">₹{{ row.price | number:'1.2-2' }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="gst">
                  <th mat-header-cell *matHeaderCellDef mat-sort-header>GST %</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="gst-badge">{{ row.gstPercentage ?? 0 }}%</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-btn class="act-edit" matTooltip="Edit" (click)="editProduct(row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-btn class="act-delete" matTooltip="Delete" (click)="deleteProduct(row.productId)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
              </table>
            </div>

            <div class="empty-state" *ngIf="dataSource.filteredData.length === 0">
              <mat-icon class="empty-ico">inventory_2</mat-icon>
              <p class="empty-title">No products found</p>
              <p class="empty-desc">Add your first product using the form.</p>
            </div>

            <div class="mobile-product-list" *ngIf="dataSource.filteredData.length > 0">
              <div class="mobile-product-card" *ngFor="let p of displayedProducts">
                <div class="mpc-main">
                  <div class="product-avatar" [style.background]="getProductColor(p.productName)">
                    {{ p.productName.charAt(0).toUpperCase() }}
                  </div>
                  <div class="mpc-info">
                    <span class="product-name">{{ p.productName }}</span>
                    <span class="product-tamil" *ngIf="p.tamilName">{{ p.tamilName }}</span>
                  </div>
                </div>
                <div class="mpc-bottom">
                  <div class="mpc-price-col">
                    <span class="price-text">₹{{ p.price | number:'1.2-2' }}</span>
                    <span class="gst-badge" *ngIf="p.gstPercentage">GST {{ p.gstPercentage }}%</span>
                  </div>
                  <div class="mpc-actions">
                    <button class="act-btn act-edit" matTooltip="Edit" (click)="editProduct(p)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button class="act-btn act-delete" matTooltip="Delete" (click)="deleteProduct(p.productId)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <mat-paginator [pageSizeOptions]="[5, 10, 25, 50]" showFirstLastButtons class="custom-paginator"></mat-paginator>

          </div>
        </div>

      </div>
    </div>

    <!-- Import progress -->
    <div class="import-progress" *ngIf="importing">
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      <p>Importing products from Excel...</p>
    </div>

    <!-- Import result dialog -->
    <div class="result-overlay" *ngIf="importResult" (click)="importResult = null">
      <div class="result-card" (click)="$event.stopPropagation()">
        <h3>Import Result</h3>
        <div class="result-summary">
          <div class="stat">
            <span class="stat-value total">{{ importResult.totalRows }}</span>
            <span class="stat-label">Total Rows</span>
          </div>
          <div class="stat">
            <span class="stat-value success">{{ importResult.successCount }}</span>
            <span class="stat-label">Imported</span>
          </div>
          <div class="stat" *ngIf="importResult.aliasesImported > 0">
            <span class="stat-value" style="color: #1D4ED8">{{ importResult.aliasesImported }}</span>
            <span class="stat-label">Aliases Imported</span>
          </div>
          <div class="stat" *ngIf="importResult.duplicatesSkipped > 0">
            <span class="stat-value skip">{{ importResult.duplicatesSkipped }}</span>
            <span class="stat-label">Duplicates Skipped</span>
          </div>
          <div class="stat">
            <span class="stat-value error">{{ importResult.errorCount }}</span>
            <span class="stat-label">Errors</span>
          </div>
        </div>
        <div class="imported-list" *ngIf="importResult.importedProducts.length > 0">
          <h4>Imported Products</h4>
          <ul>
            <li *ngFor="let name of importResult.importedProducts">
              <mat-icon class="success-icon">check_circle</mat-icon> {{ name }}
            </li>
          </ul>
        </div>
        <div class="error-list" *ngIf="importResult.errors.length > 0">
          <h4>Errors</h4>
          <ul>
            <li *ngFor="let err of importResult.errors" class="error-item">
              <mat-icon class="error-icon">error</mat-icon> {{ err }}
            </li>
          </ul>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" (click)="importResult = null">Close</button>
        </div>
      </div>
    </div>

    <!-- Stock update result dialog -->
    <div class="result-overlay" *ngIf="stockResult" (click)="stockResult = null">
      <div class="result-card" (click)="$event.stopPropagation()">
        <h3>Stock Update Result</h3>
        <div class="result-summary">
          <div class="stat">
            <span class="stat-value total">{{ stockResult.totalRows }}</span>
            <span class="stat-label">Total Rows</span>
          </div>
          <div class="stat">
            <span class="stat-value success">{{ stockResult.updatedCount }}</span>
            <span class="stat-label">Updated</span>
          </div>
          <div class="stat">
            <span class="stat-value skip">{{ stockResult.skippedCount }}</span>
            <span class="stat-label">Skipped</span>
          </div>
          <div class="stat">
            <span class="stat-value error">{{ stockResult.notFoundCount }}</span>
            <span class="stat-label">Not Found</span>
          </div>
        </div>
        <div class="imported-list" *ngIf="stockResult.updated.length > 0">
          <h4>Updated</h4>
          <ul>
            <li *ngFor="let msg of stockResult.updated">
              <mat-icon class="success-icon">check_circle</mat-icon> {{ msg }}
            </li>
          </ul>
        </div>
        <div class="imported-list" *ngIf="stockResult.skipped.length > 0">
          <h4>Skipped</h4>
          <ul>
            <li *ngFor="let msg of stockResult.skipped">
              <mat-icon class="skip-icon">skip_next</mat-icon> {{ msg }}
            </li>
          </ul>
        </div>
        <div class="error-list" *ngIf="stockResult.notFound.length > 0">
          <h4>Not Found</h4>
          <ul>
            <li *ngFor="let name of stockResult.notFound" class="error-item">
              <mat-icon class="error-icon">error</mat-icon> {{ name }}
            </li>
          </ul>
        </div>
        <div class="error-list" *ngIf="stockResult.errors.length > 0">
          <h4>Errors</h4>
          <ul>
            <li *ngFor="let err of stockResult.errors" class="error-item">
              <mat-icon class="error-icon">error</mat-icon> {{ err }}
            </li>
          </ul>
        </div>
        <div class="result-actions">
          <button class="btn btn-primary" (click)="stockResult = null">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      font-family: 'Inter', sans-serif;
      display: block;
    }

    /* ====== PAGE ====== */
    .products-page {
      background: #F8FAFC;
      min-height: 100vh;
      padding: 32px 40px;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-title {
      font-size: 32px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
    }

    /* ====== LAYOUT ====== */
    .page-layout {
      display: flex;
      gap: 32px;
      align-items: flex-start;
    }

    .left-panel {
      flex: 0 0 30%;
      min-width: 320px;
    }

    .right-panel {
      flex: 1;
      min-width: 0;
    }

    /* ====== CARDS ====== */
    .form-card,
    .list-card {
      background: #FFFFFF;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    }

    /* ====== FORM CARD HEADER ====== */
    .form-card-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 32px;
    }

    .form-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #EEF2FF;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1D4ED8;
      flex-shrink: 0;
    }

    .form-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .form-title {
      font-size: 26px;
      font-weight: 700;
      color: #1D4ED8;
      margin: 0;
    }

    .form-subtitle {
      font-size: 15px;
      font-weight: 400;
      color: #6B7280;
      margin: 4px 0 0;
    }

    /* ====== FORM GROUPS ====== */
    .product-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .field-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .form-input {
      width: 100%;
      height: 48px;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 0 16px;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      color: #1E293B;
      outline: none;
      background: #FFFFFF;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    .form-input::placeholder {
      color: #9CA3AF;
    }

    .form-input:focus {
      border-color: #1D4ED8;
      box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
    }

    /* Price Input */
    .price-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .price-symbol {
      position: absolute;
      left: 16px;
      font-size: 14px;
      font-weight: 600;
      color: #6B7280;
      pointer-events: none;
    }

    .price-input {
      padding-left: 34px;
    }

    /* GST Input */
    .gst-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .gst-suffix {
      position: absolute;
      right: 16px;
      font-size: 14px;
      font-weight: 600;
      color: #6B7280;
      pointer-events: none;
    }

    .gst-input-wrapper .form-input {
      padding-right: 34px;
    }

    .gst-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 8px;
      background: #EEF2FF;
      color: #1D4ED8;
      font-size: 13px;
      font-weight: 600;
    }

    /* ====== ALIASES ====== */
    .alias-chips-box {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 42px;
      padding: 10px 12px;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      background: #FAFBFC;
    }

    .alias-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #EEF2FF;
      color: #1D4ED8;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .chip-x {
      font-size: 16px;
      width: 16px;
      height: 16px;
      cursor: pointer;
      color: #1D4ED8;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .chip-x:hover {
      opacity: 1;
    }

    .alias-empty {
      font-size: 13px;
      color: #9CA3AF;
      padding: 2px 0;
    }

    .alias-input-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
    }

    .alias-input {
      flex: 1;
    }

    .btn-icon-add {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: none;
      background: #1D4ED8;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.2s;
    }

    .btn-icon-add:hover:not(:disabled) {
      background: #1E40AF;
    }

    .btn-icon-add:disabled {
      background: #93C5FD;
      cursor: not-allowed;
    }

    .btn-icon-add mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* ====== BUTTONS ====== */
    .btn-group {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .btn {
      flex: 0 1 auto;
      min-width: 160px;
      max-width: 280px;
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

    .btn-excel {
      height: 44px;
      width: 175px;
      min-width: 175px;
      max-width: 175px;
      font-size: 13px !important;
      font-weight: 500 !important;
      background: #F3F4F6 !important;
      color: #6B7280 !important;
      border: 1px solid #E5E7EB !important;
    }

    .btn-excel:hover {
      background: #EEF2FF !important;
      color: #1D4ED8 !important;
      border-color: #BFDBFE !important;
    }

    .btn-excel mat-icon {
      margin-right: 6px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ====== EXCEL ACTIONS ====== */
    .excel-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      width: 100%;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #F1F5F9;
    }

    .lbl-short {
      display: none;
    }

    /* ====== SEARCH ====== */
    .search-box {
      position: relative;
      margin-bottom: 24px;
    }

    .search-ico {
      position: absolute;
      left: 18px;
      top: 50%;
      transform: translateY(-50%);
      color: #9CA3AF;
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

    /* ====== TABLE ====== */
    .table-wrapper {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #F1F5F9;
    }

    .product-table {
      width: 100%;
    }

    .product-table .mat-mdc-header-cell {
      background: #F8FAFC;
      color: #6B7280;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 16px 20px;
      border-bottom: 1px solid #F1F5F9;
    }

    .product-table .mat-mdc-cell {
      padding: 16px 20px;
      font-size: 15px;
      font-weight: 500;
      color: #374151;
      border-bottom: 1px solid #F8FAFC;
    }

    .table-row {
      transition: background 0.15s ease;
      height: 72px;
    }

    .table-row:hover {
      background: #F8FAFC;
    }

    .table-row:last-child .mat-mdc-cell {
      border-bottom: none;
    }

    /* Product Cell */
    .product-cell {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .product-avatar {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .product-name {
      font-size: 16px;
      font-weight: 600;
      color: #1E293B;
    }

    .product-tamil {
      font-size: 13px;
      font-weight: 400;
      color: #64748B;
    }

    .price-text {
      font-size: 15px;
      font-weight: 600;
      color: #1E293B;
    }

    /* Actions */
    .act-edit {
      color: #1D4ED8;
      transition: background 0.2s;
    }

    .act-edit:hover {
      background: #EEF2FF;
    }

    .act-delete {
      color: #6B7280;
      transition: all 0.2s;
    }

    .act-delete:hover {
      background: #FEF2F2;
      color: #DC2626;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 64px 20px;
    }

    .empty-ico {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #D1D5DB;
      margin-bottom: 16px;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 4px;
    }

    .empty-desc {
      font-size: 14px;
      color: #9CA3AF;
      margin: 0;
    }

    /* Paginator */
    .custom-paginator {
      border-top: 1px solid #F1F5F9;
    }

    /* ====== MOBILE PRODUCT CARDS ====== */
    .mobile-product-list {
      display: none;
      flex-direction: column;
      gap: 12px;
    }

    .mobile-product-card {
      background: #fff;
      border: 1px solid #F1F5F9;
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
    }

    .mpc-main {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .mpc-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }

    .mpc-info .product-name {
      font-size: 15px;
      font-weight: 600;
      color: #1E293B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mpc-info .product-tamil {
      font-size: 12px;
      color: #64748B;
    }

    .mpc-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #F1F5F9;
      padding-top: 12px;
    }

    .mpc-bottom .price-text {
      font-size: 16px;
      font-weight: 600;
      color: #1E293B;
    }

    .mpc-price-col {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .mpc-actions {
      display: flex;
      gap: 8px;
    }

    .act-btn {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: transparent;
      transition: background 0.2s;
    }

    .act-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* ====== DIALOGS ====== */
    .import-progress {
      margin: 20px 0;
      text-align: center;
    }

    .import-progress p {
      margin-top: 8px;
      color: #6B7280;
      font-family: 'Inter', sans-serif;
    }

    .result-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .result-card {
      background: white;
      border-radius: 20px;
      padding: 32px;
      max-width: 550px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    .result-card h3 {
      margin: 0 0 16px;
      font-size: 20px;
      font-weight: 700;
      color: #1E293B;
      font-family: 'Inter', sans-serif;
    }

    .result-summary {
      display: flex;
      gap: 20px;
      margin: 16px 0;
    }

    .stat {
      text-align: center;
      flex: 1;
    }

    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
    }

    .stat-value.total { color: #1E293B; }
    .stat-value.success { color: #16A34A; }
    .stat-value.error { color: #DC2626; }
    .stat-value.skip { color: #F59E0B; }

    .stat-label {
      color: #6B7280;
      font-size: 13px;
      font-weight: 500;
    }

    .imported-list h4, .error-list h4 {
      margin: 16px 0 8px;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      font-family: 'Inter', sans-serif;
    }

    .imported-list ul, .error-list ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .imported-list li, .error-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      color: #374151;
    }

    .success-icon { color: #16A34A; font-size: 18px; width: 18px; height: 18px; }
    .skip-icon { color: #F59E0B; font-size: 18px; width: 18px; height: 18px; }
    .error-icon { color: #DC2626; font-size: 18px; width: 18px; height: 18px; }

    .result-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
      gap: 12px;
    }

    /* ====== RESPONSIVE ====== */
    @media (max-width: 1024px) {
      .page-layout {
        flex-direction: column;
      }
      .left-panel {
        flex: none;
        min-width: auto;
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .products-page {
        padding: 16px;
      }
      .page-title {
        font-size: 26px;
      }
      .form-card,
      .list-card {
        padding: 20px;
      }
      .result-summary {
        flex-wrap: wrap;
        gap: 12px;
      }
    }

    @media (max-width: 767.98px) {
      .page-title {
        font-size: 24px;
      }
      .table-wrapper {
        display: none;
      }
      .mobile-product-list {
        display: flex;
      }
      .custom-paginator {
        margin-top: 12px;
      }
      .excel-actions {
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .excel-actions .btn-excel {
        flex: 1 1 0;
        min-width: 0;
        max-width: 175px;
      }
      .lbl-long {
        display: none;
      }
      .lbl-short {
        display: inline;
      }
      .form-card-header {
        gap: 12px;
      }
      .form-title {
        font-size: 22px;
      }
      .alias-input-row {
        flex-wrap: wrap;
      }
    }

    @media (max-width: 479.98px) {
      .products-page {
        padding: 12px;
      }
      .form-card,
      .list-card {
        padding: 16px;
        border-radius: 16px;
      }
      .excel-actions {
        gap: 10px;
      }
      .excel-actions .btn-excel {
        min-width: 0;
        padding: 0 8px;
      }
      .btn-icon-add {
        width: 44px;
        height: 44px;
      }
    }
  `]
})
export class ProductComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['productName', 'price', 'gst', 'actions'];
  dataSource = new MatTableDataSource<Product>();
  showForm = false;
  editingId: number | null = null;
  newAliasInput = '';
  activeFilter = 'all';
  formData: ProductRequest = {
    productId: undefined, productName: '', tamilName: '', price: 0, gstPercentage: 0,
    stock: 0, status: 'active', aliases: []
  };

  importing = false;
  importResult: ExcelImportResponse | null = null;
  stockResult: StockUpdateResponse | null = null;
  showFormatHelp = false;
  currentTime = '';
  private clockInterval: any;

  private productColors = ['#1D4ED8', '#059669', '#EA580C', '#7C3AED', '#DC2626', '#0891B2', '#65A30D', '#C026D3'];

  constructor(
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    });
  }

  get displayedProducts(): Product[] {
    const filtered = this.dataSource.filteredData;
    if (!filtered || filtered.length === 0) return [];
    const paginator = this.dataSource.paginator;
    if (!paginator) return filtered;
    const start = paginator.pageIndex * paginator.pageSize;
    return filtered.slice(start, start + paginator.pageSize);
  }

  onProductNameInput(): void {
    const name = (this.formData.productName || '').trim().toLowerCase();
    if (!name) {
      this.editingId = null;
      return;
    }
    const existing = this.dataSource.data.find(p =>
      (p.productName || '').trim().toLowerCase() === name
    );
    if (existing) {
      if (existing.productId !== this.editingId) {
        this.editingId = existing.productId;
        this.newAliasInput = '';
        this.formData.productId = existing.productId;
        this.formData.tamilName = existing.tamilName;
        this.formData.price = existing.price;
        this.formData.gstPercentage = existing.gstPercentage;
        this.formData.stock = existing.stock;
        this.formData.status = existing.status;
        this.formData.aliases = [...new Set((existing.aliases || []).map(a => a.trim()).filter(a => a.length > 0))];
      }
    } else {
      this.editingId = null;
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    if (filter === 'all') {
      this.dataSource.filter = '';
    } else if (filter === 'lowstock') {
      this.dataSource.filterPredicate = (data: Product) => data.stock <= 20;
      this.dataSource.filter = 'lowstock';
    } else {
      const categoryMap: Record<string, number> = {
        groceries: 0, vegetables: 0, hotel: 3, bakery: 5
      };
      const gst = categoryMap[filter];
      this.dataSource.filterPredicate = (data: Product) => data.gstPercentage === gst;
      this.dataSource.filter = filter;
    }
  }

  openForm(): void {
    this.showForm = true;
    this.editingId = null;
    this.newAliasInput = '';
    this.formData = {
      productId: undefined, productName: '', tamilName: '', price: 0, gstPercentage: 0,
      stock: 0, status: 'active', aliases: []
    };
  }

  editProduct(product: Product): void {
    this.showForm = true;
    this.editingId = product.productId;
    this.newAliasInput = '';
    const unique = [...new Set((product.aliases || []).map(a => a.trim()).filter(a => a.length > 0))];
    this.formData = {
      productId: product.productId,
      productName: product.productName,
      tamilName: product.tamilName,
      price: product.price,
      gstPercentage: product.gstPercentage,
      stock: product.stock,
      status: product.status,
      aliases: [...unique]
    };
  }

  addAlias(): void {
    const alias = (this.newAliasInput || '').trim().toLowerCase();
    if (!alias) return;
    if (this.formData.aliases.some(a => a.trim().toLowerCase() === alias)) {
      this.snackBar.open('Alias already exists', 'Close', { duration: 2000 });
      return;
    }
    this.formData.aliases.push(this.newAliasInput.trim());
    this.newAliasInput = '';
  }

  removeAlias(index: number): void {
    this.formData.aliases.splice(index, 1);
  }

  saveProduct(): void {
    if (this.editingId) {
      this.productService.updateProduct(this.editingId, this.formData).subscribe({
        next: () => {
          this.snackBar.open('Product updated successfully', 'Close', { duration: 3000 });
          this.loadProducts();
          this.cancelForm();
        },
        error: (err) => this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 3000 })
      });
    } else {
      this.productService.createProduct(this.formData).subscribe({
        next: () => {
          this.snackBar.open('Product created successfully', 'Close', { duration: 3000 });
          this.loadProducts();
          this.cancelForm();
        },
        error: (err) => this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 3000 })
      });
    }
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.snackBar.open('Product deleted', 'Close', { duration: 3000 });
          this.loadProducts();
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.newAliasInput = '';
    this.formData = {
      productId: undefined, productName: '', tamilName: '', price: 0, gstPercentage: 0,
      stock: 0, status: 'active', aliases: []
    };
  }

  getProductColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.productColors[Math.abs(hash) % this.productColors.length];
  }

  getCategoryLabel(gst: number): string {
    if (gst === 0) return 'General';
    if (gst === 3) return 'Hotel';
    if (gst === 5) return 'Premium';
    return 'General';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      this.snackBar.open('Please select an Excel file (.xlsx or .xls)', 'Close', { duration: 3000 });
      return;
    }

    this.importing = true;
    this.productService.importExcel(file).subscribe({
      next: (result) => {
        this.importing = false;
        this.importResult = result;
        this.loadProducts();
      },
      error: (err) => {
        this.importing = false;
        this.snackBar.open('Import failed: ' + (err.error?.message || 'Server error'), 'Close', { duration: 5000 });
      }
    });

    input.value = '';
  }

  onStockFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      this.snackBar.open('Please select an Excel file (.xlsx or .xls)', 'Close', { duration: 3000 });
      return;
    }

    this.importing = true;
    this.productService.updateStock(file).subscribe({
      next: (result) => {
        this.importing = false;
        this.stockResult = result;
        this.loadProducts();
      },
      error: (err) => {
        this.importing = false;
        this.snackBar.open('Stock update failed: ' + (err.error?.message || 'Server error'), 'Close', { duration: 5000 });
      }
    });

    input.value = '';
  }

  exportExcel(): void {
    this.productService.exportExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Products exported to Excel', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Export failed: Server error', 'Close', { duration: 5000 });
      }
    });
  }
}
