import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

export interface QrDialogData {
  invoiceNumber: string;
  totalAmount: number;
  qrCodeDataUrl: string;
  paymentMethod?: string;
  onPaymentReceived?: () => void;
  onChangeToCash?: () => void;
  onCompleted?: () => void;
  isHotel?: boolean;
}

@Component({
  selector: 'app-qr-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="qr-root">
      <h2 mat-dialog-title class="qr-title">{{ data.invoiceNumber }}</h2>

      <mat-dialog-content class="qr-content">
        <div class="info-row">
          <span class="info-label">Total Amount</span>
          <span class="info-value amount">&#8377;{{ data.totalAmount }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method</span>
          <span class="info-value">{{ paymentMethod }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Status</span>
          <span class="status-pill {{ statusClass }}">{{ statusLabel }}</span>
        </div>

        <div class="qr-frame">
          <img [src]="data.qrCodeDataUrl" alt="QR Code" />
        </div>

        <p class="scan-hint" *ngIf="!paid">Scan QR to pay via any UPI app</p>
      </mat-dialog-content>

      <mat-dialog-actions align="center" class="qr-actions">
        <button mat-raised-button class="act-received"
                *ngIf="!paid && (data.onPaymentReceived || data.onCompleted)"
                (click)="paymentReceived()">
          <mat-icon>check_circle</mat-icon> Payment Received
        </button>
        <button mat-raised-button class="act-cash"
                *ngIf="!paid && data.onChangeToCash"
                (click)="changeToCash()">
          <mat-icon>payments</mat-icon> Change to Cash
        </button>
        <button mat-stroked-button (click)="closeDialog()">
          <mat-icon>done</mat-icon> Close
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .qr-root { font-family: 'Roboto', sans-serif; }
    .qr-title {
      text-align: center;
      font-family: 'Courier New', monospace;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .qr-content { text-align: center; }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
      font-size: 14px;
      border-bottom: 1px dashed #E5E7EB;
    }
    .info-label { color: #64748B; }
    .info-value { font-weight: 600; color: #1E293B; }
    .info-value.amount { font-size: 18px; font-weight: 700; color: #2E7D32; }
    .status-pill {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-pill.completed { background: #DCFCE7; color: #15803D; }
    .status-pill.paid { background: #DCFCE7; color: #15803D; }
    .qr-frame {
      display: inline-block;
      margin: 16px 0 4px;
      padding: 12px;
      background: #fff;
      border: 2px solid #E5E7EB;
      border-radius: 12px;
    }
    .qr-frame img { width: 240px; height: 240px; display: block; }
    .scan-hint { color: #E65100; font-weight: 500; margin: 8px 0 0; }
    .qr-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px 20px;
    }
    .act-received { background: #2E7D32; }
    .act-received:not(:disabled) { background: #2E7D32; }
    .act-cash { background: #EF6C00; }
    .act-received mat-icon, .act-cash mat-icon {
      margin-right: 4px;
    }
  `]
})
export class QrDialogComponent {
  paid = false;
  paymentMethod = 'QR';

  constructor(
    public dialogRef: MatDialogRef<QrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QrDialogData
  ) {
    this.paymentMethod = (this.data.paymentMethod || 'QR').toUpperCase();
  }

  get statusLabel(): string {
    return this.paid ? 'Paid' : 'Completed';
  }

  get statusClass(): string {
    return this.paid ? 'paid' : 'completed';
  }

  paymentReceived(): void {
    if (this.paid) return;
    this.paid = true;
    if (this.data.onPaymentReceived) this.data.onPaymentReceived();
    else if (this.data.onCompleted) this.data.onCompleted();
  }

  changeToCash(): void {
    if (this.paid) return;
    this.paid = true;
    this.paymentMethod = 'CASH';
    if (this.data.onChangeToCash) this.data.onChangeToCash();
    this.dialogRef.close();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
