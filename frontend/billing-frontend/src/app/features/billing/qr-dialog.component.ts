import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

export interface QrDialogData {
  invoiceNumber: string;
  totalAmount: number;
  customerName: string;
  customerPhone?: string;
  qrCodeDataUrl: string;
  onCompleted: () => void;
  showMarkCompleted?: boolean;
  isHotel?: boolean;
}

@Component({
  selector: 'app-qr-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title style="text-align:center; font-family:'Courier New',monospace;">
      {{ data.invoiceNumber }}
    </h2>
    <mat-dialog-content style="text-align:center;">
      <img [src]="data.qrCodeDataUrl" alt="QR Code" style="width:256px;height:256px;display:block;margin:0 auto 16px;" />
      <div style="font-size:24px;font-weight:bold;margin:12px 0;color:#2e7d32;">
        ₹{{ data.totalAmount }}
      </div>
      <div style="margin:4px 0;font-size:14px;" *ngIf="data.customerName && !data.isHotel">
        <strong>Customer:</strong> {{ data.customerName }}
      </div>
      <div style="margin:4px 0;font-size:14px;" *ngIf="data.customerPhone && !data.isHotel">
        <strong>Phone:</strong> {{ data.customerPhone }}
      </div>
      <div style="margin:4px 0;font-size:14px;color:#ff9800;font-weight:500;">
        Scan QR to pay via any UPI app
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="center" style="justify-content:center;gap:8px;padding:16px;">
      <button mat-raised-button color="accent" *ngIf="data.showMarkCompleted" (click)="markCompleted()">
        <mat-icon>check_circle</mat-icon> Mark Completed
      </button>
      <button mat-stroked-button mat-dialog-close>
        <mat-icon>close</mat-icon> Close
      </button>
    </mat-dialog-actions>
  `
})
export class QrDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<QrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QrDialogData
  ) {}

  markCompleted(): void {
    this.data.onCompleted();
    this.dialogRef.close();
  }
}
