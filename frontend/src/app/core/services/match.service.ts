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
  status?: 'upcoming' | 'completed';
  playerStats?: {
    playerId: string | Player;
    goals: number;
    assists: number;
    isMvp: boolean;
  }[];
  aiMvpSuggestion?: string | null;
}

export interface CreateMatchResponse {
  match: Match;
  conflictWarning: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/matches`;

  getMatches(): Observable<Match[]> {
    return this.http.get<Match[]>(this.apiUrl);
  }

  getMatch(id: string): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/${id}`);
  }

  createMatch(match: Partial<Match>): Observable<CreateMatchResponse> {
    return this.http.post<CreateMatchResponse>(this.apiUrl, match);
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

  completeMatch(id: string, data: { finalScore: { teamA: number, teamB: number }, playerStats: any[] }): Observable<Match> {
    return this.http.post<Match>(`${this.apiUrl}/${id}/complete`, data);
  }
}
