import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DashboardService } from '../../shared/services/dashboard.service';

@Component({
  selector: 'app-monthly-sales',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule,
    MatButtonModule, MatInputModule, MatFormFieldModule
  ],
  template: `
    <div class="page-wrapper">

      <div class="page-top-bar">
        <button class="back-btn" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          <span>Back</span>
        </button>
        <div class="page-header">
          <h2 class="page-title">Monthly Sales</h2>
          <span class="date-range-label" *ngIf="data">{{ data?.fromDate }} to {{ data?.toDate }}</span>
        </div>
      </div>

      <div class="filter-card">
        <div class="filter-row">
          <div class="filter-field">
            <label class="filter-label">From Date</label>
            <div class="date-input-wrapper">
              <mat-icon class="input-icon">calendar_today</mat-icon>
              <input type="date" [(ngModel)]="fromDate" class="date-input">
            </div>
          </div>
          <div class="filter-field">
            <label class="filter-label">To Date</label>
            <div class="date-input-wrapper">
              <mat-icon class="input-icon">calendar_today</mat-icon>
              <input type="date" [(ngModel)]="toDate" class="date-input">
            </div>
          </div>
          <button class="filter-btn" (click)="loadData()">
            <mat-icon>search</mat-icon>
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card total-card">
          <div class="summary-icon-circle total-icon">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="summary-content">
            <span class="summary-value">&#8377;{{ data?.total | number:'1.2-2' }}</span>
            <span class="summary-label">Total Sales</span>
          </div>
        </div>

        <div class="summary-card upi-card">
          <div class="summary-icon-circle upi-icon">
            <mat-icon>qr_code_scanner</mat-icon>
          </div>
          <div class="summary-content">
            <span class="summary-value">&#8377;{{ data?.upiTotal | number:'1.2-2' }}</span>
            <span class="summary-label">UPI</span>
          </div>
        </div>

        <div class="summary-card cash-card">
          <div class="summary-icon-circle cash-icon">
            <mat-icon>account_balance</mat-icon>
          </div>
          <div class="summary-content">
            <span class="summary-value">&#8377;{{ data?.cashTotal | number:'1.2-2' }}</span>
            <span class="summary-label">Cash</span>
          </div>
        </div>

        <div class="summary-card paytm-card" *ngIf="(data?.paytmTotal || 0) > 0">
          <div class="summary-icon-circle paytm-icon">
            <mat-icon>account_balance_wallet</mat-icon>
          </div>
          <div class="summary-content">
            <span class="summary-value">&#8377;{{ data?.paytmTotal | number:'1.2-2' }}</span>
            <span class="summary-label">Paytm</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-card-header">
          <h3 class="chart-title">Sales by Product</h3>
          <span class="chart-subtitle">{{ chartData.length }} products in selected period</span>
        </div>

        <div class="vbar-chart" *ngIf="chartData.length > 0">
          <div class="vbar-col" *ngFor="let item of chartData; let i = index"
               [style.animation-delay]="(i * 0.1) + 's'">
            <div class="vbar-value">{{ item.qty }} <span class="vbar-unit">qty</span></div>
            <div class="vbar-track">
              <div class="vbar-fill" [style.height]="item.percentage + '%'"
                   [style.background]="item.gradient"></div>
            </div>
            <div class="vbar-label">{{ item.productName }}</div>
          </div>
        </div>

        <div class="empty-chart" *ngIf="chartData.length === 0">
          <div class="empty-icon-wrapper">
            <mat-icon>bar_chart</mat-icon>
          </div>
          <p class="empty-title">No sales in this period</p>
          <p class="empty-sub">Try adjusting the date range to see product sales data</p>
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

    .page-top-bar {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
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
      flex-shrink: 0;
      margin-top: 4px;
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

    .page-header {
      display: flex;
      flex-direction: column;
    }

    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
    }

    .date-range-label {
      font-size: 13px;
      font-weight: 400;
      color: #64748B;
      margin-top: 2px;
    }

    .filter-card {
      background: #fff;
      border-radius: 20px;
      padding: 24px 28px;
      box-shadow: 0 10px 30px rgba(15,23,42,0.08);
      margin-bottom: 24px;
    }

    .filter-row {
      display: flex;
      align-items: flex-end;
      gap: 20px;
      flex-wrap: wrap;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-label {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
    }

    .date-input-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 48px;
      padding: 0 14px;
      border: 1.5px solid #E5E7EB;
      border-radius: 12px;
      background: #fff;
      transition: border-color 250ms ease, box-shadow 250ms ease;
    }

    .date-input-wrapper:focus-within {
      border-color: #1E40AF;
      box-shadow: 0 0 0 3px rgba(30,64,175,0.1);
    }

    .input-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #64748B;
    }

    .date-input {
      border: none;
      outline: none;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1E293B;
      background: transparent;
      flex: 1;
      height: 100%;
    }

    .date-input::-webkit-calendar-picker-indicator {
      cursor: pointer;
      opacity: 0.6;
    }

    .date-input::-webkit-calendar-picker-indicator:hover {
      opacity: 1;
    }

    .filter-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 48px;
      padding: 0 24px;
      border-radius: 12px;
      border: none;
      background: #1E40AF;
      color: #fff;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 250ms ease;
      box-shadow: 0 4px 14px rgba(30,64,175,0.3);
    }

    .filter-btn:hover {
      background: #1D4ED8;
      box-shadow: 0 6px 20px rgba(30,64,175,0.4);
      transform: translateY(-1px);
    }

    .filter-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }

    .summary-card {
      background: #fff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(15,23,42,0.08);
      display: flex;
      align-items: center;
      gap: 18px;
      transition: transform 250ms ease, box-shadow 250ms ease;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 40px rgba(15,23,42,0.12);
    }

    .summary-icon-circle {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .summary-icon-circle mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

    .total-icon {
      background: #EEF2FF;
      color: #1E40AF;
    }

    .upi-icon {
      background: #F5F3FF;
      color: #7C3AED;
    }

    .cash-icon {
      background: #ECFDF5;
      color: #059669;
    }

    .paytm-icon {
      background: #FFF7ED;
      color: #EA580C;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: #1E293B;
      line-height: 1.2;
    }

    .summary-label {
      font-size: 13px;
      font-weight: 500;
      color: #64748B;
      margin-top: 2px;
    }

    .chart-card {
      background: #fff;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(15,23,42,0.08);
    }

    .chart-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .chart-title {
      font-size: 18px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    .chart-subtitle {
      font-size: 13px;
      font-weight: 400;
      color: #64748B;
      margin-top: 4px;
    }

    .vbar-chart {
      display: flex;
      align-items: flex-end;
      gap: 14px;
      height: 300px;
      padding: 0 8px;
    }

    .vbar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: vbarSlideUp 0.6s ease forwards;
      opacity: 0;
      transform-origin: bottom;
    }

    @keyframes vbarSlideUp {
      0% {
        opacity: 0;
        transform: scaleY(0.3);
      }
      100% {
        opacity: 1;
        transform: scaleY(1);
      }
    }

    .vbar-value {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 6px;
      white-space: nowrap;
    }

    .vbar-unit {
      font-weight: 400;
      color: #64748B;
      font-size: 11px;
    }

    .vbar-track {
      width: 100%;
      max-width: 50px;
      height: 220px;
      background: #F1F5F9;
      border-radius: 12px 12px 6px 6px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .vbar-fill {
      width: 100%;
      border-radius: 12px 12px 6px 6px;
      transition: height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
      min-height: 6px;
    }

    .vbar-label {
      font-size: 11px;
      font-weight: 500;
      color: #64748B;
      text-align: center;
      margin-top: 10px;
      word-break: break-word;
      line-height: 1.3;
      max-width: 72px;
    }

    .empty-chart {
      text-align: center;
      padding: 80px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      background: #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    }

    .empty-icon-wrapper mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #CBD5E1;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    .empty-sub {
      font-size: 13px;
      color: #64748B;
      margin: 0;
    }

    @media (max-width: 1024px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 767.98px) {
      .page-top-bar {
        flex-direction: column;
        gap: 12px;
      }
      .back-btn {
        height: 44px;
        padding: 0 16px;
      }
      .chart-card-header {
        flex-direction: column;
        gap: 12px;
      }
      .vbar-chart {
        overflow-x: auto;
        padding-bottom: 6px;
      }
      .vbar-col {
        min-width: 44px;
      }
    }

    @media (max-width: 640px) {
      :host {
        padding: 20px 16px;
      }
      .summary-grid {
        grid-template-columns: 1fr;
      }
      .chart-card {
        padding: 16px;
      }
      .page-title {
        font-size: 22px;
      }
      .summary-card {
        padding: 18px;
        gap: 14px;
      }
      .summary-icon-circle {
        width: 44px;
        height: 44px;
        border-radius: 13px;
      }
      .summary-icon-circle mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
      .summary-value {
        font-size: 20px;
      }
      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }
      .filter-btn {
        width: 100%;
      }
    }
  `]
})
export class MonthlySalesComponent implements OnInit {
  data: any = null;
  chartData: any[] = [];
  fromDate = '';
  toDate = '';

