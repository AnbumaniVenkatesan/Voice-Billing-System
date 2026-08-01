import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../shared/services/dashboard.service';
import { DashboardData } from '../../shared/models/models';
import { CompanyService } from '../../shared/services/company.service';
import { Company } from '../../shared/models/company.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard-wrapper">

      <div class="company-header" *ngIf="company">
        <div class="company-info">
          <div>
            <h1 class="company-name">Dashboard</h1>
          </div>
        </div>
      </div>

      <h1 class="page-title" *ngIf="!company">Dashboard</h1>

      <div class="stat-cards-row">
        <div class="stat-card" routerLink="/dashboard/today-sales">
          <div class="stat-icon-circle blue">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">&#8377;{{ data?.todaySales || 0 }}</span>
            <span class="stat-label">Today's Sales</span>
          </div>
        </div>

        <div class="stat-card" routerLink="/dashboard/monthly-sales">
          <div class="stat-icon-circle green">
            <mat-icon>calendar_month</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">&#8377;{{ data?.monthlySales || 0 }}</span>
            <span class="stat-label">Monthly Sales</span>
          </div>
        </div>

        <div class="stat-card" routerLink="/dashboard/products">
          <div class="stat-icon-circle orange">
            <mat-icon>inventory_2</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ data?.totalProducts || 0 }}</span>
            <span class="stat-label">Total Products</span>
          </div>
        </div>
      </div>

      <div class="quick-actions-row">
        <button class="quick-action-btn primary" routerLink="/billing">
          <mat-icon>add_shopping_cart</mat-icon>
          <span>New Bill</span>
        </button>
        <button class="quick-action-btn secondary" routerLink="/voice-billing">
          <mat-icon>mic</mat-icon>
          <span>Voice Bill</span>
        </button>
      </div>

      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h3 class="chart-title">Sales by Product</h3>
            <p class="chart-subtitle">{{ weeklyChartData.length }} products with sales activity</p>
          </div>
          <div class="chart-period-select">
            <button class="period-btn" [class.active]="chartPeriod === 'today'" (click)="changePeriod('today')">Today</button>
            <button class="period-btn" [class.active]="chartPeriod === 'week'" (click)="changePeriod('week')">Week</button>
            <button class="period-btn" [class.active]="chartPeriod === 'month'" (click)="changePeriod('month')">Month</button>
          </div>
        </div>
        <div class="bar-chart-container">
          <div class="bar-col" *ngFor="let item of weeklyChartData; let i = index"
               [style.animation-delay]="(i * 0.08) + 's'">
            <div class="bar-value">{{ item.qty }}</div>
            <div class="bar-track">
              <div class="bar-fill" [style.height]="item.percentage + '%'"
                   [style.background]="item.color"></div>
            </div>
            <div class="bar-label">{{ item.productName }}</div>
          </div>
          <div class="empty-chart" *ngIf="weeklyChartData.length === 0">
            <mat-icon>bar_chart</mat-icon>
            <p>No sales data for this period</p>
          </div>
        </div>
      </div>

      <div class="summary-cards-row">
        <div class="summary-card">
          <div class="summary-icon-circle blue">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="summary-content">
            <span class="summary-value">&#8377;{{ data?.monthlySales || 0 }}</span>
            <span class="summary-label">This Month</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon-circle amber">
            <mat-icon>pending_actions</mat-icon>
          </div>
          <div class="summary-content">
            <span class="summary-value">{{ data?.pendingPayments || 0 }}</span>
            <span class="summary-label">Pending Invoices</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon-circle teal">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="summary-content">
            <span class="summary-value">{{ data?.completedPayments || 0 }}</span>
            <span class="summary-label">Completed</span>
          </div>
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

    .dashboard-wrapper {
      max-width: 1400px;
      margin: 0 auto;
    }

    .company-header {
      margin-bottom: 8px;
    }

    .company-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .company-name {
      font-size: 16px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    .owner-name {
      font-size: 13px;
      color: #64748B;
      margin: 2px 0 0;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #1E293B;
      margin: 0 0 28px;
    }

    .stat-cards-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: #fff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(15,23,42,0.08);
      display: flex;
      align-items: center;
      gap: 18px;
      cursor: pointer;
      transition: transform 250ms ease, box-shadow 250ms ease;
    }

    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 40px rgba(15,23,42,0.12);
    }

    .stat-icon-circle {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon-circle mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

    .stat-icon-circle.blue {
      background: #EEF2FF;
      color: #1E40AF;
    }

    .stat-icon-circle.green {
      background: #ECFDF5;
      color: #059669;
    }

    .stat-icon-circle.purple {
      background: #F5F3FF;
      color: #7C3AED;
    }

    .stat-icon-circle.orange {
      background: #FFF7ED;
      color: #EA580C;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1E293B;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: #64748B;
      margin-top: 2px;
    }

    .quick-actions-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }

    .quick-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      height: 56px;
      border-radius: 14px;
      font-family: 'Poppins', sans-serif;
      font-size: 16px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 250ms ease;
    }

    .quick-action-btn mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .quick-action-btn.primary {
      background: #1E40AF;
      color: #fff;
      box-shadow: 0 4px 14px rgba(30,64,175,0.3);
    }

    .quick-action-btn.primary:hover {
      background: #1D4ED8;
      box-shadow: 0 6px 20px rgba(30,64,175,0.4);
      transform: translateY(-1px);
    }

    .quick-action-btn.secondary {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .quick-action-btn.secondary:hover {
      background: #BFDBFE;
      transform: translateY(-1px);
    }

    .chart-card {
      background: #fff;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(15,23,42,0.08);
      margin-bottom: 28px;
    }

    .chart-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .chart-period-select {
      display: flex;
      gap: 4px;
      background: #F1F5F9;
      border-radius: 10px;
      padding: 4px;
    }

    .period-btn {
      padding: 6px 16px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: #64748B;
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .period-btn:hover {
      color: #1E293B;
    }

    .period-btn.active {
      background: #FFFFFF;
      color: #1E40AF;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .chart-title {
      font-size: 18px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    .chart-subtitle {
      font-size: 13px;
      color: #64748B;
      margin: 4px 0 0;
    }

    .bar-chart-container {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      height: 280px;
      padding: 0 8px;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: thin;
    }

    .bar-chart-container::-webkit-scrollbar {
      height: 4px;
    }

    .bar-col {
      flex: 1;
      min-width: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: barGrow 0.5s ease forwards;
      opacity: 0;
      transform-origin: bottom;
    }

    @keyframes barGrow {
      to { opacity: 1; }
    }

    .bar-value {
      font-size: 12px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 6px;
      white-space: nowrap;
    }

    .bar-track {
      width: 100%;
      max-width: 44px;
      height: 200px;
      background: #F1F5F9;
      border-radius: 10px 10px 4px 4px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .bar-fill {
      width: 100%;
      border-radius: 10px 10px 4px 4px;
      transition: height 0.7s ease;
      min-height: 4px;
    }

    .bar-label {
      font-size: 11px;
      font-weight: 500;
      color: #64748B;
      text-align: center;
      margin-top: 10px;
      word-break: break-word;
      line-height: 1.3;
      max-width: 68px;
    }

    .empty-chart {
      text-align: center;
      padding: 60px 20px;
      color: #64748B;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .empty-chart mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #CBD5E1;
    }

    .empty-chart p {
      margin: 0;
      font-size: 14px;
    }

    .summary-cards-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .summary-card {
      background: #fff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(15,23,42,0.08);
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .summary-icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .summary-icon-circle mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .summary-icon-circle.blue {
      background: #EEF2FF;
      color: #1E40AF;
    }

    .summary-icon-circle.amber {
      background: #FFFBEB;
      color: #D97706;
    }

    .summary-icon-circle.teal {
      background: #F0FDFA;
      color: #0D9488;
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

    @media (max-width: 1200px) {
      .stat-cards-row {
        grid-template-columns: repeat(2, 1fr);
      }
      .summary-cards-row {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 1023.98px) {
      .chart-card-header {
        flex-direction: column;
        gap: 12px;
      }
      .stat-card {
        padding: 20px;
      }
    }

    @media (max-width: 767.98px) {
      :host {
        padding: 20px 16px;
      }
      .stat-cards-row {
        grid-template-columns: 1fr;
      }
      .quick-actions-row {
        grid-template-columns: 1fr;
      }
      .summary-cards-row {
        grid-template-columns: 1fr;
      }
      .page-title {
        font-size: 24px;
      }
      .chart-card {
        padding: 20px 16px;
      }
      .bar-chart-container {
        height: 240px;
      }
      .bar-track {
        height: 160px;
      }
    }

    @media (max-width: 479.98px) {
      .stat-card {
        gap: 14px;
      }
      .stat-icon-circle {
        width: 44px;
        height: 44px;
        border-radius: 12px;
      }
      .stat-icon-circle mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
      .stat-value {
        font-size: 22px;
      }
      .quick-action-btn {
        height: 52px;
        font-size: 15px;
      }
      .chart-period-select {
        width: 100%;
        justify-content: space-between;
      }
      .period-btn {
        flex: 1;
        padding: 8px 8px;
        font-size: 12px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  company: Company | null = null;
  weeklyChartData: any[] = [];
  averageSales = '0';
  chartPeriod: 'today' | 'week' | 'month' = 'week';

  private chartColors = ['#1E40AF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1'];

  constructor(
    private dashboardService: DashboardService,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.data = data;
        this.calculateAverage();
      }
    });
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company = data;
      }
    });
    this.loadChartData();
  }

  changePeriod(period: 'today' | 'week' | 'month'): void {
    this.chartPeriod = period;
    this.loadChartData();
  }

  loadChartData(): void {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    let from = '';

    if (this.chartPeriod === 'today') {
      from = to;
    } else if (this.chartPeriod === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      from = weekAgo.toISOString().split('T')[0];
    } else {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      from = monthAgo.toISOString().split('T')[0];
    }

    this.dashboardService.getMonthlySales(from, to).subscribe({
      next: (data: any) => {
        const products = data?.productSales || [];
        const maxQty = Math.max(...products.map((p: any) => Number(p.totalQty) || 0), 1);
        this.weeklyChartData = products
          .map((p: any, i: number) => ({
            productName: p.productName,
            qty: Number(p.totalQty) || 0,
            percentage: maxQty > 0 ? ((Number(p.totalQty) || 0) / maxQty) * 100 : 0,
            color: this.chartColors[i % this.chartColors.length]
          }))
          .sort((a: any, b: any) => b.qty - a.qty);
      }
    });
  }

  calculateAverage(): void {
    if (this.data) {
      const monthly = Number(this.data.monthlySales) || 0;
      const dayOfMonth = new Date().getDate();
      const avg = dayOfMonth > 0 ? Math.round(monthly / dayOfMonth) : 0;
      this.averageSales = avg.toLocaleString('en-IN');
    }
  }
}
