import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardData } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/api/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.apiUrl);
  }

  getProductDetails(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products`);
  }

  getTodaySales(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/today-sales`);
  }

  getMonthlySales(from?: string, to?: string): Observable<any> {
    let url = `${this.apiUrl}/monthly-sales`;
    if (from && to) {
      url += `?from=${from}&to=${to}`;
    }
    return this.http.get<any>(url);
  }
}
