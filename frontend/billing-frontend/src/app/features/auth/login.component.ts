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
              <input matInput [(ngModel)]="username" name="username" required
                     autocapitalize="none" autocorrect="off" spellcheck="false"
                     autocomplete="username">
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [(ngModel)]="password" name="password"
                     [type]="hidePassword ? 'password' : 'text'" required
                     autocomplete="current-password">
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

          <div class="reset-username-section">
            <button type="button" class="reset-username-link" (click)="toggleSuperAdminUsername()"
                    *ngIf="!showSuperAdminUsername">
              <mat-icon>help_outline</mat-icon>
              Forgot username? Show super admin username
            </button>
            <div class="reset-username-box" *ngIf="showSuperAdminUsername">
              <div class="reset-username-header">
                <mat-icon>admin_panel_settings</mat-icon>
                <span>Super Admin Username</span>
                <button type="button" class="reset-username-close" (click)="showSuperAdminUsername = false">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <p class="reset-username-value" *ngIf="!usernameLoading">
                {{ superAdminUsername || 'No super admin account found' }}
              </p>
              <mat-spinner *ngIf="usernameLoading" diameter="18" class="spinner"></mat-spinner>
            </div>
          </div>
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

    .reset-username-section {
      margin-top: 16px;
      text-align: center;
    }

    .reset-username-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: none;
      color: #5B21B6;
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 8px;
      transition: background 200ms ease;
    }

    .reset-username-link:hover {
      background: #F3E8FF;
    }

    .reset-username-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .reset-username-box {
      margin-top: 12px;
      border: 1px solid #E9D5FF;
      background: #FAF5FF;
      border-radius: 12px;
      padding: 12px 14px;
      text-align: left;
    }

    .reset-username-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #6B21A8;
    }

    .reset-username-header mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .reset-username-close {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: none;
      color: #9333EA;
      cursor: pointer;
      padding: 2px;
      border-radius: 6px;
    }

    .reset-username-close:hover {
      background: #F3E8FF;
    }

    .reset-username-close mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .reset-username-value {
      margin: 8px 0 0;
      padding: 8px 12px;
      background: #FFFFFF;
      border: 1px solid #E9D5FF;
      border-radius: 8px;
      font-family: 'Poppins', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #4C1D95;
      text-align: center;
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
  showSuperAdminUsername = false;
  superAdminUsername = '';
  usernameLoading = false;

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
    this.username = this.username.trim();

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.router.navigate([response.role === 'SUPER_ADMIN' ? '/admin/companies' : '/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        if (status === 401) {
          this.errorMessage = err.error?.message || 'Invalid username or password';
        } else if (status === 403) {
          this.errorMessage = 'You do not have permission to access this system.';
        } else if (status === 0) {
          this.errorMessage = 'Cannot reach the server. Check your network connection and try again.';
        } else if (status && status >= 500) {
          this.errorMessage = 'Server error. Please try again in a moment.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }

  toggleSuperAdminUsername(): void {
    this.showSuperAdminUsername = true;
    if (this.superAdminUsername) return;
    this.usernameLoading = true;
    this.authService.getSuperAdminUsername().subscribe({
      next: (res) => {
        this.superAdminUsername = res.username || '';
        this.usernameLoading = false;
      },
      error: () => {
        this.superAdminUsername = '';
        this.usernameLoading = false;
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
