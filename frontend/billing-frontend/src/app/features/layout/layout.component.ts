import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../core/auth/auth.service';
import { CompanyService } from '../../shared/services/company.service';
import { ModalStateService } from '../../shared/services/modal-state.service';
import { environment } from '../../../environments/environment';

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
    MatDividerModule,
    MatDialogModule
  ],
  template: `
    <div class="layout-container">
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav
                     [mode]="isMobile ? 'over' : 'side'"
                     [opened]="!isMobile || sidenavOpened"
                     (openedChange)="sidenavOpened = $event"
                     class="sidenav"
                     [class.sidenav-modal-open]="modalOpen"
                     [attr.inert]="modalOpen || null">

          <!-- Logo -->
          <div class="sidebar-logo">
            <div class="logo-icon" [class.has-logo]="!!logoUrl">
              <img *ngIf="logoUrl" [src]="logoUrl" alt="Company Logo" class="logo-img" (error)="onLogoError()">
              <mat-icon *ngIf="!logoUrl">point_of_sale</mat-icon>
            </div>
            <div class="logo-text">
              <span class="logo-title">{{ companyName }}</span>
              <span class="logo-subtitle">{{ currentUser?.username || 'Admin' }}</span>
            </div>
          </div>

          <!-- Menu -->
          <div class="sidebar-menu">
            <ng-container *ngIf="!isSuperAdmin">
              <a class="menu-item" routerLink="/dashboard" routerLinkActive="active-link">
                <span class="menu-indicator"></span>
                <mat-icon class="menu-icon">dashboard</mat-icon>
                <span class="menu-label">Dashboard</span>
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
              <a class="menu-item" routerLink="/reports" routerLinkActive="active-link">
                <span class="menu-indicator"></span>
                <mat-icon class="menu-icon">bar_chart</mat-icon>
                <span class="menu-label">Reports</span>
              </a>
              <a class="menu-item" routerLink="/company-settings" routerLinkActive="active-link">
                <span class="menu-indicator"></span>
                <mat-icon class="menu-icon">business</mat-icon>
                <span class="menu-label">Company Information</span>
              </a>
            </ng-container>
            <ng-container *ngIf="isSuperAdmin">
              <a class="menu-item" routerLink="/admin/companies" routerLinkActive="active-link">
                <span class="menu-indicator"></span>
                <mat-icon class="menu-icon">business</mat-icon>
                <span class="menu-label">Companies</span>
              </a>
              <a class="menu-item" routerLink="/admin/users" routerLinkActive="active-link">
                <span class="menu-indicator"></span>
                <mat-icon class="menu-icon">group</mat-icon>
                <span class="menu-label">Users</span>
              </a>
            </ng-container>
          </div>

          <!-- Logout -->
          <div class="sidebar-footer">
            <div class="user-info">
              <div class="user-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <div class="user-details">
                <span class="user-name">{{ currentUser?.username || 'User' }}</span>
                <span class="user-role">{{ roleLabel }}</span>
              </div>
            </div>
            <button class="logout-btn" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </div>

        </mat-sidenav>

        <mat-sidenav-content class="content">
          <div class="mobile-topbar" *ngIf="isMobile">
            <button class="hamburger-btn" (click)="sidenav.toggle()" aria-label="Toggle menu">
              <mat-icon>menu</mat-icon>
            </button>
            <span class="mobile-brand">{{ companyName }}</span>
            <div class="mobile-logo">
              <img *ngIf="logoUrl" [src]="logoUrl" alt="Company Logo" class="mobile-logo-img" (error)="onLogoError()">
              <mat-icon *ngIf="!logoUrl" class="mobile-logo-default">point_of_sale</mat-icon>
            </div>
          </div>
          <router-outlet></router-outlet>
          <button class="install-fab" *ngIf="canInstall" (click)="installApp()">
            <mat-icon>download</mat-icon>
            <span>Install App</span>
          </button>
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

    .install-fab {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 20px;
      border: none;
      border-radius: 999px;
      background: linear-gradient(135deg, #1E40AF, #1D4ED8);
      color: #FFFFFF;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(30, 64, 175, 0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .install-fab:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(30, 64, 175, 0.45);
    }

    .install-fab mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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

    .logo-icon.has-logo {
      background: transparent;
    }

    .logo-img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      flex-shrink: 0;
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

    /* Modal-open state: sidebar behaves like a disabled, dimmed background */
    .sidenav-modal-open {
      opacity: 0.45;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }

    .sidenav-modal-open .menu-item:hover {
      background: transparent;
    }

    .sidenav-modal-open .menu-item.active-link {
      background: transparent;
    }

    .sidenav-modal-open .menu-item.active-link .menu-indicator {
      display: none;
    }

    .sidenav-modal-open .menu-item.active-link .menu-icon {
      color: #6B7280;
    }

    .sidenav-modal-open .menu-item.active-link .menu-label {
      color: #374151;
      font-weight: 500;
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
      position: relative;
    }

    /* Mobile top bar */
    .mobile-topbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 12px;
      background: #FFFFFF;
      border-bottom: 1px solid #F1F5F9;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
      z-index: 60;
    }

    .hamburger-btn {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 12px;
      background: #F1F5F9;
      color: #1E293B;
      cursor: pointer;
      transition: background 250ms ease;
    }

    .hamburger-btn:hover {
      background: #E2E8F0;
    }

    .hamburger-btn mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .mobile-brand {
      font-size: 16px;
      font-weight: 700;
      color: #1E293B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mobile-logo {
      margin-left: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .mobile-logo-img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }

    .mobile-logo-default {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #6B7280;
    }

    /* Tablet: narrower sidebar */
    @media (min-width: 768px) and (max-width: 1023.98px) {
      .sidenav {
        width: 240px;
      }
    }

    /* Mobile: drawer over content with top bar */
    @media (max-width: 767.98px) {
      .content {
        padding-top: 60px;
      }

      /* Compact black sidebar below the top bar, height fits content only */
      .sidenav {
        top: 60px;
        bottom: auto;
        width: 280px;
        max-height: calc(100vh - 72px);
        background: #0F172A;
        border: 1px solid #1E293B;
        border-top: none;
        border-radius: 0 0 18px 0;
        overflow: hidden;
      }

      .sidenav ::ng-deep .mat-drawer-inner-container {
        height: auto;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .sidebar-logo {
        padding: 18px 20px 16px;
        border-bottom-color: #1E293B;
      }

      .logo-title {
        color: #F8FAFC;
      }

      .logo-subtitle {
        color: #94A3B8;
      }

      .sidebar-menu {
        padding: 10px;
      }

      .menu-label {
        color: #E2E8F0;
      }

      .menu-icon {
        color: #94A3B8;
      }

      .menu-item:hover {
        background: #1E293B;
      }

      .menu-item.active-link {
        background: #1D4ED8;
      }

      .menu-item.active-link .menu-indicator {
        background: #FFFFFF;
      }

      .menu-item.active-link .menu-icon {
        color: #FFFFFF;
      }

      .menu-item.active-link .menu-label {
        color: #FFFFFF;
      }

      .sidebar-footer {
        padding: 12px 16px 16px;
        border-top-color: #1E293B;
      }

      .user-name {
        color: #F8FAFC;
      }

      .user-role {
        color: #94A3B8;
      }

      .user-avatar {
        background: #1E293B;
        color: #93C5FD;
      }

      .logout-btn {
        background: rgba(220, 38, 38, 0.16);
        color: #FCA5A5;
      }

      .logout-btn:hover {
        background: rgba(220, 38, 38, 0.28);
      }
    }
  `]
})
export class LayoutComponent implements OnInit {
  currentUser: any;
  companyName = 'Smart Billing System';
  companyLogo = '';
  private logoLoadFailed = false;
  showProducts = false;
  isSuperAdmin = false;
  roleLabel = 'Admin';
  isMobile = window.innerWidth < 768;
  sidenavOpened = !this.isMobile;
  deferredPrompt: any = null;
  canInstall = false;
  modalOpen = false;
  private dialogOpen = false;
  private customModalOpen = false;

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    const mobile = window.innerWidth < 768;
    if (mobile !== this.isMobile) {
      this.isMobile = mobile;
      this.sidenavOpened = !mobile;
    }
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private companyService: CompanyService,
    private dialog: MatDialog,
    private modalState: ModalStateService
  ) {
    this.currentUser = this.authService.getCurrentUser();
    this.isSuperAdmin = this.authService.isSuperAdmin();
    if (this.isSuperAdmin) {
      this.roleLabel = 'Super Admin';
    }

    // Global modal state: any MatDialog opening dims and disables the sidebar,
    // restoring it automatically once all dialogs are closed. Custom fullscreen
    // overlays (reports view, product results) drive the same state through
    // ModalStateService.
    this.dialog.afterOpened.subscribe(() => {
      this.dialogOpen = true;
      this.syncModalOpen();
    });
    this.dialog.afterAllClosed.subscribe(() => {
      this.dialogOpen = false;
      this.syncModalOpen();
    });
    this.modalState.modalOpen$.subscribe(open => {
      this.customModalOpen = open;
      this.syncModalOpen();
    });

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile) {
          this.sidenavOpened = false;
        }
      });
  }

  get logoUrl(): string {
    if (this.logoLoadFailed || !this.companyLogo) return '';
    if (this.companyLogo.startsWith('http')) return this.companyLogo;
    return environment.apiUrl + this.companyLogo;
  }

  onLogoError(): void {
    this.logoLoadFailed = true;
  }

  ngOnInit(): void {
    if (/Android|iPhone/i.test(navigator.userAgent)) {
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.canInstall = true;
      });
      window.addEventListener('appinstalled', () => {
        this.deferredPrompt = null;
        this.canInstall = false;
      });
    }

    if (this.isSuperAdmin) {
      return;
    }
    this.companyService.company$.subscribe(company => {
      this.logoLoadFailed = false;
      this.companyLogo = company?.logo || '';
    });
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.companyName = data.companyName || 'Smart Billing System';
        const shopType = data.shopType;
        if (shopType === 'Hotel' || shopType === 'Super Market') {
          this.showProducts = true;
        } else {
          this.showProducts = false;
        }
      },
      error: () => {}
    });
  }

  installApp(): void {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt = null;
      this.canInstall = false;
    }
  }

  private syncModalOpen(): void {
    this.modalOpen = this.dialogOpen || this.customModalOpen;
  }

  logout(): void {
    this.authService.logout();
    this.companyService.clearCompany();
    this.router.navigate(['/login']);
  }
}
