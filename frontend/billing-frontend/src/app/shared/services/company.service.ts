import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Company } from '../models/company.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = `${environment.apiUrl}/api/company`;
  private companySubject = new BehaviorSubject<Company | null>(null);
  company$ = this.companySubject.asObservable();

  constructor(private http: HttpClient) {}

  getCompany(): Observable<Company> {
    return this.http.get<Company>(this.apiUrl).pipe(
      tap(company => this.companySubject.next(company))
    );
  }

  getCachedCompany(): Company | null {
    return this.companySubject.value;
  }

  saveCompany(request: Partial<Company>): Observable<Company> {
    return this.http.post<Company>(this.apiUrl, request).pipe(
      tap(company => this.companySubject.next(company))
    );
  }

  setupCompany(request: any): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/setup`, request);
  }

  clearCompany(): void {
    this.companySubject.next(null);
  }

  updateCompany(id: number, request: Partial<Company>): Observable<Company> {
    return this.http.put<Company>(`${this.apiUrl}/${id}`, request).pipe(
      tap(company => this.companySubject.next(company))
    );
  }

  uploadLogo(file: File): Observable<Company> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Company>(`${this.apiUrl}/logo`, formData).pipe(
      tap(company => this.companySubject.next(company))
    );
  }

  removeLogo(): Observable<Company> {
    return this.http.delete<Company>(`${this.apiUrl}/logo`).pipe(
      tap(company => this.companySubject.next(company))
    );
  }
}
