import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AdminService, AdminUser } from '../../shared/services/admin.service';
import { Company } from '../../shared/models/company.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule, MatSelectModule, MatInputModule, MatFormFieldModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>group</mat-icon>
          </div>
          <div>
            <h1>Users</h1>
            <p class="subtitle">Manage system users across all companies</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-outline" (click)="loadUsers()" [disabled]="loading">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
          <button class="btn-primary" (click)="openCreateDialog()">
            <mat-icon>person_add</mat-icon>
            Add User
          </button>
        </div>
      </div>

      <div class="toast-message" *ngIf="toastMessage" [class.error]="toastType === 'error'" [class.success]="toastType === 'success'">
        <mat-icon>{{ toastType === 'error' ? 'error_outline' : 'check_circle' }}</mat-icon>
        <span>{{ toastMessage }}</span>
      </div>

      <div class="loading-state" *ngIf="loading">
        <span class="spinner"></span> Loading users...
      </div>

      <div class="table-wrap" *ngIf="!loading">
        <table class="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td class="cell-strong">{{ user.username }}</td>
              <td>
                <span class="role-badge" [class.super]="user.role === 'SUPER_ADMIN'">
                  {{ user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin' }}
                </span>
              </td>
              <td>{{ getCompanyName(user.companyId) }}</td>
              <td>
                <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="cell-muted">{{ user.createdAt ? (user.createdAt | slice:0:10) : '-' }}</td>
              <td>
                <button class="action-btn" (click)="resetPassword(user)">
                  <mat-icon>key</mat-icon> Reset Password
                </button>
                <button class="action-btn" *ngIf="user.isActive" (click)="deactivate(user)">
                  <mat-icon>block</mat-icon> Deactivate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ng-template #createDialogTemplate>
      <h2 mat-dialog-title>Add User</h2>
      <mat-dialog-content style="display:flex;flex-direction:column;gap:14px;min-width:380px;">
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput [(ngModel)]="newUsername" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput type="password" [(ngModel)]="newPassword" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select [(ngModel)]="newRole">
            <mat-option value="ADMIN">Admin</mat-option>
            <mat-option value="SUPER_ADMIN">Super Admin</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" *ngIf="newRole === 'ADMIN'">
          <mat-label>Company</mat-label>
          <mat-select [(ngModel)]="newCompanyId" required>
            <mat-option *ngFor="let c of companies" [value]="c.companyId">{{ c.companyName }}</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="error-message" *ngIf="createError">{{ createError }}</div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" [disabled]="creating" (click)="createUser()">
          <mat-icon>person_add</mat-icon> Create User
        </button>
      </mat-dialog-actions>
    </ng-template>
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
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 32px; flex-wrap: wrap; gap: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #059669, #34D399);
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
      background: #059669; color: white; border: none; border-radius: 12px;
      font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all 250ms ease;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    }
    .btn-primary:hover { background: #047857; transform: translateY(-1px); }
    .btn-primary mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 8px;
      height: 48px; padding: 0 20px;
      background: white; color: #059669; border: 1.5px solid #059669; border-radius: 12px;
      font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all 250ms ease;
    }
    .btn-outline:hover { background: #ECFDF5; }
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
      border: 2.5px solid #E5E7EB; border-top-color: #059669;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .table-wrap {
      background: white; border-radius: 20px; padding: 8px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      border: 1px solid #E5E7EB;
      overflow-x: auto;
    }
    .users-table { width: 100%; border-collapse: collapse; font-family: 'Poppins', sans-serif; }
    .users-table th {
      text-align: left; padding: 14px 16px;
      font-size: 12px; font-weight: 600; color: #64748B;
      text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 1px solid #F1F5F9;
    }
    .users-table td {
      padding: 14px 16px; font-size: 14px; color: #1E293B;
      border-bottom: 1px solid #F8FAFC;
    }
    .users-table tr:last-child td { border-bottom: none; }
    .cell-strong { font-weight: 600; }
    .cell-muted { color: #94A3B8; font-size: 13px; }
    .role-badge {
      padding: 4px 12px; border-radius: 999px;
      font-size: 12px; font-weight: 600;
      background: #ECFDF5; color: #065F46;
    }
    .role-badge.super { background: #F3E8FF; color: #6D28D9; }
    .status-badge { padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .status-badge.active { background: #D1FAE5; color: #065F46; }
    .status-badge.inactive { background: #FEE2E2; color: #991B1B; }
    .action-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; margin-right: 6px;
      border: 1px solid #E5E7EB; border-radius: 8px;
      background: white; color: #475569;
      font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 500;
      cursor: pointer; transition: all 200ms ease;
    }
    .action-btn:hover { background: #F8FAFC; border-color: #A7F3D0; color: #047857; }
    .action-btn mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .error-message { color: #EF4444; font-size: 13px; text-align: center; }
    @media (max-width: 767.98px) {
      .admin-page { padding: 16px; }
      .page-header h1 { font-size: 24px; }
      .header-actions { width: 100%; flex-direction: column; }
      .btn-primary, .btn-outline { justify-content: center; width: 100%; }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  companies: Company[] = [];
  loading = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  newUsername = '';
  newPassword = '';
  newRole = 'ADMIN';
  newCompanyId: number | null = null;
  creating = false;
  createError = '';
  dialogRef: any;

  @ViewChild('createDialogTemplate') createDialogTemplate!: TemplateRef<any>;

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.adminService.getCompanies().subscribe({
      next: (data) => this.companies = data,
      error: () => {}
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.showToast('Failed to load users: ' + this.errorMessage(err), 'error');
      }
    });
  }

  getCompanyName(companyId: number | null): string {
    if (!companyId) return '—';
    const company = this.companies.find(c => c.companyId === companyId);
    return company ? company.companyName : 'Company #' + companyId;
  }

  openCreateDialog(): void {
    this.newUsername = '';
    this.newPassword = '';
    this.newRole = 'ADMIN';
    this.newCompanyId = null;
    this.createError = '';
    this.dialogRef = this.dialog.open(this.createDialogTemplate!, { disableClose: true });
  }

  createUser(): void {
    if (!this.newUsername || !this.newPassword) {
      this.createError = 'Username and password are required';
      return;
    }
    if (this.newPassword.length < 6) {
      this.createError = 'Password must be at least 6 characters';
      return;
    }
    if (this.newRole === 'ADMIN' && !this.newCompanyId) {
      this.createError = 'Please select a company for the admin user';
      return;
    }

    this.creating = true;
    this.createError = '';
    this.adminService.createUser(this.newUsername, this.newPassword, this.newRole, this.newRole === 'ADMIN' ? this.newCompanyId : null).subscribe({
      next: () => {
        this.creating = false;
        this.dialogRef?.close();
        this.showToast('User created successfully!', 'success');
        this.loadUsers();
      },
      error: (err) => {
        this.creating = false;
        this.createError = this.errorMessage(err);
      }
    });
  }

  resetPassword(user: AdminUser): void {
    const newPassword = prompt(`Enter new password for user "${user.username}":`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      this.showToast('Password must be at least 6 characters', 'error');
      return;
    }
    this.adminService.resetUserPassword(user.userId, newPassword).subscribe({
      next: () => this.showToast('Password reset successfully!', 'success'),
      error: (err) => this.showToast(this.errorMessage(err), 'error')
    });
  }

  deactivate(user: AdminUser): void {
    if (!confirm(`Deactivate user "${user.username}"? They will not be able to log in.`)) return;
    this.adminService.deactivateUser(user.userId).subscribe({
      next: () => {
        this.showToast('User deactivated', 'success');
        this.loadUsers();
      },
      error: (err) => this.showToast(this.errorMessage(err), 'error')
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
