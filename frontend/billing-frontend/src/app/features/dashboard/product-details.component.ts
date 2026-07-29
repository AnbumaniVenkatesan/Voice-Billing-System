import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { DashboardService } from '../../shared/services/dashboard.service';
import { CompanyService } from '../../shared/services/company.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule],
  template: `
    <div class="page-wrapper">

      <div class="table-card">
        <div class="table-card-header">
          <div class="header-left">
            <button class="back-btn" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              <span>Back</span>
            </button>
            <div class="header-info">
              <h2 class="page-title">Product Details</h2>
              <span class="record-count">{{ products.length }} products found</span>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table mat-table [dataSource]="products" class="full-width">
            <ng-container matColumnDef="productName">
              <th mat-header-cell *matHeaderCellDef>Product</th>
              <td mat-cell *matCellDef="let row" class="product-name-cell">{{ row.productName }}</td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Price</th>
              <td mat-cell *matCellDef="let row">&#8377;{{ row.price | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="stock" *ngIf="!isHotel">
              <th mat-header-cell *matHeaderCellDef>Stock</th>
              <td mat-cell *matCellDef="let row" [class.low-stock]="row.stock < 10">
                {{ row.stock }}
                <span class="low-stock-badge" *ngIf="row.stock < 10">Low</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="todayQty">
              <th mat-header-cell *matHeaderCellDef>Today Qty</th>
              <td mat-cell *matCellDef="let row">{{ row.todayQty }}</td>
            </ng-container>

            <ng-container matColumnDef="todaySales">
              <th mat-header-cell *matHeaderCellDef>Today Sales</th>
              <td mat-cell *matCellDef="let row">&#8377;{{ row.todaySales | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="monthlyQty">
              <th mat-header-cell *matHeaderCellDef>Monthly Qty</th>
              <td mat-cell *matCellDef="let row">{{ row.monthlyQty }}</td>
            </ng-container>

            <ng-container matColumnDef="monthlySales">
              <th mat-header-cell *matHeaderCellDef>Monthly Sales</th>
              <td mat-cell *matCellDef="let row">&#8377;{{ row.monthlySales | number:'1.2-2' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="no-data-row" *matNoDataRow>
              <td class="no-data-cell" [attr.colspan]="displayedColumns.length">
                <div class="empty-state">
                  <mat-icon>inventory_2</mat-icon>
                  <p>No products found</p>
                </div>
              </td>
            </tr>
          </table>
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

    .page-wrapper {
      max-width: 1400px;
      margin: 0 auto;
    }

    .table-card {
      background: #fff;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(15,23,42,0.08);
      overflow: hidden;
    }

    .table-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #E5E7EB;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      border-radius: 12px;
      border: none;
      background: #F1F5F9;
      color: #64748B;
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 250ms ease;
    }

    .back-btn:hover {
      background: #E2E8F0;
      color: #1E293B;
    }

    .back-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .header-info {
      display: flex;
      flex-direction: column;
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
    }

    .record-count {
      font-size: 13px;
      font-weight: 400;
      color: #64748B;
      margin-top: 2px;
    }

    .table-container {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #E5E7EB;
    }

    .full-width {
      width: 100%;
    }

    table.mat-mdc-table {
      font-family: 'Poppins', sans-serif;
    }

    .mat-mdc-header-row {
      background: #EEF2FF;
    }

    .mat-mdc-header-cell {
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #1E40AF;
      border-bottom: 2px solid #DBEAFE;
      padding: 14px 16px;
    }

    .mat-mdc-cell {
      font-family: 'Poppins', sans-serif;
      font-size: 15px;
      font-weight: 500;
      color: #1E293B;
      border-bottom: 1px solid #E5E7EB;
      padding: 14px 16px;
    }

    .mat-mdc-row:hover .mat-mdc-cell {
      background: #F8FAFC;
    }

    .mat-mdc-row:last-child .mat-mdc-cell {
      border-bottom: none;
    }

    .product-name-cell {
      font-weight: 600;
      color: #1E293B;
    }

    .low-stock {
      color: #EF4444 !important;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .low-stock-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 6px;
      background: #FEF2F2;
      color: #EF4444;
      font-size: 11px;
      font-weight: 600;
    }

    .no-data-row {
      background: transparent;
    }

    .no-data-cell {
      padding: 60px 20px;
      text-align: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #64748B;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #CBD5E1;
    }

    .empty-state p {
      margin: 0;
      font-size: 15px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      :host {
        padding: 20px 16px;
      }
      .table-card {
        padding: 20px;
      }
      .table-card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class ProductDetailsComponent implements OnInit {
  products: any[] = [];
  displayedColumns: string[] = [];
  isHotel = false;

  constructor(
    private dashboardService: DashboardService,
    private companyService: CompanyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.isHotel = data.shopType !== 'Super Market';
        this.displayedColumns = this.isHotel
          ? ['productName', 'price', 'todayQty', 'todaySales', 'monthlyQty', 'monthlySales']
          : ['productName', 'price', 'stock', 'todayQty', 'todaySales', 'monthlyQty', 'monthlySales'];
      }
    });

    this.dashboardService.getProductDetails().subscribe({
      next: (data) => {
        this.products = data.products || [];
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
