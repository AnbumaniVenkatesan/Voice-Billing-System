import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/auth/auth.service';
import { CompanyService } from '../../shared/services/company.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  template: `
    <div class="layout-container">
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav [mode]="'side'" opened class="sidenav">

          <!-- Logo -->
          <div class="sidebar-logo">
            <div class="logo-icon">
              <mat-icon>point_of_sale</mat-icon>
            </div>
            <div class="logo-text">
              <span class="logo-title">{{ companyName }}</span>
              <span class="logo-subtitle">{{ currentUser?.username || 'Admin' }}</span>
            </div>
          </div>

          <!-- Menu -->
          <div class="sidebar-menu">
            <a class="menu-item" routerLink="/dashboard" routerLinkActive="active-link">
              <span class="menu-indicator"></span>
              <mat-icon class="menu-icon">dashboard</mat-icon>
              <span class="menu-label">Dashboard</span>
            </a>
            <a class="menu-item" routerLink="/customers" routerLinkActive="active-link"
               *ngIf="showCustomers">
              <span class="menu-indicator"></span>
              <mat-icon class="menu-icon">people</mat-icon>
              <span class="menu-label">Customers</span>
            </a>
            <a class="menu-item" routerLink="/products" routerLinkActive="active-link"
               *ngIf="showProducts">
              <span class="menu-indicator"></span>
              <mat-icon class="menu-icon">inventory_2</mat-icon>
              <span class="menu-label">Products</span>
            </a>
            <a class="menu-item" routerLink="/billing" routerLinkActive="active-link">
              <span class="menu-indicator"></span>
              <mat-icon class="menu-icon">receipt_long</mat-icon>
              <span class="menu-label">Billing</span>
            </a>
            <a class="menu-item" routerLink="/voice-billing" routerLinkActive="active-link">
              <span class="menu-indicator"></span>
              <mat-icon class="menu-icon">mic</mat-icon>
              <span class="menu-label">Voice Billing</span>
            </a>
            <a class="menu-item" routerLink="/invoices" routerLinkActive="active-link">
              <span class="menu-indicator"></span>
              <mat-icon class="menu-icon">description</mat-icon>
              <span class="menu-label">Invoices</span>
            </a>
            <a class="menu-item" routerLink="/reports" routerLinkActive="active-link">
              <span class="menu-indicator"></span>
              <mat-icon class="menu-icon">bar_chart</mat-icon>
              <span class="menu-label">Reports</span>
            </a>
            <a class="menu-item" routerLink="/company-settings" routerLinkActive="active-link">
              <span class="menu-indicator"></span>
              <mat-icon class="menu-icon">business</mat-icon>
              <span class="menu-label">Company Settings</span>
            </a>
          </div>

          <!-- Logout -->
          <div class="sidebar-footer">
            <div class="user-info">
              <div class="user-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="user-details">
                <span class="user-name">{{ currentUser?.username || 'User' }}</span>
                <span class="user-role">Admin</span>
              </div>
            </div>
            <button class="logout-btn" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </div>

        </mat-sidenav>

        <mat-sidenav-content class="content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .sidenav-container {
      flex: 1;
    }

    .sidenav {
      width: 280px;
      background: #95949426;
      border-right: 1px solid #F1F5F9;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }

    .sidenav ::ng-deep .mat-drawer-inner-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 0;
    }

    /* Logo */
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 20px;
      border-bottom: 1px solid #F1F5F9;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #1E40AF;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .logo-text {
      display: flex;
      flex-direction: column;
    }

    .logo-title {
      font-size: 18px;
      font-weight: 700;
      color: #1E293B;
      line-height: 1.2;
    }

    .logo-subtitle {
      font-size: 12px;
      font-weight: 400;
      color: #9CA3AF;
      line-height: 1.3;
    }

    /* Menu */
    .sidebar-menu {
      flex: 1;
      overflow-y: auto;
      padding: 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 16px;
      border-radius: 10px;
      cursor: pointer;
      text-decoration: none;
      position: relative;
      transition: all 0.2s ease;
    }

    .menu-item:hover {
      background: #F8FAFC;
    }

    .menu-indicator {
      display: none;
    }

    .menu-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #6B7280;
      transition: color 0.2s;
    }

    .menu-label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      transition: color 0.2s;
    }

    /* Active State */
    .menu-item.active-link {
      background: #DBEAFE;
    }

    .menu-item.active-link .menu-indicator {
      display: block;
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 24px;
      border-radius: 0 4px 4px 0;
      background: #1E40AF;
    }

    .menu-item.active-link .menu-icon {
      color: #1E40AF;
    }

    .menu-item.active-link .menu-label {
      color: #1E40AF;
      font-weight: 600;
    }

    /* Footer */
    .sidebar-footer {
      padding: 16px 16px 20px;
      border-top: 1px solid #F1F5F9;
      margin-top: auto;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 8px 12px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #EEF2FF;
      color: #1E40AF;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-avatar mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 11px;
      font-weight: 400;
      color: #9CA3AF;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 16px;
      border: none;
      border-radius: 10px;
      background: #FEF2F2;
      color: #DC2626;
      font-size: 14px;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      background: #FEE2E2;
    }

    .logout-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Content */
    .content {
      background: #F8FAFC;
      min-height: 100vh;
    }
  `]
})
export class LayoutComponent implements OnInit {
  currentUser: any;
  companyName = 'Smart Billing System';
  showCustomers = false;
  showProducts = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private companyService: CompanyService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.companyName = data.companyName || 'Smart Billing System';
        const shopType = data.shopType;
        if (shopType === 'Super Market') {
          this.showCustomers = true;
          this.showProducts = true;
        } else if (shopType === 'Hotel') {
          this.showCustomers = false;
          this.showProducts = true;
        } else {
          this.showCustomers = false;
          this.showProducts = false;
        }
      },
      error: () => {}
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
