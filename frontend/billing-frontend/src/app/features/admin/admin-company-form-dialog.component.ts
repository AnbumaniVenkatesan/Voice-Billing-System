import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Company } from '../../shared/models/company.model';

export interface CompanyFormData {
  company: Company | null;
}

@Component({
  selector: 'app-admin-company-form-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>
      {{ isEdit ? 'Edit Company' : 'Add Company' }}
    </h2>
    <mat-dialog-content class="dialog-content">
      <div class="form-grid">
        <div class="form-group">
          <label>Company Name <span class="required">*</span></label>
          <input type="text" [(ngModel)]="company.companyName" class="form-input">
        </div>
        <div class="form-group">
          <label>Shop Type</label>
          <select [(ngModel)]="company.shopType" class="form-input">
            <option value="">Select type</option>
            <option value="Hotel">Hotel</option>
            <option value="Super Market">Super Market</option>
          </select>
        </div>
        <div class="form-group">
          <label>Owner Name</label>
          <input type="text" [(ngModel)]="company.ownerName" class="form-input">
        </div>
        <div class="form-group">
          <label>Phone Number <span class="required">*</span></label>
          <input type="tel" [(ngModel)]="company.phoneNumber" class="form-input">
        </div>
        <div class="form-group">
          <label>Alternate Phone</label>
          <input type="tel" [(ngModel)]="company.alternatePhone" class="form-input">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="company.email" class="form-input">
        </div>
        <div class="form-group">
          <label>GST Number</label>
          <input type="text" [(ngModel)]="company.gstNumber" class="form-input">
        </div>
        <div class="form-group">
          <label>PAN Number</label>
          <input type="text" [(ngModel)]="company.panNumber" class="form-input">
        </div>
        <div class="form-group full-span">
          <label>Address Line 1 <span class="required">*</span></label>
          <input type="text" [(ngModel)]="company.addressLine1" class="form-input">
        </div>
        <div class="form-group full-span">
          <label>Address Line 2</label>
          <input type="text" [(ngModel)]="company.addressLine2" class="form-input">
        </div>
        <div class="form-group">
          <label>City</label>
          <input type="text" [(ngModel)]="company.city" class="form-input">
        </div>
        <div class="form-group">
          <label>District</label>
          <input type="text" [(ngModel)]="company.district" class="form-input">
        </div>
        <div class="form-group">
          <label>State</label>
          <input type="text" [(ngModel)]="company.state" class="form-input">
        </div>
        <div class="form-group">
          <label>Country</label>
          <input type="text" [(ngModel)]="company.country" class="form-input">
        </div>
        <div class="form-group">
          <label>Pincode</label>
          <input type="text" [(ngModel)]="company.pincode" class="form-input">
        </div>
        <div class="form-group">
          <label>Website</label>
          <input type="text" [(ngModel)]="company.website" class="form-input">
        </div>
        <div class="form-group">
          <label>Invoice Prefix <span class="required">*</span></label>
          <input type="text" [(ngModel)]="company.invoicePrefix" class="form-input">
        </div>
        <div class="form-group">
          <label>Currency</label>
          <input type="text" [(ngModel)]="company.currency" class="form-input">
        </div>
        <div class="form-group">
          <label>Tax Rate (%)</label>
          <input type="number" [(ngModel)]="company.taxPercentage" class="form-input">
        </div>
        <div class="form-group">
          <label>UPI ID</label>
          <input type="text" [(ngModel)]="company.upiId" class="form-input">
        </div>
        <div class="form-group">
          <label>Bank Name</label>
          <input type="text" [(ngModel)]="company.bankName" class="form-input">
        </div>
        <div class="form-group">
          <label>Account Number</label>
          <input type="text" [(ngModel)]="company.bankAccountNumber" class="form-input">
        </div>
        <div class="form-group">
          <label>IFSC Code</label>
          <input type="text" [(ngModel)]="company.ifscCode" class="form-input">
        </div>
        <div class="form-group full-span">
          <label>Bill Footer</label>
          <input type="text" [(ngModel)]="company.billFooter" class="form-input">
        </div>
        <div class="form-group full-span">
          <label>Receipt Message</label>
          <input type="text" [(ngModel)]="company.receiptMessage" class="form-input">
        </div>
        <div class="form-group full-span">
          <label>Invoice Header</label>
          <textarea [(ngModel)]="company.invoiceHeader" rows="2" class="form-input form-textarea"></textarea>
        </div>
        <div class="form-group full-span">
          <label>Invoice Footer</label>
          <textarea [(ngModel)]="company.invoiceFooter" rows="2" class="form-input form-textarea"></textarea>
        </div>

        <ng-container *ngIf="!isEdit">
          <div class="full-span divider"></div>
          <div class="form-group">
            <label>Admin Username</label>
            <input type="text" [(ngModel)]="adminUsername" class="form-input">
          </div>
          <div class="form-group">
            <label>Admin Password</label>
            <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="adminPassword" class="form-input">
            <small class="hint">Optional. If omitted, you can add a user later from the Users page.</small>
          </div>
        </ng-container>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" style="padding: 8px 24px 20px;">
      <button mat-stroked-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="saving" (click)="submit()">
        <mat-icon>{{ saving ? 'hourglass_empty' : 'save' }}</mat-icon>
        {{ isEdit ? 'Save Changes' : 'Create Company' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    .dialog-content {
      font-family: 'Poppins', sans-serif;
      max-height: 70vh;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding-top: 8px;
    }
    .form-group { display: flex; flex-direction: column; }
    .form-group.full-span { grid-column: 1 / -1; }
    .form-group label {
      font-size: 12px; font-weight: 600; color: #1E293B; margin-bottom: 4px;
    }
    .required { color: #EF4444; }
    .form-input {
      height: 40px; padding: 0 12px;
      border: 1px solid #E5E7EB; border-radius: 10px;
      font-family: 'Poppins', sans-serif; font-size: 13px; color: #1E293B;
      background: white; outline: none; transition: all 250ms ease;
    }
    .form-input:focus { border-color: #1E40AF; box-shadow: 0 0 0 3px rgba(30,64,175,0.1); }
    .form-textarea { height: auto; padding: 10px 12px; resize: vertical; }
    .divider { height: 1px; background: #E5E7EB; margin: 4px 0; }
    .hint { font-size: 11px; color: #94A3B8; margin-top: 4px; }
    @media (max-width: 560px) {
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminCompanyFormDialogComponent implements OnInit {
  company: Company = {} as Company;
  isEdit = false;
  saving = false;
  adminUsername = '';
  adminPassword = '';
  showPassword = false;

  constructor(
    public dialogRef: MatDialogRef<AdminCompanyFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompanyFormData
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data?.company;
    if (this.isEdit && this.data.company) {
      this.company = { ...this.data.company };
    } else {
      this.company = {
        shopType: 'Hotel',
        currency: '₹',
        invoicePrefix: 'INV',
        taxPercentage: 3,
        country: 'India',
        isActive: true
      } as any;
    }
  }

  submit(): void {
    if (!this.company.companyName || !this.company.phoneNumber || !this.company.addressLine1 || !this.company.invoicePrefix) {
      return;
    }
    this.saving = true;
    const request: any = { ...this.company };
    if (!this.isEdit) {
      request.username = this.adminUsername || undefined;
      request.password = this.adminPassword || undefined;
    }
    this.dialogRef.close({ isEdit: this.isEdit, company: request });
  }
}
