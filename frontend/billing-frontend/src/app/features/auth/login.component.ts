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
import { CompanyService } from '../../shared/services/company.service';

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
            <img *ngIf="companyLogo" [src]="companyLogo" alt="Logo" class="company-logo">
            <mat-icon *ngIf="!companyLogo" class="login-icon">store</mat-icon>
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
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
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
    .company-logo {
      max-width: 120px;
      max-height: 80px;
      object-fit: contain;
      margin-bottom: 8px;
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
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  hidePassword = true;
  loading = false;
  errorMessage = '';
  companyName = 'Smart Billing System';
  companyLogo: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.authService.getStatus().subscribe({
      next: (status) => {
        if (!status.hasUsers) {
          this.router.navigate(['/company-settings']);
          return;
        }
      },
      error: () => {}
    });

    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.companyName = data.companyName || 'Smart Billing System';
        if (data.logo) {
          this.companyLogo = data.logo.startsWith('http') ? data.logo : 'http://localhost:8080' + data.logo;
        }
      },
      error: () => {}
    });
  }

  onLogin(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
