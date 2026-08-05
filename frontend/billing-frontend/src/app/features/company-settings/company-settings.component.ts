import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CompanyService } from '../../shared/services/company.service';
import { AuthService } from '../../core/auth/auth.service';
import { Company } from '../../shared/models/company.model';
import { ConfirmService } from '../../shared/services/confirm.service';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatTooltipModule
  ],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <mat-icon>settings</mat-icon>
          </div>
          <div>
            <h1>Company Settings</h1>
            <p class="subtitle">Manage your business profile and preferences</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-outline header-clear" (click)="clearForm()" [disabled]="saving">
            <mat-icon>restart_alt</mat-icon>
            Clear
          </button>
          <button class="btn-primary save-top" (click)="save()" [disabled]="saving">
            <mat-icon>{{ saving ? 'hourglass_empty' : 'save' }}</mat-icon>
            {{ saving ? 'Saving...' : (isFirstTime ? 'Save & Continue' : 'Save Changes') }}
          </button>
        </div>
      </div>

      <div class="setup-banner" *ngIf="isFirstTime">
        <mat-icon>info</mat-icon>
        <span>Welcome! Complete your company details below, then create your login credentials to get started.</span>
      </div>

      <div class="toast-message" *ngIf="toastMessage" [class.error]="toastType === 'error'" [class.success]="toastType === 'success'">
        <mat-icon>{{ toastType === 'error' ? 'error_outline' : 'check_circle' }}</mat-icon>
        <span>{{ toastMessage }}</span>
        <button class="toast-close" (click)="toastMessage = ''">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="settings-grid" *ngIf="company">
        <!-- Basic Information -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon blue">
              <mat-icon>business</mat-icon>
            </div>
            <div>
              <h2>Basic Information</h2>
              <p class="section-desc">Your company's core details</p>
            </div>
          </div>
          <div class="section-divider"></div>
          <div class="form-grid">
            <div class="form-group">
              <label>Company Name <span class="required">*</span></label>
              <input type="text" [(ngModel)]="company.companyName" placeholder="Enter company name" class="form-input">
            </div>
            <div class="form-group">
              <label>Shop Type <span class="required">*</span></label>
              <select [(ngModel)]="company.shopType" class="form-select">
                <option value="">Select type</option>
                <option value="Hotel">Hotel</option>
                <option value="Super Market">Super Market</option>
              </select>
            </div>
            <div class="form-group">
              <label>Address <span class="required">*</span></label>
              <input type="text" [(ngModel)]="company.addressLine1" placeholder="Street address" class="form-input">
            </div>
            <div class="form-group">
              <label>Address Line 2</label>
              <input type="text" [(ngModel)]="company.addressLine2" placeholder="Suite, floor, etc." class="form-input">
            </div>
            <div class="form-group">
              <label>City</label>
              <input type="text" [(ngModel)]="company.city" placeholder="City" class="form-input">
            </div>
            <div class="form-group">
              <label>District</label>
              <input type="text" [(ngModel)]="company.district" placeholder="District" class="form-input">
            </div>
            <div class="form-group">
              <label>State</label>
              <input type="text" [(ngModel)]="company.state" placeholder="State" class="form-input">
            </div>
            <div class="form-group">
              <label>Country</label>
              <input type="text" [(ngModel)]="company.country" placeholder="Country" class="form-input">
            </div>
            <div class="form-group">
              <label>Pincode</label>
              <input type="text" [(ngModel)]="company.pincode" placeholder="Pincode" class="form-input">
            </div>
            <div class="form-group">
              <label>Website</label>
              <input type="text" [(ngModel)]="company.website" placeholder="https://example.com" class="form-input">
            </div>
          </div>

          <div class="credentials-section" *ngIf="isFirstTime">
            <div class="section-divider"></div>
            <h3>
              <mat-icon>lock</mat-icon>
              Create Login Credentials
            </h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Username <span class="required">*</span></label>
                <input type="text" [(ngModel)]="username" placeholder="Choose a username" class="form-input">
              </div>
              <div class="form-group">
                <label>Password <span class="required">*</span></label>
                <div class="password-field">
                  <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" placeholder="Min 6 characters" class="form-input">
                  <button class="password-toggle" (click)="showPassword = !showPassword" type="button">
                    <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
              </div>
            </div>
            <div class="section-divider"></div>
            <h3>
              <mat-icon>admin_panel_settings</mat-icon>
              Super Admin (Optional)
            </h3>
            <p class="section-hint">A super admin manages all companies from a single dashboard. Create one now or set it up later from the login page.</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Super Admin Username</label>
                <input type="text" [(ngModel)]="superAdminUsername" placeholder="Choose a super admin username" class="form-input">
              </div>
              <div class="form-group">
                <label>Super Admin Password</label>
                <div class="password-field">
                  <input [type]="saShowPassword ? 'text' : 'password'" [(ngModel)]="superAdminPassword" placeholder="Min 6 characters" class="form-input">
                  <button class="password-toggle" (click)="saShowPassword = !saShowPassword" type="button">
                    <mat-icon>{{ saShowPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Details -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon green">
              <mat-icon>contact_phone</mat-icon>
            </div>
            <div>
              <h2>Contact Details</h2>
              <p class="section-desc">Phone numbers and email address</p>
            </div>
          </div>
          <div class="section-divider"></div>
          <div class="form-grid">
            <div class="form-group">
              <label>Phone Number <span class="required">*</span></label>
              <input type="tel" [(ngModel)]="company.phoneNumber" placeholder="Primary phone" class="form-input">
            </div>
            <div class="form-group">
              <label>Alternate Phone</label>
              <input type="tel" [(ngModel)]="company.alternatePhone" placeholder="Secondary phone" class="form-input">
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="company.email" placeholder="company@example.com" class="form-input">
            </div>
          </div>
        </div>

        <!-- Tax Settings -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon amber">
              <mat-icon>receipt_long</mat-icon>
            </div>
            <div>
              <h2>Tax Settings</h2>
              <p class="section-desc">Configure tax rates and registration</p>
            </div>
          </div>
          <div class="section-divider"></div>
          <div class="form-grid">
            <div class="form-group">
              <label>GST Number</label>
              <input type="text" [(ngModel)]="company.gstNumber" placeholder="22AAAAA0000A1Z5" class="form-input">
            </div>
            <div class="form-group">
              <label>PAN Number</label>
              <input type="text" [(ngModel)]="company.panNumber" placeholder="ABCDE1234F" class="form-input">
            </div>
            <div class="form-group">
              <label>Tax Rate (%)</label>
              <input type="number" [(ngModel)]="company.taxPercentage" placeholder="e.g. 5" class="form-input">
            </div>
            <div class="form-group">
              <label>Currency</label>
              <input type="text" [(ngModel)]="company.currency" placeholder="₹" class="form-input">
            </div>
          </div>
        </div>

        <!-- Invoice Settings -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon purple">
              <mat-icon>receipt</mat-icon>
            </div>
            <div>
              <h2>Invoice Settings</h2>
              <p class="section-desc">Invoice numbering and receipt options</p>
            </div>
          </div>
          <div class="section-divider"></div>
          <div class="form-grid">
            <div class="form-group">
              <label>Invoice Prefix <span class="required">*</span></label>
              <input type="text" [(ngModel)]="company.invoicePrefix" placeholder="e.g. INV" class="form-input">
            </div>
            <div class="form-group">
              <label>Next Invoice Number</label>
              <input type="text" [(ngModel)]="nextInvoiceNumber" placeholder="Auto-incremented" class="form-input" disabled>
            </div>
            <div class="form-group full-span">
              <label>Bill Footer</label>
              <input type="text" [(ngModel)]="company.billFooter" placeholder="e.g. Thank You, Visit Again!" class="form-input">
            </div>
          </div>
        </div>

        <!-- Payment Gateway -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon red">
              <mat-icon>payment</mat-icon>
            </div>
            <div>
              <h2>Payment Gateway</h2>
              <p class="section-desc">Configure your payment gateway credentials</p>
            </div>
          </div>
          <div class="section-divider"></div>
          <div class="form-grid">
            <div class="form-group">
              <label>Gateway Provider</label>
              <select [(ngModel)]="company.paymentGateway" class="form-select">
                <option value="">Select provider</option>
                <option value="Paytm">Paytm</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Cashfree">Cashfree</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Google Pay">Google Pay</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Merchant ID</label>
              <input type="text" [(ngModel)]="company.gatewayMerchantId" placeholder="Merchant ID" class="form-input">
            </div>
            <div class="form-group full-span">
              <label>Merchant Key</label>
              <input type="text" [(ngModel)]="company.gatewayMerchantKey" placeholder="Merchant key / secret" class="form-input">
            </div>
          </div>
        </div>

        <!-- Bank Details -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon teal">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div>
              <h2>Bank &amp; Payment Details</h2>
              <p class="section-desc">Bank account and UPI information</p>
            </div>
          </div>
          <div class="section-divider"></div>
          <div class="form-grid">
            <div class="form-group">
              <label>UPI ID</label>
              <input type="text" [(ngModel)]="company.upiId" placeholder="e.g. yourname@upi" class="form-input">
            </div>
            <div class="form-group">
              <label>Bank Name</label>
              <input type="text" [(ngModel)]="company.bankName" placeholder="Bank name" class="form-input">
            </div>
            <div class="form-group">
              <label>Account Number</label>
              <input type="text" [(ngModel)]="company.bankAccountNumber" placeholder="Account number" class="form-input">
            </div>
            <div class="form-group">
              <label>IFSC Code</label>
              <input type="text" [(ngModel)]="company.ifscCode" placeholder="IFSC code" class="form-input">
            </div>
          </div>
        </div>

        <!-- Logo -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon indigo">
              <mat-icon>image</mat-icon>
            </div>
            <div>
              <h2>Company Logo</h2>
              <p class="section-desc">Upload your business logo for invoices</p>
            </div>
          </div>
          <div class="section-divider"></div>
          <div class="logo-area">
            <div class="logo-preview" *ngIf="company.logo">
              <img [src]="getLogoUrl()" alt="Company Logo" />
            </div>
            <div class="logo-placeholder" *ngIf="!company.logo">
              <mat-icon>add_photo_alternate</mat-icon>
              <span>No logo uploaded</span>
            </div>
            <div class="logo-actions">
              <button class="btn-outline" (click)="logoInput.click()">
                <mat-icon>upload</mat-icon>
                {{ company.logo ? 'Change Logo' : 'Upload Logo' }}
              </button>
              <button *ngIf="company.logo" class="btn-danger" (click)="removeLogo()">
                <mat-icon>delete</mat-icon>
                Remove Logo
              </button>
              <p class="hint">PNG or JPEG, max 5MB</p>
            </div>
            <input #logoInput type="file" accept="image/png,image/jpeg,image/jpg" hidden
                   (change)="onLogoSelected($event)">
          </div>
        </div>
      </div>

      <!-- Sticky Save Footer -->
      <div class="save-footer">
        <div class="save-footer-inner">
          <span class="save-status" *ngIf="saving">
            <span class="spinner"></span> Saving your changes...
          </span>
          <button class="btn-primary save-btn" (click)="save()" [disabled]="saving">
            <mat-icon>{{ saving ? 'hourglass_empty' : 'save' }}</mat-icon>
            {{ saving ? 'Saving...' : (isFirstTime ? 'Save & Continue to Login' : 'Save All Changes') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    .settings-page {
      font-family: 'Poppins', sans-serif;
      background: #F8FAFC;
      min-height: 100vh;
      padding: 32px;
      padding-bottom: 120px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #1E40AF, #3B82F6);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon {
      color: white;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
    }

    .subtitle {
      font-size: 14px;
      color: #64748B;
      margin-top: 2px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 48px;
      padding: 0 28px;
      background: #1E40AF;
      color: white;
      border: none;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 250ms ease;
      box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      background: #1D4ED8;
      box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .setup-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #DBEAFE, #EFF6FF);
      border: 1px solid #93C5FD;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      color: #1E40AF;
      font-size: 14px;
    }

    .setup-banner mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .toast-message {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      font-size: 14px;
      font-weight: 500;
      animation: slideDown 300ms ease;
    }

    .toast-message.success {
      background: #ECFDF5;
      border: 1px solid #6EE7B7;
      color: #065F46;
    }

    .toast-message.error {
      background: #FEF2F2;
      border: 1px solid #FCA5A5;
      color: #991B1B;
    }

    .toast-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .toast-close {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .toast-close:hover {
      background: rgba(0,0,0,0.05);
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .section-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      border: 1px solid #E5E7EB;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 4px;
    }

    .section-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: white;
    }

    .section-icon.blue { background: linear-gradient(135deg, #1E40AF, #3B82F6); }
    .section-icon.green { background: linear-gradient(135deg, #047857, #10B981); }
    .section-icon.amber { background: linear-gradient(135deg, #B45309, #F59E0B); }
    .section-icon.purple { background: linear-gradient(135deg, #6D28D9, #8B5CF6); }
    .section-icon.teal { background: linear-gradient(135deg, #0F766E, #14B8A6); }
    .section-icon.red { background: linear-gradient(135deg, #B91C1C, #EF4444); }
    .section-icon.indigo { background: linear-gradient(135deg, #3730A3, #6366F1); }

    .section-header h2 {
      font-size: 17px;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }

    .section-desc {
      font-size: 13px;
      color: #64748B;
      margin-top: 1px;
    }

    .section-divider {
      height: 1px;
      background: #E5E7EB;
      margin: 16px 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-span {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 6px;
    }

    .required {
      color: #EF4444;
    }

    .form-input,
    .form-select {
      height: 48px;
      padding: 0 16px;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      color: #1E293B;
      background: white;
      transition: all 250ms ease;
      outline: none;
    }

    .form-select {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748B' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      padding-right: 36px;
    }

    .form-input::placeholder {
      color: #94A3B8;
    }

    .form-textarea {
      height: auto;
      padding: 12px 16px;
      resize: vertical;
      font-family: 'Poppins', sans-serif;
    }

    .section-hint {
      font-size: 12px;
      color: #64748B;
      margin: -8px 0 14px;
    }

    .form-input:focus,
    .form-select:focus {
      border-color: #1E40AF;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }

    .credentials-section {
      margin-top: 4px;
    }

    .credentials-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 16px;
    }

    .credentials-section h3 mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #1E40AF;
    }

    .password-field {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-field .form-input {
      width: 100%;
      padding-right: 48px;
    }

    .password-toggle {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748B;
    }

    .password-toggle:hover {
      background: #F1F5F9;
    }

    .password-toggle mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .logo-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .logo-preview img {
      max-width: 220px;
      max-height: 140px;
      object-fit: contain;
      border: 2px solid #E5E7EB;
      border-radius: 12px;
      padding: 12px;
      background: #F8FAFC;
    }

    .logo-placeholder {
      width: 220px;
      height: 120px;
      border: 2px dashed #CBD5E1;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94A3B8;
      gap: 8px;
    }

    .logo-placeholder mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }

    .logo-placeholder span {
      font-size: 13px;
    }

    .logo-actions {
      text-align: center;
    }

    .btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      padding: 0 24px;
      background: white;
      color: #1E40AF;
      border: 1.5px solid #1E40AF;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 250ms ease;
    }

    .btn-outline:hover {
      background: #DBEAFE;
    }

    .btn-outline mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .btn-danger {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      padding: 0 24px;
      background: #FEF2F2;
      color: #DC2626;
      border: 1.5px solid #DC2626;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 250ms ease;
      margin-left: 10px;
    }

    .btn-danger:hover {
      background: #FEE2E2;
    }

    .btn-danger mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .hint {
      font-size: 12px;
      color: #94A3B8;
      margin-top: 8px;
    }

    .save-footer {
      position: fixed;
      bottom: 0;
      left: 240px;
      right: 0;
      background: white;
      border-top: 1px solid #E5E7EB;
      padding: 16px 32px;
      z-index: 100;
      box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.06);
    }

    .save-footer-inner {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 20px;
    }

    .save-status {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #64748B;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid #E5E7EB;
      border-top-color: #1E40AF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .save-btn {
      min-width: 220px;
      justify-content: center;
    }

    @media (max-width: 1200px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .settings-page { padding: 16px; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .form-grid { grid-template-columns: 1fr; }
      .save-footer { left: 0; }
    }

    @media (max-width: 767.98px) {
      .settings-page {
        padding: 16px;
        padding-bottom: 110px;
      }
      .page-header h1 {
        font-size: 24px;
      }
      .header-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
      }
      .header-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      .save-top {
        width: 100%;
        justify-content: center;
      }
      .header-actions {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }
      .header-clear {
        justify-content: center;
      }
      .save-footer {
        padding: 12px 16px;
      }
      .save-footer-inner {
        flex-direction: column-reverse;
        gap: 10px;
        align-items: stretch;
      }
      .save-status {
        justify-content: center;
      }
      .save-btn {
        width: 100%;
        min-width: 0;
        justify-content: center;
      }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-clear {
      height: 48px;
      padding: 0 20px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: white;
      color: #1E40AF;
      border: 1.5px solid #1E40AF;
      border-radius: 12px;
      font-family: 'Poppins', sans-serif;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 250ms ease;
    }

    .header-clear:hover:not(:disabled) {
      background: #DBEAFE;
    }

    .header-clear:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .header-clear mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .setup-banner {
        flex-direction: column;
        text-align: center;
      }
      .logo-preview img {
        max-width: 100%;
      }
      .logo-placeholder {
        width: 100%;
        max-width: 220px;
      }
    }
  `]
})
export class CompanySettingsComponent implements OnInit {
  company: Company = { shopType: 'Hotel' } as Company;
  saving = false;
  isFirstTime = false;
  username = '';
  password = '';
  showPassword = false;
  superAdminUsername = '';
  superAdminPassword = '';
  saShowPassword = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  nextInvoiceNumber = '';

  constructor(
    private companyService: CompanyService,
    private authService: AuthService,
    private router: Router,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.isFirstTime = true;
      return;
    }

    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company = data;
        this.nextInvoiceNumber = (data as any).nextInvoiceNumber || '';
      },
      error: () => this.showToast('Failed to load company details', 'error')
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => this.toastMessage = '', 5000);
  }

  getLogoUrl(): string {
    if (!this.company.logo) return '';
    if (this.company.logo.startsWith('http')) return this.company.logo;
    return 'http://localhost:8080' + this.company.logo;
  }

  clearForm(): void {
    this.confirmService.confirm({
      title: 'Discard Changes?',
      message: 'Clear all unsaved changes?',
      confirmLabel: 'Discard'
    }).subscribe(confirmed => {
      if (!confirmed) return;

      if (this.isFirstTime) {
        this.company = { shopType: 'Hotel' } as Company;
        this.username = '';
        this.password = '';
        this.superAdminUsername = '';
        this.superAdminPassword = '';
        this.nextInvoiceNumber = '';
        return;
      }

      this.companyService.getCompany().subscribe({
        next: (data) => {
          this.company = data;
          this.nextInvoiceNumber = (data as any).nextInvoiceNumber || '';
          this.showToast('Form reset to saved values', 'success');
        },
        error: () => this.showToast('Failed to reload company details', 'error')
      });
    });
  }

  save(): void {
    if (!this.company.companyName || !this.company.phoneNumber || !this.company.addressLine1 || !this.company.invoicePrefix || !this.company.shopType) {
      this.showToast('Please fill required fields: Company Name, Shop Type, Phone, Address, Invoice Prefix', 'error');
      return;
    }

    if (this.isFirstTime && (!this.username || !this.password)) {
      this.showToast('Please enter a username and password to create your login', 'error');
      return;
    }

    if (this.isFirstTime && this.password.length < 6) {
      this.showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (this.isFirstTime && this.superAdminPassword && this.superAdminPassword.length < 6) {
      this.showToast('Super admin password must be at least 6 characters', 'error');
      return;
    }

    this.saving = true;

    const request: any = {
      companyName: this.company.companyName,
      ownerName: this.company.ownerName || '',
      shopType: this.company.shopType || '',
      gstNumber: this.company.gstNumber || '',
      panNumber: this.company.panNumber || '',
      phoneNumber: this.company.phoneNumber,
      alternatePhone: this.company.alternatePhone || '',
      email: this.company.email || '',
      website: this.company.website || '',
      addressLine1: this.company.addressLine1,
      addressLine2: this.company.addressLine2 || '',
      city: this.company.city || '',
      district: this.company.district || '',
      state: this.company.state || '',
      country: this.company.country || '',
      pincode: this.company.pincode || '',
      upiId: this.company.upiId || '',
      bankName: this.company.bankName || '',
      bankAccountNumber: this.company.bankAccountNumber || '',
      ifscCode: this.company.ifscCode || '',
      paymentGateway: this.company.paymentGateway || '',
      gatewayMerchantId: this.company.gatewayMerchantId || '',
      gatewayMerchantKey: this.company.gatewayMerchantKey || '',
      invoicePrefix: this.company.invoicePrefix,
      currency: this.company.currency || '₹',
      taxPercentage: this.company.taxPercentage || null,
      billFooter: this.company.billFooter || ''
    };

    let save$;

    if (this.isFirstTime) {
      request.username = this.username;
      request.password = this.password;
      if (this.superAdminUsername && this.superAdminPassword) {
        request.superAdminUsername = this.superAdminUsername;
        request.superAdminPassword = this.superAdminPassword;
      }
      save$ = this.companyService.setupCompany(request);
    } else {
      save$ = this.companyService.updateCompany(this.company.companyId, request);
    }

    save$.subscribe({
      next: (data) => {
        this.company = data;
        this.saving = false;
        if (this.isFirstTime) {
          this.showToast('Company saved! Redirecting to login...', 'success');
          setTimeout(() => this.router.navigate(['/login']), 1500);
        } else {
          this.showToast('Company details saved successfully!', 'success');
        }
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.message || err.error?.error || JSON.stringify(err.error) || 'Save failed';
        this.showToast('Error: ' + msg, 'error');
      }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('File size must be under 5MB', 'error');
      return;
    }

    this.companyService.uploadLogo(file).subscribe({
      next: (data) => {
        this.company = data;
        this.showToast('Logo uploaded successfully', 'success');
      },
      error: (err) => this.showToast('Upload failed: ' + (err.error?.message || 'Server error'), 'error')
    });

    input.value = '';
  }

  removeLogo(): void {
    this.companyService.removeLogo().subscribe({
      next: (data) => {
        this.company = data;
        this.showToast('Logo removed', 'success');
      },
      error: (err) => this.showToast('Failed to remove logo: ' + (err.error?.message || 'Server error'), 'error')
    });
  }
}
