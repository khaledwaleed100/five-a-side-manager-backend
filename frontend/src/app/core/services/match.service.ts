import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player } from './player.service';

import { environment } from '../../../environments/environment';

export interface Match {
  _id?: string;
  place: string;
  date: string;
  time: string;
  roster: Player[];
  teamA: Player[];
  teamB: Player[];
  finalScore?: {
    teamA: number;
    teamB: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/matches`;

  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>(this.apiUrl);
  }

  getMatch(id: string): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/${id}`);
  }

  createMatch(match: Partial<Match>): Observable<Match> {
    return this.http.post<Match>(this.apiUrl, match);
  }

  updateMatch(id: string, match: Partial<Match>): Observable<Match> {
    return this.http.put<Match>(`${this.apiUrl}/${id}`, match);
  }

  deleteMatch(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  generateTeams(id: string): Observable<Match> {
    return this.http.post<Match>(`${this.apiUrl}/${id}/generate`, {});
  }
}
