import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment, PaymentRequest } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  createPayment(request: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments/create`, request);
  }

  initiatePaytmPayment(invoiceId: number): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/gateway/paytm/initiate`, null, {
      params: { invoiceId: invoiceId.toString() }
    });
  }

  getPaymentByInvoiceId(invoiceId: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/payments/invoice/${invoiceId}`);
  }
}
