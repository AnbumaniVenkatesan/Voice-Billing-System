import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

export interface PaymentSuccessData {
  invoiceNumber: string;
  totalAmount: number;
}

@Component({
  selector: 'app-payment-success-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <mat-dialog-content style="text-align:center;padding:32px 24px;">
      <mat-icon style="font-size:64px;width:64px;height:64px;color:#4caf50;">check_circle</mat-icon>
      <h2 style="margin:16px 0 8px;color:#333;">Payment Successful!</h2>
      <p style="margin:0;font-size:14px;color:#666;">{{ data.invoiceNumber }}</p>
      <div style="font-size:28px;font-weight:bold;margin:16px 0;color:#2e7d32;">
        ₹{{ data.totalAmount }}
      </div>
      <p style="margin:0;font-size:13px;color:#888;">Receipt is printing...</p>
    </mat-dialog-content>
    <mat-dialog-actions align="center" style="justify-content:center;padding:0 24px 24px;">
      <button mat-raised-button color="primary" mat-dialog-close>
        <mat-icon>done</mat-icon> OK
      </button>
    </mat-dialog-actions>
  `
})
export class PaymentSuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PaymentSuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentSuccessData
  ) {}
}
