import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, CompanyStats } from '../../shared/services/admin.service';
import { Company } from '../../shared/models/company.model';
import { AdminCompanyFormDialogComponent, CompanyFormData } from './admin-company-form-dialog.component';
import { ConfirmService } from '../../shared/services/confirm.service';
import { PasswordResetDialogComponent } from '../../shared/components/password-reset-dialog.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>business</mat-icon>
          </div>
          <div>
            <h1>Companies</h1>
            <p class="subtitle">Manage all companies registered in the system</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-outline" (click)="loadCompanies()" [disabled]="loading">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
          <button class="btn-primary" (click)="openCreateDialog()">
            <mat-icon>add_business</mat-icon>
            Add Company
          </button>
        </div>
      </div>

      <div class="toast-message" *ngIf="toastMessage" [class.error]="toastType === 'error'" [class.success]="toastType === 'success'">
        <mat-icon>{{ toastType === 'error' ? 'error_outline' : 'check_circle' }}</mat-icon>
        <span>{{ toastMessage }}</span>
      </div>

      <div class="loading-state" *ngIf="loading">
        <span class="spinner"></span> Loading companies...
      </div>

      <div class="empty-state" *ngIf="!loading && companies.length === 0">
        <mat-icon>storefront</mat-icon>
        <p>No companies yet. Click "Add Company" to create one.</p>
      </div>

      <div class="company-grid" *ngIf="!loading && companies.length > 0">
        <div class="company-card" *ngFor="let company of companies">
          <div class="card-top">
            <div class="card-logo">
              <img *ngIf="company.logo" [src]="getLogoUrl(company)" alt="Logo">
              <mat-icon *ngIf="!company.logo">store</mat-icon>
            </div>
            <span class="status-badge" [class.active]="company.isActive" [class.inactive]="!company.isActive">
              {{ company.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div class="card-body">
            <h2>{{ company.companyName }}</h2>
            <div class="meta-row" *ngIf="company.shopType">
              <mat-icon>category</mat-icon> {{ company.shopType }}
            </div>
            <div class="meta-row" *ngIf="company.ownerName">
              <mat-icon>person</mat-icon> {{ company.ownerName }}
            </div>
            <div class="meta-row" *ngIf="company.phoneNumber">
              <mat-icon>phone</mat-icon> {{ company.phoneNumber }}
            </div>
            <div class="meta-row" *ngIf="company.email">
              <mat-icon>email</mat-icon> {{ company.email }}
            </div>
            <div class="meta-row" *ngIf="company.city || company.state">
              <mat-icon>place</mat-icon> {{ getLocation(company) }}
            </div>
          </div>

          <div class="card-actions">
            <button class="action-btn" (click)="toggleStats(company)">
              <mat-icon>insights</mat-icon> Stats
            </button>
            <button class="action-btn" (click)="openEditDialog(company)">
              <mat-icon>edit</mat-icon> Edit
            </button>
            <button class="action-btn" *ngIf="company.isActive" (click)="deactivate(company)">
              <mat-icon>pause_circle</mat-icon> Deactivate
            </button>
            <button class="action-btn" *ngIf="!company.isActive" (click)="activate(company)">
              <mat-icon>play_circle</mat-icon> Activate
            </button>
            <button class="action-btn" (click)="resetPassword(company)">
              <mat-icon>key</mat-icon> Reset Password
            </button>
            <button class="action-btn delete" (click)="deleteCompany(company)">
              <mat-icon>delete</mat-icon> Delete
            </button>
          </div>

          <div class="stats-panel" *ngIf="statsMap.get(company.companyId)">
            <div class="stats-grid">
              <div class="stat"><span class="stat-value">{{ statsMap.get(company.companyId)!.products }}</span><span class="stat-label">Products</span></div>
              <div class="stat"><span class="stat-value">{{ statsMap.get(company.companyId)!.invoices }}</span><span class="stat-label">Invoices</span></div>
              <div class="stat"><span class="stat-value">{{ statsMap.get(company.companyId)!.users }}</span><span class="stat-label">Users</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .admin-page {
      font-family: 'Poppins', sans-serif;
      background: #F8FAFC;
      min-height: 100vh;
      padding: 32px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #7C3AED, #A78BFA);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
    }
    .header-icon mat-icon { color: white; font-size: 28px; width: 28px; height: 28px; }
    .page-header h1 { font-size: 28px; font-weight: 700; color: #1E293B; }
    .subtitle { font-size: 14px; color: #64748B; margin-top: 2px; }
    .header-actions { display: flex; gap: 12px; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      height: 48px; padding: 0 24px;
      background: #7C3AED; color: white; border: none; border-radius: 12px;
      font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all 250ms ease;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }
    .btn-primary:hover { background: #6D28D9; transform: translateY(-1px); }
    .btn-primary mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 8px;
      height: 48px; padding: 0 20px;
      background: white; color: #7C3AED; border: 1.5px solid #7C3AED; border-radius: 12px;
      font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all 250ms ease;
    }
    .btn-outline:hover { background: #F3E8FF; }
    .btn-outline mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .toast-message {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 20px; border-radius: 12px; margin-bottom: 24px;
      font-size: 14px; font-weight: 500;
    }
    .toast-message.success { background: #ECFDF5; border: 1px solid #6EE7B7; color: #065F46; }
    .toast-message.error { background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; }
    .toast-message mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .loading-state { display: flex; align-items: center; gap: 10px; color: #64748B; font-size: 14px; padding: 40px 0; justify-content: center; }
    .spinner {
      width: 20px; height: 20px;
      border: 2.5px solid #E5E7EB; border-top-color: #7C3AED;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state {
      text-align: center; padding: 60px 0; color: #94A3B8;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .company-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 24px;
    }
    .company-card {
      background: white; border-radius: 20px; padding: 24px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      border: 1px solid #E5E7EB;
      display: flex; flex-direction: column;
    }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-logo {
      width: 52px; height: 52px; border-radius: 14px;
      background: #F3E8FF; color: #7C3AED;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .card-logo img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
    .card-logo mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .status-badge {
      padding: 5px 12px; border-radius: 999px;
      font-size: 12px; font-weight: 600;
    }
    .status-badge.active { background: #D1FAE5; color: #065F46; }
    .status-badge.inactive { background: #FEE2E2; color: #991B1B; }
    .card-body h2 { font-size: 19px; font-weight: 700; color: #1E293B; margin-bottom: 10px; }
    .meta-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #475569; padding: 2px 0;
    }
    .meta-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94A3B8; }
    .card-actions {
      display: flex; flex-wrap: wrap; gap: 8px;
      margin-top: 18px; padding-top: 16px;
      border-top: 1px solid #F1F5F9;
    }
    .action-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border: 1px solid #E5E7EB; border-radius: 10px;
      background: white; color: #475569;
      font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 200ms ease;
    }
    .action-btn:hover { background: #F8FAFC; border-color: #C7D2FE; color: #7C3AED; }
    .action-btn mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .action-btn.delete:hover { background: #FEF2F2; border-color: #FCA5A5; color: #DC2626; }
    .stats-panel {
      margin-top: 16px; padding: 16px;
      background: #FAF5FF; border: 1px solid #E9D5FF; border-radius: 14px;
    }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .stat { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .stat-value { font-size: 20px; font-weight: 700; color: #6D28D9; }
    .stat-label { font-size: 11px; color: #7C3AED; margin-top: 2px; }
    @media (max-width: 767.98px) {
      .admin-page { padding: 16px; }
      .page-header h1 { font-size: 24px; }
      .header-actions { width: 100%; flex-direction: column; }
      .btn-primary, .btn-outline { justify-content: center; width: 100%; }
      .company-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminCompaniesComponent implements OnInit {
  companies: Company[] = [];
  loading = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  statsMap = new Map<number, CompanyStats>();

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading = true;
    this.adminService.getCompanies().subscribe({
      next: (data) => {
        this.companies = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showToast('Failed to load companies: ' + this.errorMessage(err), 'error');
      }
    });
  }

  getLogoUrl(company: Company): string {
    if (!company.logo) return '';
    if (company.logo.startsWith('http')) return company.logo;
    return environment.apiUrl + company.logo;
  }

  getLocation(company: Company): string {
    return [company.city, company.state].filter(Boolean).join(', ');
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AdminCompanyFormDialogComponent, {
      width: '640px',
      data: { company: null } as CompanyFormData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.adminService.createCompany(result.company).subscribe({
        next: () => {
          this.showToast('Company created successfully!', 'success');
          this.loadCompanies();
        },
        error: (err) => this.showToast('Failed to create company: ' + this.errorMessage(err), 'error')
      });
    });
  }

  openEditDialog(company: Company): void {
    const dialogRef = this.dialog.open(AdminCompanyFormDialogComponent, {
      width: '640px',
      data: { company } as CompanyFormData,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.adminService.updateCompany(company.companyId, result.company).subscribe({
        next: () => {
          this.showToast('Company updated successfully!', 'success');
          this.loadCompanies();
        },
        error: (err) => this.showToast('Failed to update company: ' + this.errorMessage(err), 'error')
      });
    });
  }

  activate(company: Company): void {
    this.adminService.activateCompany(company.companyId).subscribe({
      next: () => {
        this.showToast(`${company.companyName} activated`, 'success');
        this.loadCompanies();
      },
      error: (err) => this.showToast(this.errorMessage(err), 'error')
    });
  }

  deactivate(company: Company): void {
    this.confirmService.confirm({
      title: 'Deactivate Company?',
      message: `Deactivate ${company.companyName}? Its users will not be able to log in.`,
      confirmLabel: 'Deactivate'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.adminService.deactivateCompany(company.companyId).subscribe({
        next: () => {
          this.showToast(`${company.companyName} deactivated`, 'success');
          this.loadCompanies();
        },
        error: (err) => this.showToast(this.errorMessage(err), 'error')
      });
    });
  }

  deleteCompany(company: Company): void {
    this.confirmService.confirm({
      title: 'Delete Company?',
      message: `Permanently delete ${company.companyName}? This removes ALL its products, invoices and payments. This cannot be undone.`
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.adminService.deleteCompany(company.companyId).subscribe({
        next: () => {
          this.showToast(`${company.companyName} deleted`, 'success');
          this.loadCompanies();
        },
        error: (err) => this.showToast(this.errorMessage(err), 'error')
      });
    });
  }

  resetPassword(company: Company): void {
    const dialogRef = this.dialog.open(PasswordResetDialogComponent, {
      width: '440px',
      maxWidth: '90vw',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms',
      data: { target: company.companyName }
    });
    dialogRef.afterClosed().subscribe(newPassword => {
      if (!newPassword) return;
      this.adminService.resetCompanyPassword(company.companyId, newPassword).subscribe({
        next: () => this.showToast('Admin password reset successfully!', 'success'),
        error: (err) => this.showToast(this.errorMessage(err), 'error')
      });
    });
  }

  toggleStats(company: Company): void {
    if (this.statsMap.has(company.companyId)) {
      this.statsMap.delete(company.companyId);
      return;
    }
    this.adminService.getCompanyStats(company.companyId).subscribe({
      next: (stats) => {
        this.statsMap.set(company.companyId, stats);
      },
      error: (err) => this.showToast('Failed to load stats: ' + this.errorMessage(err), 'error')
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => this.toastMessage = '', 5000);
  }

  errorMessage(err: any): string {
    return err.error?.message || err.error?.error || err.message || 'Server error';
  }
}
