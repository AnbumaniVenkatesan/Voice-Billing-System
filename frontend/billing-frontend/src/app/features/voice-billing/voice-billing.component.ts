import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { VoiceService } from '../../shared/services/voice.service';
import { InvoiceService } from '../../shared/services/invoice.service';
import { CompanyService } from '../../shared/services/company.service';
import { VoiceItem, VoiceResponse, Invoice, UnmatchedItem, SuggestedProduct, Product, TaxSlab } from '../../shared/models/models';
import { Company } from '../../shared/models/company.model';
import { aggregateTaxSlabs, formatMoney } from '../../shared/utils/gst.util';
import { ProductSearchDialogComponent, ProductSearchResult } from './product-search-dialog.component';
import { QrDialogComponent } from '../billing/qr-dialog.component';
import { PaymentSuccessDialogComponent } from '../billing/payment-success-dialog.component';
import { ReceiptPrintComponent } from '../billing/receipt-print.component';
import * as QRCode from 'qrcode';

declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-voice-billing',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatRadioModule, MatSnackBarModule, MatDialogModule, MatProgressBarModule
  ],
  template: `
    <div class="voice-billing-page">

      <!-- ─── Page Header ─── -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <mat-icon>record_voice_over</mat-icon>
          </div>
          <div class="header-title-block">
            <h1>Voice Billing</h1>
            <p class="header-subtitle">Speak to add products instantly</p>
          </div>
          <button type="button" class="mic-button mic-inline"
                  [class.active]="isListening" (click)="toggleVoice()">
            <mat-icon>{{ isListening ? 'mic' : 'mic_off' }}</mat-icon>
          </button>
        </div>
        <div class="header-right">
          <span class="status-badge active" *ngIf="isListening">
            <span class="status-dot"></span>
            Listening
          </span>
          <span class="status-badge processing" *ngIf="isProcessing">
            <span class="status-dot"></span>
            Processing
          </span>
        </div>
      </div>

      <div class="voice-layout">

        <!-- ═══════════ LEFT COLUMN: Voice Controls ═══════════ -->
        <div class="left-column">

          <!-- Mic Control Card -->
          <div class="card mic-card" [class.listening]="isListening">
            <div class="mic-area">
              <button class="mic-button" [class.active]="isListening" (click)="toggleVoice()">
                <div class="mic-pulse" *ngIf="isListening"></div>
                <div class="mic-pulse-ring" *ngIf="isListening"></div>
                <div class="mic-inner">
                  <mat-icon>{{ isListening ? 'mic' : 'mic_off' }}</mat-icon>
                </div>
              </button>
              <p class="mic-label" *ngIf="!isListening">Click mic to start</p>
              <p class="mic-label listening" *ngIf="isListening">Listening...</p>
              <p class="mic-hint" *ngIf="isProcessing">
                <mat-icon class="hint-icon">hourglass_top</mat-icon>
                Processing previous item...
              </p>
            </div>
          </div>

          <mat-progress-bar *ngIf="isProcessing" mode="indeterminate" class="processing-bar"></mat-progress-bar>

        </div>

        <!-- ═══════════ RIGHT COLUMN: Products & Cart ═══════════ -->
        <div class="right-column">

          <!-- Empty State -->
          <div class="empty-state" *ngIf="cart.length === 0 && unmatchedItems.length === 0 && !isProcessing">
            <div class="empty-icon-wrap">
              <mat-icon>record_voice_over</mat-icon>
            </div>
            <h3>No items yet</h3>
            <p>Click mic and speak your order</p>
          </div>

          <!-- Product Cards Grid -->
          <div class="products-section" *ngIf="cart.length > 0 || unmatchedItems.length > 0">

            <!-- Mobile Quick Total -->
            <div class="mobile-cart-total" *ngIf="cart.length > 0">
              <span class="mct-label">Total Amount</span>
              <span class="mct-value">&#8377;{{ subtotal.toFixed(2) }}</span>
            </div>

            <!-- Matched Products -->
            <div class="section-label" *ngIf="cart.length > 0">
              <mat-icon>inventory_2</mat-icon>
              <span>Cart Items ({{ cart.length }})</span>
            </div>

            <div class="products-grid">
              <div class="product-card" *ngFor="let item of cart; let i = index"
                   [style.animation-delay]="(i * 80) + 'ms'">
                <div class="product-card-top">
                  <div class="product-info">
                    <span class="product-name">{{ item.productName }}</span>
                    <span class="product-tamil" *ngIf="item.tamilName">{{ item.tamilName }}</span>
                  </div>
                  <button class="icon-btn danger" (click)="removeFromCart(i)" matTooltip="Remove">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <div class="product-card-bottom">
                  <span class="product-price">&#8377;{{ item.price.toFixed(2) }}</span>
                  <div class="qty-control">
                    <button class="qty-btn" (click)="item.quantity = item.quantity > 1 ? item.quantity - 1 : 1; calculateTotals()">
                      <mat-icon>remove</mat-icon>
                    </button>
                    <span class="qty-value">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="item.quantity = item.quantity + 1; calculateTotals()">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                  <span class="product-total">&#8377;{{ (item.quantity * item.price).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- Unmatched Items -->
            <div class="section-label warning" *ngIf="unmatchedItems.length > 0">
              <mat-icon>warning_amber</mat-icon>
              <span>Unmatched Items ({{ unmatchedItems.length }})</span>
            </div>

            <div class="unmatched-list">
              <div class="unmatched-card" *ngFor="let item of unmatchedItems; let i = index"
                   [style.animation-delay]="(i * 100) + 'ms'">
                <div class="unmatched-header">
                  <div class="unmatched-info">
                    <span class="unmatched-spoken">{{ item.spokenText }}</span>
                    <span class="unmatched-qty">{{ item.quantity }} {{ item.unit }}</span>
                  </div>
                </div>

                <div class="suggestions-group" *ngIf="item.suggestions && item.suggestions.length > 0">
                  <mat-radio-group [(ngModel)]="selectedSuggestions[i]" class="suggestions-radio">
                    <label class="suggestion-item" *ngFor="let s of item.suggestions">
                      <mat-radio-button [value]="s.productId">
                        <span class="suggestion-name">{{ s.productName }}</span>
                        <span class="suggestion-price">&#8377;{{ s.price }}</span>
                      </mat-radio-button>
                    </label>
                  </mat-radio-group>
                  <button class="btn btn-primary btn-sm confirm-btn"
                          [disabled]="!selectedSuggestions[i]"
                          (click)="confirmSuggestion(item, i)">
                    <mat-icon>check</mat-icon>
                    Confirm Selection
                  </button>
                </div>

                <div class="no-suggestions" *ngIf="!item.suggestions || item.suggestions.length === 0">
                  <mat-icon>search_off</mat-icon>
                  <span>No suggestions available</span>
                </div>

                <button class="btn btn-outline btn-sm" (click)="openProductSearch(item, i)">
                  <mat-icon>search</mat-icon>
                  Search Manually
                </button>
              </div>
            </div>
          </div>

          <!-- Cart Summary Footer -->
          <div class="cart-summary-footer" *ngIf="cart.length > 0">
            <div class="summary-details">
              <div class="summary-row">
                <span class="summary-label">Items</span>
                <span class="summary-value">{{ cart.length }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">&#8377;{{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="summary-row" *ngIf="totalGst > 0">
                <span class="summary-label">Included GST</span>
                <span class="summary-value">&#8377;{{ formatMoney(totalGst) }}</span>
              </div>
              <div class="summary-row tax-slab-row" *ngFor="let slab of taxSlabs">
                <span class="summary-label">  SGST ({{ slab.sgstRate }}%)</span>
                <span class="summary-value">&#8377;{{ formatMoney(slab.sgstAmount) }}</span>
              </div>
              <div class="summary-row tax-slab-row" *ngFor="let slab of taxSlabs">
                <span class="summary-label">  CGST ({{ slab.cgstRate }}%)</span>
                <span class="summary-value">&#8377;{{ formatMoney(slab.cgstAmount) }}</span>
              </div>
              <div class="summary-row total-row">
                <span class="summary-label">Total</span>
                <span class="summary-value total-value">&#8377;{{ subtotal.toFixed(2) }}</span>
              </div>
              <p class="gst-note" *ngIf="totalGst > 0">Prices are inclusive of GST</p>
            </div>
            <div class="summary-actions">
              <button class="btn btn-danger btn-lg"
                      (click)="clearCart()"
                      [disabled]="generating">
                <mat-icon>delete_sweep</mat-icon>
                Clear
              </button>
              <button class="btn btn-primary btn-lg"
                      (click)="generateInvoiceAndQR()"
                      [disabled]="generating || unmatchedItems.length > 0">
                <mat-icon>qr_code_2</mat-icon>
                Generate QR
              </button>
              <button class="btn btn-success btn-lg"
                      (click)="generateCashInvoice()"
                      [disabled]="generating || unmatchedItems.length > 0">
                <mat-icon>payments</mat-icon>
                Cash Payment
              </button>
            </div>
            <p class="unmatched-warning" *ngIf="unmatchedItems.length > 0">
              <mat-icon>warning</mat-icon>
              Resolve all unmatched items before completing
            </p>
          </div>

          <!-- Cash Receipt Card -->
          <div class="card receipt-card" *ngIf="showCashReceipt">
            <div class="receipt-header">
              <mat-icon class="receipt-icon">receipt_long</mat-icon>
              <div>
                <span class="receipt-title">Invoice {{ createdInvoice?.invoiceNumber }}</span>
                <span class="receipt-subtitle">Cash Payment</span>
              </div>
            </div>
            <div class="receipt-body">
              <div class="receipt-amount">
                <span class="amount-label">Amount</span>
                <span class="amount-value">&#8377;{{ createdInvoice?.totalAmount }}</span>
              </div>
              <span class="status-pill success">Cash</span>
            </div>
            <div class="receipt-actions">
              <button class="btn btn-primary" (click)="printReceipt()">
                <mat-icon>print</mat-icon> Print Receipt
              </button>
              <button class="btn btn-outline" (click)="showCashReceipt = false">
                <mat-icon>close</mat-icon> Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Hidden textarea for speech recognition -->
      <textarea #orderTextarea [(ngModel)]="orderText" name="orderText"
                class="hidden-textarea"
                placeholder="Speak or type here..."></textarea>
    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════════════
       DESIGN TOKENS
       ═══════════════════════════════════════════════════════════════ */
    :host {
      --primary: #1E40AF;
      --primary-hover: #1D4ED8;
      --primary-light: #DBEAFE;
      --primary-gradient: linear-gradient(135deg, #1E40AF, #3B82F6);
      --text-primary: #1E293B;
      --text-secondary: #64748B;
      --border: #E5E7EB;
      --bg-page: #F8FAFC;
      --danger: #EF4444;
      --success: #16A34A;
      --warning: #F59E0B;
      --shadow-card: 0 10px 30px rgba(15, 23, 42, 0.08);
      --radius-card: 20px;
      --radius-btn: 12px;
      --transition: 250ms ease;
      display: block;
    }

    /* ═══════════════════════════════════════════════════════════════
       PAGE LAYOUT
       ═══════════════════════════════════════════════════════════════ */
    .voice-billing-page {
      background: var(--bg-page);
      min-height: 100vh;
      padding: 32px;
      font-family: 'Poppins', sans-serif;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(30, 64, 175, 0.3);
    }

    .header-icon-wrap mat-icon {
      color: #fff;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .header-subtitle {
      margin: 2px 0 0;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .header-right {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      background: #F1F5F9;
      color: var(--text-secondary);
    }

    .status-badge.active {
      background: #FEE2E2;
      color: var(--danger);
    }

    .status-badge.processing {
      background: var(--primary-light);
      color: var(--primary);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .status-badge.active .status-dot {
      animation: dotPulse 1.2s ease-in-out infinite;
    }

    @keyframes dotPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.4); }
    }

    .voice-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 28px;
      align-items: stretch;
    }

    /* ═══════════════════════════════════════════════════════════════
       CARDS
       ═══════════════════════════════════════════════════════════════ */
    .card {
      background: #fff;
      border-radius: var(--radius-card);
      padding: 24px;
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border);
      margin-bottom: 20px;
      transition: box-shadow var(--transition);
    }

    .card:hover {
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.12);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .card-header-icon {
      color: var(--primary);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .card-header-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* ═══════════════════════════════════════════════════════════════
       SEARCH INPUT
       ═══════════════════════════════════════════════════════════════ */
    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      color: var(--text-secondary);
      font-size: 20px;
      width: 20px;
      height: 20px;
      pointer-events: none;
    }

    .premium-input {
      width: 100%;
      height: 48px;
      padding: 0 16px 0 44px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-btn);
      font-size: 14px;
      font-family: 'Poppins', sans-serif;
      color: var(--text-primary);
      background: #F8FAFC;
      outline: none;
      transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
      box-sizing: border-box;
    }

    .premium-input::placeholder {
      color: #94A3B8;
    }

    .premium-input:focus {
      border-color: var(--primary);
      background: #fff;
      box-shadow: 0 0 0 4px rgba(30, 64, 175, 0.1);
    }

    :host ::ng-deep .premium-autocomplete .mat-mdc-option {
      padding: 12px 16px !important;
      font-family: 'Poppins', sans-serif !important;
    }

    :host ::ng-deep .option-name {
      font-weight: 500;
      font-size: 14px;
      display: block;
    }

    :host ::ng-deep .option-phone {
      font-size: 12px;
      color: var(--text-secondary);
      display: block;
    }

    /* ═══════════════════════════════════════════════════════════════
       MIC BUTTON
       ═══════════════════════════════════════════════════════════════ */
    .mic-card {
      padding: 32px 24px;
    }

    .mic-card.listening {
      border-color: #FCA5A5;
      background: linear-gradient(180deg, #FEF2F2 0%, #fff 100%);
    }

    .mic-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 0 12px;
    }

    .mic-button {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      background: var(--primary-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(30, 64, 175, 0.4);
      transition: transform var(--transition), box-shadow var(--transition);
      outline: none;
    }

    .mic-button:hover {
      transform: scale(1.06);
      box-shadow: 0 12px 40px rgba(30, 64, 175, 0.5);
    }

    .mic-button:active {
      transform: scale(0.96);
    }

    .mic-button.active {
      background: linear-gradient(135deg, #DC2626, #EF4444);
      box-shadow: 0 8px 32px rgba(220, 38, 38, 0.4);
    }

    .mic-button.active:hover {
      box-shadow: 0 12px 40px rgba(220, 38, 38, 0.5);
    }

    .mic-inline {
      display: none;
    }

    .mic-inner {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mic-inner mat-icon {
      color: #fff;
      font-size: 36px;
      width: 36px;
      height: 36px;
    }

    .mic-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(220, 38, 38, 0.2);
      animation: micPulse 1.5s ease-out infinite;
      z-index: 0;
    }

    .mic-pulse-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid rgba(220, 38, 38, 0.5);
      animation: micPulseRing 1.5s ease-out infinite;
      z-index: 0;
    }

    @keyframes micPulse {
      0% {
        width: 80px;
        height: 80px;
        opacity: 0.6;
      }
      100% {
        width: 140px;
        height: 140px;
        opacity: 0;
      }
    }

    @keyframes micPulseRing {
      0% {
        width: 80px;
        height: 80px;
        opacity: 0.8;
      }
      100% {
        width: 160px;
        height: 160px;
        opacity: 0;
      }
    }

    .mic-label {
      margin: 20px 0 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      text-align: center;
    }

    .mic-label.listening {
      color: var(--danger);
      animation: textPulse 1.2s ease-in-out infinite;
    }

    @keyframes textPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .mic-hint {
      margin: 8px 0 0;
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .hint-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Language Selector */
    .language-selector {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .lang-icon {
      color: var(--text-secondary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .lang-label {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .lang-chips {
      display: flex;
      gap: 6px;
    }

    .lang-chip {
      padding: 5px 14px;
      border-radius: 8px;
      border: 1.5px solid var(--border);
      background: #fff;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      transition: all var(--transition);
    }

    .lang-chip.active {
      background: var(--primary-light);
      color: var(--primary);
      border-color: var(--primary);
    }

    /* Processing Bar */
    .processing-bar {
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;
    }

    :host ::ng-deep .processing-bar .mdc-linear-progress__bar-inner {
      border-color: var(--primary);
    }

    /* ═══════════════════════════════════════════════════════════════
       VOICE LOG
       ═══════════════════════════════════════════════════════════════ */
    .voice-log-card {
      max-height: 260px;
      overflow: hidden;
    }

    .voice-log-list {
      max-height: 190px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .voice-log-list::-webkit-scrollbar {
      width: 4px;
    }

    .voice-log-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .voice-log-list::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 4px;
    }

    .log-entry {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 12px;
      animation: slideIn 0.3s ease-out both;
    }

    .log-entry.matched {
      background: #EFF6FF;
    }

    .log-entry.unmatched {
      background: #FEF2F2;
    }

    .log-indicator {
      width: 4px;
      height: 28px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .log-entry.matched .log-indicator {
      background: var(--primary);
    }

    .log-entry.unmatched .log-indicator {
      background: var(--danger);
    }

    .log-content {
      flex: 1;
      min-width: 0;
    }

    .log-text {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .log-entry.matched .log-text {
      color: var(--primary);
    }

    .log-entry.unmatched .log-text {
      color: var(--danger);
    }

    .log-detail {
      display: block;
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 1px;
    }

    .log-status-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .log-entry.matched .log-status-icon {
      color: var(--success);
    }

    .log-entry.unmatched .log-status-icon {
      color: var(--danger);
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-12px); }
      to { opacity: 1; transform: translateX(0); }
    }

    /* ═══════════════════════════════════════════════════════════════
       EMPTY STATE
       ═══════════════════════════════════════════════════════════════ */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 40px;
      background: #fff;
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border);
      text-align: center;
    }

    .empty-icon-wrap {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: var(--primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .empty-icon-wrap mat-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
      color: var(--primary);
    }

    .empty-state h3 {
      margin: 0 0 6px;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
    }

    /* ═══════════════════════════════════════════════════════════════
       SECTION LABELS
       ═══════════════════════════════════════════════════════════════ */
    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary);
    }

    .section-label mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .section-label.warning {
      color: var(--warning);
      margin-top: 28px;
    }

    .mobile-cart-total {
      display: none;
    }

    /* ═══════════════════════════════════════════════════════════════
       PRODUCT CARDS
       ═══════════════════════════════════════════════════════════════ */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 8px;
    }

    .product-card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      transition: all var(--transition);
      animation: cardAppear 0.35s ease-out both;
    }

    .product-card:hover {
      border-color: var(--primary);
      box-shadow: 0 4px 16px rgba(30, 64, 175, 0.1);
      transform: translateY(-2px);
    }

    @keyframes cardAppear {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .product-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .product-info {
      flex: 1;
      min-width: 0;
    }

    .product-name {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-tamil {
      display: block;
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      transition: all var(--transition);
      flex-shrink: 0;
    }

    .icon-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .icon-btn.danger {
      color: var(--text-secondary);
    }

    .icon-btn.danger:hover {
      background: #FEE2E2;
      color: var(--danger);
    }

    .product-card-bottom {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .product-price {
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
    }

    .qty-control {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      margin-left: auto;
    }

    .qty-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #F8FAFC;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--transition);
    }

    .qty-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--text-secondary);
    }

    .qty-btn:hover {
      background: var(--primary-light);
    }

    .qty-btn:hover mat-icon {
      color: var(--primary);
    }

    .qty-value {
      min-width: 36px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      border-left: 1.5px solid var(--border);
      border-right: 1.5px solid var(--border);
      height: 32px;
      line-height: 32px;
    }

    .product-total {
      font-size: 14px;
      font-weight: 600;
      color: var(--success);
      white-space: nowrap;
    }

    /* ═══════════════════════════════════════════════════════════════
       UNMATCHED ITEMS
       ═══════════════════════════════════════════════════════════════ */
    .unmatched-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .unmatched-card {
      background: #FFFBEB;
      border: 1.5px solid #FDE68A;
      border-radius: 16px;
      padding: 18px;
      animation: cardAppear 0.35s ease-out both;
    }

    .unmatched-header {
      margin-bottom: 12px;
    }

    .unmatched-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .unmatched-spoken {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      text-transform: capitalize;
    }

    .unmatched-qty {
      font-size: 13px;
      color: var(--text-secondary);
      background: #FEF3C7;
      padding: 3px 10px;
      border-radius: 6px;
    }

    .suggestions-group {
      margin-bottom: 12px;
    }

    .suggestions-radio {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .suggestion-item {
      display: flex;
      align-items: center;
    }

    :host ::ng-deep .suggestion-item mat-radio-button {
      width: 100%;
    }

    :host ::ng-deep .suggestion-item .mat-mdc-radio-button .mdc-form-field {
      width: 100%;
      justify-content: space-between;
    }

    .suggestion-name {
      font-weight: 500;
      font-size: 14px;
      color: var(--text-primary);
    }

    .suggestion-price {
      color: var(--success);
      font-weight: 600;
      margin-left: 8px;
      font-size: 14px;
    }

    .no-suggestions {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 10px;
    }

    .no-suggestions mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .confirm-btn {
      width: 100%;
    }

    /* ═══════════════════════════════════════════════════════════════
       CART SUMMARY FOOTER
       ═══════════════════════════════════════════════════════════════ */
    .cart-summary-footer {
      background: #fff;
      border-radius: var(--radius-card);
      padding: 24px;
      box-shadow: var(--shadow-card);
      border: 1px solid var(--border);
      margin-top: 20px;
    }

    .summary-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-label {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .summary-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .tax-slab-row .summary-label {
      padding-left: 14px;
      font-size: 13px;
    }

    .total-row {
      padding-top: 10px;
      border-top: 1px solid var(--border);
    }

    .total-row .summary-label {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .total-value {
      font-size: 22px !important;
      font-weight: 700 !important;
      color: var(--primary) !important;
    }

    .gst-note {
      font-size: 11px;
      color: var(--text-secondary);
      margin: 6px 0 0;
      text-align: right;
    }

    .summary-actions {
      display: flex;
      gap: 12px;
    }

    .unmatched-warning {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 14px 0 0;
      font-size: 12px;
      color: var(--warning);
      text-align: center;
      justify-content: center;
    }

    .unmatched-warning mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* ═══════════════════════════════════════════════════════════════
       RECEIPT CARD
       ═══════════════════════════════════════════════════════════════ */
    .receipt-card {
      border: 2px solid var(--success);
      animation: cardAppear 0.3s ease-out;
    }

    .receipt-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .receipt-icon {
      color: var(--success);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .receipt-title {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .receipt-subtitle {
      display: block;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .receipt-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 14px;
      background: #F0FDF4;
      border-radius: 12px;
    }

    .amount-label {
      display: block;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .amount-value {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: var(--success);
    }

    .status-pill {
      padding: 5px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-pill.success {
      background: #DCFCE7;
      color: var(--success);
    }

    .receipt-actions {
      display: flex;
      gap: 10px;
    }

    /* ═══════════════════════════════════════════════════════════════
       BUTTONS
       ═══════════════════════════════════════════════════════════════ */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 48px;
      padding: 0 24px;
      border-radius: var(--radius-btn);
      border: none;
      font-size: 14px;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
      cursor: pointer;
      transition: all var(--transition);
      outline: none;
      white-space: nowrap;
    }

    .btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary-gradient);
      color: #fff;
      box-shadow: 0 4px 16px rgba(30, 64, 175, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
      box-shadow: 0 6px 24px rgba(30, 64, 175, 0.4);
      transform: translateY(-1px);
    }

    .btn-success {
      background: linear-gradient(135deg, #16A34A, #22C55E);
      color: #fff;
      box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3);
    }

    .btn-success:hover:not(:disabled) {
      box-shadow: 0 6px 24px rgba(22, 163, 74, 0.4);
      transform: translateY(-1px);
    }

    .btn-danger {
      background: linear-gradient(135deg, #EF4444, #F87171);
      color: #fff;
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
    }

    .btn-danger:hover:not(:disabled) {
      box-shadow: 0 6px 24px rgba(239, 68, 68, 0.4);
      transform: translateY(-1px);
    }

    .btn-outline {
      background: #fff;
      color: var(--text-secondary);
      border: 1.5px solid var(--border);
    }

    .btn-outline:hover:not(:disabled) {
      border-color: var(--primary);
      color: var(--primary);
      background: var(--primary-light);
    }

    .btn-sm {
      height: 38px;
      padding: 0 16px;
      font-size: 13px;
      border-radius: 10px;
    }

    .btn-lg {
      height: 48px;
      padding: 0 28px;
      font-size: 15px;
      flex: 1;
    }

    /* ═══════════════════════════════════════════════════════════════
       HIDDEN TEXTAREA
       ═══════════════════════════════════════════════════════════════ */
    .hidden-textarea {
      position: absolute;
      left: -9999px;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }

    /* ═══════════════════════════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════════════════════════ */
    @media (min-width: 1024px) and (max-width: 1279.98px) {
      .voice-layout {
        grid-template-columns: 320px 1fr;
      }
    }

    @media (max-width: 1023.98px) {
      .voice-layout {
        grid-template-columns: 1fr;
      }

      .voice-billing-page {
        padding: 20px;
      }
    }

    @media (max-width: 767.98px) {
      .voice-billing-page {
        padding: 16px;
      }

      .page-header {
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }

      .header-left {
        width: 100%;
      }

      .header-title-block {
        flex: 1;
        min-width: 0;
      }

      .page-header h1 {
        font-size: 22px;
      }

      .header-subtitle {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 13px;
      }

      .header-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 14px;
      }

      .header-icon-wrap mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .mic-inline {
        display: flex;
        width: 44px;
        height: 44px;
      }

      .mic-inline mat-icon {
        color: #fff;
        font-size: 22px;
      }

      .mic-card {
        display: none;
      }

      .header-right {
        width: 100%;
      }

      .card {
        padding: 20px;
      }

      .product-card-bottom {
        flex-wrap: wrap;
      }

      .qty-control {
        margin-left: 0;
      }

      .mobile-cart-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: var(--primary-gradient);
        color: #fff;
        border-radius: 14px;
        padding: 14px 18px;
        margin-bottom: 16px;
        box-shadow: 0 6px 18px rgba(30, 64, 175, 0.25);
      }

      .mobile-cart-total .mct-label {
        font-size: 14px;
        font-weight: 600;
        opacity: 0.92;
      }

      .mobile-cart-total .mct-value {
        font-size: 20px;
        font-weight: 700;
      }

      .summary-actions {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
      }

      .btn-lg {
        width: auto;
        flex: 1 1 160px;
        max-width: 230px;
        padding: 0 18px;
      }

      .btn {
        height: 48px;
      }

      .unmatched-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }

    @media (max-width: 479.98px) {
      .products-grid {
        grid-template-columns: 1fr;
      }

      .status-badge {
        padding: 5px 10px;
        font-size: 12px;
      }

      .header-right {
        width: 100%;
      }

      .status-badge {
        flex: 1;
        justify-content: center;
      }

      .product-card {
        padding: 16px;
      }

      .empty-state {
        padding: 56px 24px;
      }

      .empty-icon-wrap {
        width: 80px;
        height: 80px;
      }
    }
  `]
})
export class VoiceBillingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cartScrollContainer') cartScrollContainer!: ElementRef;
  @ViewChild('orderTextarea') orderTextarea!: ElementRef<HTMLTextAreaElement>;

  company: Company | null = null;
  isHotel = false;

  orderText = '';

  lastSpeechTranscript = '';

  isListening = false;
  isProcessing = false;
  private keepListening = false;
  recognition: any = null;
  cart: VoiceItem[] = [];
  unmatchedItems: UnmatchedItem[] = [];
  selectedSuggestions: Record<number, number> = {};
  subtotal = 0;
  taxSlabs: TaxSlab[] = [];
  totalAmount = 0;
  generating = false;
  formatMoney = formatMoney;

  get totalGst(): number {
    return this.taxSlabs.reduce((sum, slab) => sum + slab.gstAmount, 0);
  }

  qrCodeDataUrl = '';
  createdInvoice: Invoice | null = null;
  showCashReceipt = false;

  constructor(
    private voiceService: VoiceService,
    private invoiceService: InvoiceService,
    private companyService: CompanyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.companyService.getCompany().subscribe({
      next: (data) => {
        this.company = data;
        this.isHotel = data.shopType !== 'Super Market';
      },
      error: () => {}
    });
    this.initSpeechRecognition();
  }

  ngAfterViewInit(): void {}

  private readonly reservedCommands = [
    'print bill', 'generate qr', 'cash payment',
    'cancel last item', 'remove last item', 'clear cart', 'new bill'
  ];

  initSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'ta-IN';

      this.recognition.onresult = (event: any) => {
        // Get the latest result (continuous mode sends multiple results)
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.trim().toLowerCase();

        if (!transcript) return;

        this.orderText = transcript;
        if (this.orderTextarea?.nativeElement) {
          this.orderTextarea.nativeElement.value = transcript;
        }

        console.log('[Voice] Speech recognized:', transcript);

        // Check reserved voice commands
        if (this.handleReservedCommand(transcript)) {
          this.orderText = '';
          if (this.orderTextarea?.nativeElement) {
            this.orderTextarea.nativeElement.value = '';
          }
          return;
        }

        // Skip if already processing
        if (this.isProcessing) return;

        // Process as product order
        this.processText();
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          this.snackBar.open('Voice error: ' + event.error, 'Close', { duration: 3000 });
        }
      };

      this.recognition.onend = () => {
        // In continuous mode, auto-restart if still supposed to be listening
        if (this.keepListening) {
          setTimeout(() => {
            if (this.keepListening) {
              try {
                this.recognition.start();
              } catch (e) {
                console.warn('[Voice] restart failed, retrying shortly', e);
                setTimeout(() => { if (this.keepListening) this.recognition.start(); }, 300);
              }
            }
          }, 50);
        } else {
          this.isListening = false;
        }
      };
    }
  }

  handleReservedCommand(text: string): boolean {
    const lower = text.toLowerCase().trim();

    if (lower.includes('print bill')) {
      this.printReceipt();
      return true;
    }

    if (lower.includes('generate qr') || lower.includes('qr')) {
      this.generateInvoiceAndQR();
      return true;
    }

    if (lower.includes('cash payment')) {
      this.generateCashInvoice();
      return true;
    }

    if (lower.includes('cancel last item') || lower.includes('remove last item')) {
      if (this.cart.length > 0) {
        this.removeFromCart(this.cart.length - 1);
        this.snackBar.open('Last item removed', 'Close', { duration: 2000 });
      }
      return true;
    }

    if (lower.includes('clear cart')) {
      this.clearCart();
      this.snackBar.open('Cart cleared', 'Close', { duration: 2000 });
      return true;
    }

    if (lower.includes('new bill')) {
      this.clearCart();
      this.unmatchedItems = [];
      this.selectedSuggestions = {};
      this.stopListening();
      this.snackBar.open('New bill started', 'Close', { duration: 2000 });
      return true;
    }

    return false;
  }

  toggleVoice(): void {
    if (!this.recognition) {
      this.snackBar.open('Speech recognition not available', 'Close', { duration: 3000 });
      return;
    }
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening(): void {
    if (this.isListening) return;
    this.keepListening = true;
    this.isListening = true;
    this.recognition.lang = 'ta-IN';
    try {
      this.recognition.start();
    } catch (e) {
      // Already started or not available
    }
    this.orderText = ' ';
    if (this.orderTextarea?.nativeElement) {
      this.orderTextarea.nativeElement.value = ' ';
    }
  }

  private stopListening(): void {
    this.keepListening = false;
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.isListening = false;
    this.orderText = '';
  }

  ngOnDestroy(): void {
    this.keepListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
  }

  processText(): void {
    const textareaEl = this.orderTextarea?.nativeElement;
    const text = (textareaEl ? textareaEl.value : this.orderText || '').trim();
    if (!text) return;

    console.log('[Voice] processText:', text);

    this.isProcessing = true;
    this.selectedSuggestions = {};

    this.voiceService.processVoiceCommand({ text }).subscribe({
      next: (response: VoiceResponse) => {
        this.isProcessing = false;

        for (const item of response.matchedItems) {
          if (item.productId && item.productName && item.price > 0) {
            const existing = this.cart.find(c => Number(c.productId) === Number(item.productId));
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              this.cart.push({ ...item });
            }
          }
        }

        this.cart = [...this.cart];

        this.unmatchedItems = response.unmatchedItems || [];

        this.calculateTotals();

        this.orderText = '';
        if (this.orderTextarea?.nativeElement) {
          this.orderTextarea.nativeElement.value = '';
        }
        this.lastSpeechTranscript = '';

        const matchedCount = response.matchedItems.length;
        const unmatchedCount = response.unmatchedItems.length;

        if (matchedCount > 0 && unmatchedCount > 0) {
          this.snackBar.open(
            `${matchedCount} added, ${unmatchedCount} need manual selection`,
            'OK', { duration: 3500 }
          );
        } else if (matchedCount > 0) {
          this.snackBar.open(
            `${matchedCount} product(s) added to cart`,
            'Close', { duration: 2500 }
          );
        } else if (unmatchedCount > 0) {
          this.snackBar.open(
            `${unmatchedCount} product(s) could not be recognized. Please select manually.`,
            'OK', { duration: 4000 }
          );
        } else {
          this.snackBar.open('No valid products were recognized.', 'Close', { duration: 3000 });
        }

        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        this.isProcessing = false;
        this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 3000 });
      }
    });
  }

  confirmSuggestion(item: UnmatchedItem, index: number): void {
    const productId = this.selectedSuggestions[index];
    if (!productId) return;

    const suggestion = item.suggestions?.find(s => s.productId === productId);
    if (!suggestion) return;

    const existing = this.cart.find(c => c.productId === suggestion.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.cart.push({
        productId: suggestion.productId,
        productName: suggestion.productName,
        tamilName: suggestion.tamilName,
        quantity: item.quantity,
        unit: item.unit,
        price: suggestion.price,
        gstPercentage: suggestion.gstPercentage || 0
      });
    }

    this.unmatchedItems.splice(index, 1);
    delete this.selectedSuggestions[index];

    this.calculateTotals();

    this.voiceService.saveVoiceAlias({
      spokenText: item.spokenText.toLowerCase(),
      productId: suggestion.productId
    }).subscribe();

    this.snackBar.open(
      `${suggestion.productName} added. Alias saved for next time.`,
      'Close', { duration: 3000 }
    );

    setTimeout(() => this.scrollToBottom(), 100);
  }

  openProductSearch(item: UnmatchedItem, index: number): void {
    const dialogRef = this.dialog.open(ProductSearchDialogComponent, {
      width: '480px',
      data: {
        spokenText: item.spokenText,
        quantity: item.quantity,
        unit: item.unit
      }
    });

    dialogRef.afterClosed().subscribe((result: ProductSearchResult | null) => {
      if (!result) return;

      const product = result.product;

      const existing = this.cart.find(c => c.productId === product.productId);
      if (existing) {
        existing.quantity += result.quantity;
      } else {
        this.cart.push({
          productId: product.productId,
          productName: product.productName,
          tamilName: product.tamilName,
          quantity: result.quantity,
          unit: result.unit,
          price: product.price,
          gstPercentage: product.gstPercentage
        });
      }

      this.unmatchedItems.splice(index, 1);
      delete this.selectedSuggestions[index];

      this.calculateTotals();

      this.voiceService.saveVoiceAlias({
        spokenText: result.spokenText.toLowerCase(),
        productId: product.productId
      }).subscribe();

      this.snackBar.open(
        `${product.productName} added to cart. Alias saved for next time.`,
        'Close', { duration: 3000 }
      );

      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
    this.calculateTotals();
  }

  clearCart(): void {
    this.cart = [];
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.taxSlabs = aggregateTaxSlabs(this.cart.map(item => ({
      total: item.price * item.quantity,
      gstPercentage: item.gstPercentage
    })));
    // Total is same as subtotal since GST is included in prices
    this.totalAmount = this.subtotal;
  }

  scrollToBottom(): void {
    if (this.cartScrollContainer?.nativeElement) {
      const el = this.cartScrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  generateInvoiceAndQR(): void {
    if (this.cart.length === 0) {
      this.snackBar.open('Cart is empty', 'Close', { duration: 3000 });
      return;
    }
    if (this.generating) return;

    this.stopListening();
    this.generating = true;

    const request = {
      items: this.cart.filter(c => c.productId).map(c => ({
        productId: c.productId!,
        quantity: c.quantity
      })),
      discount: 0,
      paymentMethod: 'upi'
    };

    this.invoiceService.createInvoice(request).subscribe({
      next: (invoice) => {
        this.createdInvoice = invoice;
        this.generateQRCode(invoice);
      },
      error: (err) => {
        this.generating = false;
        this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 5000 });
      }
    });
  }

  generateQRCode(invoice: Invoice): void {
    const upiId = this.company?.upiId || 'shop@upi';
    const shopName = this.company?.companyName || 'Smart Billing Shop';
    const paymentData = [
      'upi://pay',
      '?pa=' + encodeURIComponent(upiId),
      '&pn=' + encodeURIComponent(shopName),
      '&tn=Invoice ' + invoice.invoiceNumber,
      '&am=' + invoice.totalAmount,
      '&cu=INR'
    ].join('');

    QRCode.toDataURL(paymentData, {
      width: 256,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    }).then((url) => {
      this.generating = false;
      this.dialog.open(QrDialogComponent, {
        width: '420px',
        data: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          qrCodeDataUrl: url,
          paymentMethod: 'QR',
          onPaymentReceived: () => this.receiveQrPayment(),
          onChangeToCash: () => this.switchToCash(),
          isHotel: this.isHotel
        }
      });
      this.snackBar.open('Invoice created! Show QR to customer.', 'Close', { duration: 4000 });
    }).catch(() => {
      this.generating = false;
    });
  }

  private receiveQrPayment(): void {
    const inv = this.createdInvoice;
    if (!inv) return;
    this.dialog.open(PaymentSuccessDialogComponent, {
      width: '360px',
      disableClose: true,
      data: { invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount }
    });
    this.printReceiptFor(inv, 'UPI/QR');
    this.finishBillingSession();
  }

  private switchToCash(): void {
    const inv = this.createdInvoice;
    if (!inv) return;
    this.dialog.open(PaymentSuccessDialogComponent, {
      width: '360px',
      disableClose: true,
      data: { invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount }
    });
    this.printReceiptFor(inv, 'CASH');
    this.finishBillingSession();
  }

  private finishBillingSession(): void {
    this.createdInvoice = null;
    this.cart = [];
    this.unmatchedItems = [];
    this.selectedSuggestions = {};
    this.calculateTotals();
  }

  private printReceiptFor(inv: Invoice, paymentMethod: string): void {
    ReceiptPrintComponent.print(inv, this.company, paymentMethod);
  }

  printQR(): void {
    this.printReceipt();
  }

  generateCashInvoice(): void {
    if (this.cart.length === 0) {
      this.snackBar.open('Cart is empty', 'Close', { duration: 3000 });
      return;
    }

    this.stopListening();

    this.generating = true;

    const request = {
      items: this.cart.filter(c => c.productId).map(c => ({
        productId: c.productId!,
        quantity: c.quantity
      })),
      discount: 0,
      paymentMethod: 'cash'
    };

    this.invoiceService.createInvoice(request).subscribe({
      next: (invoice) => {
        this.createdInvoice = invoice;
        this.showCashReceipt = true;
        this.generating = false;
        this.cart = [];
        this.unmatchedItems = [];
        this.selectedSuggestions = {};
        this.calculateTotals();
        this.snackBar.open('Invoice created! Cash payment.', 'Close', { duration: 4000 });
      },
      error: (err) => {
        this.generating = false;
        this.snackBar.open('Error: ' + (err.error?.message || 'Failed'), 'Close', { duration: 5000 });
      }
    });
  }

  printReceipt(): void {
    const inv = this.createdInvoice;
    if (!inv) return;

    this.dialog.open(PaymentSuccessDialogComponent, {
      width: '360px',
      disableClose: true,
      data: { invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount }
    });
    this.createdInvoice!.paymentStatus = 'completed';
    this.showCashReceipt = false;

    this.printReceiptFor(inv, 'CASH');
  }
}
