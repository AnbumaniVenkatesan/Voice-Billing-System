import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VoiceRequest, VoiceResponse, VoiceAliasRequest } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private apiUrl = `${environment.apiUrl}/api/voice`;

  constructor(private http: HttpClient) {}

  processVoiceCommand(request: VoiceRequest): Observable<VoiceResponse> {
    return this.http.post<VoiceResponse>(`${this.apiUrl}/process`, request);
  }

  saveVoiceAlias(request: VoiceAliasRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/alias`, request);
  }
}
