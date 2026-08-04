import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company } from '../models/company.model';
import { environment } from '../../../environments/environment';

export interface CompanyStats {
  companyId: number;
  products: number;
  invoices: number;
  users: number;
}

export interface AdminUser {
  userId: number;
  username: string;
  role: string;
  companyId: number | null;
  isActive: boolean;
  createdAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.apiUrl}/companies`);
  }

  getCompany(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/companies/${id}`);
  }

  createCompany(request: any): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/companies`, request);
  }

  updateCompany(id: number, request: any): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/companies/${id}`, request);
  }

  activateCompany(id: number): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/companies/${id}/activate`, {});
  }

  deactivateCompany(id: number): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/companies/${id}/deactivate`, {});
  }

  deleteCompany(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/companies/${id}`);
  }

  resetCompanyPassword(id: number, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/companies/${id}/reset-password`, { newPassword });
  }

  getCompanyStats(id: number): Observable<CompanyStats> {
    return this.http.get<CompanyStats>(`${this.apiUrl}/companies/${id}/stats`);
  }

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }

  createUser(username: string, password: string, role: string, companyId: number | null): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.apiUrl}/users`, { username, password, role, companyId });
  }

  resetUserPassword(id: number, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/users/${id}/reset-password`, { newPassword });
  }

  deactivateUser(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/users/${id}/deactivate`, {});
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }
}
