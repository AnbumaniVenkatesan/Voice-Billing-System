import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="login-icon">store</mat-icon>
            <h2>{{ companyName }}</h2>
          </mat-card-title>
          <mat-card-subtitle>Sign in to continue</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="onLogin()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput [(ngModel)]="username" name="username" required>
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [(ngModel)]="password" name="password"
                     [type]="hidePassword ? 'password' : 'text'" required>
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <button mat-raised-button color="primary" type="submit"
                    class="full-width login-btn" [disabled]="loading">
              <mat-spinner *ngIf="loading" diameter="20" class="spinner"></mat-spinner>
              <span *ngIf="!loading">Login</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="login-card super-admin-card" *ngIf="showSuperAdminSetup">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="super-admin-icon">admin_panel_settings</mat-icon>
            <h2>Create Super Admin</h2>
          </mat-card-title>
          <mat-card-subtitle>No super admin exists yet. Create one to manage companies.</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="onCreateSuperAdmin()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Super Admin Username</mat-label>
              <input matInput [(ngModel)]="saUsername" name="saUsername" required>
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Super Admin Password</mat-label>
              <input matInput [(ngModel)]="saPassword" name="saPassword"
                     [type]="saHidePassword ? 'password' : 'text'" required>
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="saHidePassword = !saHidePassword">
                <mat-icon>{{saHidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
            </mat-form-field>

            <div class="error-message" *ngIf="saErrorMessage">
              {{ saErrorMessage }}
            </div>
            <div class="success-message" *ngIf="saSuccessMessage">
              {{ saSuccessMessage }}
            </div>

            <button mat-raised-button color="accent" type="submit"
                    class="full-width login-btn" [disabled]="saCreating">
              <mat-spinner *ngIf="saCreating" diameter="20" class="spinner"></mat-spinner>
              <span *ngIf="!saCreating">Create Super Admin</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
      min-height: 100vh;
      padding: 20px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .login-card {
      max-width: 400px;
      width: 100%;
      padding: 20px;
    }
    .login-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #3f51b5;
    }
    .super-admin-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #7B1FA2;
    }
    .full-width {
      width: 100%;
    }
    .login-btn {
      margin-top: 16px;
      padding: 8px;
    }
    .error-message {
      color: #f44336;
      text-align: center;
      margin-bottom: 8px;
    }
    .success-message {
      color: #2e7d32;
      text-align: center;
      margin-bottom: 8px;
    }
    .spinner {
      display: inline-block;
    }
    mat-card-header {
      justify-content: center;
      margin-bottom: 20px;
    }
    mat-card-title {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .super-admin-card {
      border: 2px solid #E1BEE7;
    }

    @media (max-width: 767.98px) {
      .login-container {
        padding: 20px 16px;
      }
      .login-card {
        padding: 16px;
      }
    }

    @media (max-width: 479.98px) {
      .login-card mat-card-title h2 {
        font-size: 20px;
      }
      mat-card-title {
        font-size: 20px;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  hidePassword = true;
  loading = false;
  errorMessage = '';
  companyName = 'Smart Billing System';
  showSuperAdminSetup = false;
  saUsername = '';
  saPassword = '';
  saHidePassword = true;
  saCreating = false;
  saErrorMessage = '';
  saSuccessMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getStatus().subscribe({
      next: (status) => {
        if (!status.hasUsers) {
          this.router.navigate(['/company-settings']);
          return;
        }
        this.showSuperAdminSetup = status.hasUsers && !status.hasSuperAdmin;
      },
      error: () => {}
    });
  }

  onLogin(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.router.navigate([response.role === 'SUPER_ADMIN' ? '/admin/companies' : '/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }

  onCreateSuperAdmin(): void {
    if (!this.saUsername || !this.saPassword) {
      this.saErrorMessage = 'Please enter both username and password';
      return;
    }
    if (this.saPassword.length < 6) {
      this.saErrorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.saCreating = true;
    this.saErrorMessage = '';
    this.saSuccessMessage = '';

    this.authService.createSuperAdmin(this.saUsername, this.saPassword).subscribe({
      next: () => {
        this.saCreating = false;
        this.saSuccessMessage = 'Super admin created! You can now log in.';
        this.showSuperAdminSetup = false;
        this.saUsername = '';
        this.saPassword = '';
      },
      error: (err) => {
        this.saCreating = false;
        this.saErrorMessage = err.error?.message || 'Failed to create super admin. Please try again.';
      }
    });
  }
}
