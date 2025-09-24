import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InsightsData {
  suspiciousTiming: {
    lateNightCount: number;
    weekendMultiplier: number;
  };
  patterns: {
    predictabilityScore: number;
    roundNumberBias: number;
  };
  mysteries: {
    sundaySpender: boolean;
    groceryGap: number;
    upiPercentage: number;
  };
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    action: string;
  }>;
  lastUpdated?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InsightsService {
  private apiUrl = `${environment.apiUrl}/insights`;

  constructor(private http: HttpClient) {}

  getInsightsData(userId: string): Observable<{status: string, data: InsightsData}> {
    return this.http.get<{status: string, data: InsightsData}>(`${this.apiUrl}/data/${userId}`);
  }
}