  private gradients = [
    'linear-gradient(180deg, #1E40AF 0%, #3B82F6 100%)',
    'linear-gradient(180deg, #10B981 0%, #34D399 100%)',
    'linear-gradient(180deg, #F59E0B 0%, #FCD34D 100%)',
    'linear-gradient(180deg, #EF4444 0%, #F87171 100%)',
    'linear-gradient(180deg, #8B5CF6 0%, #A78BFA 100%)',
    'linear-gradient(180deg, #EC4899 0%, #F472B6 100%)',
    'linear-gradient(180deg, #06B6D4 0%, #22D3EE 100%)',
    'linear-gradient(180deg, #F97316 0%, #FB923C 100%)',
    'linear-gradient(180deg, #14B8A6 0%, #2DD4BF 100%)',
    'linear-gradient(180deg, #6366F1 0%, #818CF8 100%)'
  ];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.toDate = now.toISOString().split('T')[0];
    this.fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    this.loadData();
  }

  loadData(): void {
    this.dashboardService.getMonthlySales(this.fromDate, this.toDate).subscribe({
      next: (data) => {
        this.data = data;
        this.buildChart();
      }
    });
  }

  buildChart(): void {
    const products = this.data?.productSales || [];
    const maxQty = Math.max(...products.map((p: any) => Number(p.totalQty) || 0), 1);

    this.chartData = products.map((p: any, i: number) => ({
      productName: p.productName,
      qty: Number(p.totalQty) || 0,
      percentage: maxQty > 0 ? ((Number(p.totalQty) || 0) / maxQty) * 100 : 0,
      gradient: this.gradients[i % this.gradients.length]
    }));
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
