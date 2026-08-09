import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LeaderboardPlayer {
  _id: string;
  name: string;
  position: string;
  overallRating: number;
  avatarUrl?: string | null;
  performanceTrend: 'hot' | 'stable' | 'cold';
  goals: number;
  assists: number;
  mvpAwards: number;
  matchesPlayed: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardPlayer[];
  totalMatches: number;
}

export interface StatsSummary {
  totalMatches: number;
  completedMatches: number;
  upcomingMatches: number;
  totalPlayers: number;
  topScorer: { name: string; goals: number; avatarUrl?: string | null } | null;
  hotPlayers: { name: string; _id: string; avatarUrl?: string | null }[];
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/stats`;

  getLeaderboard(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${this.apiUrl}/leaderboard`);
  }

  getSummary(): Observable<StatsSummary> {
    return this.http.get<StatsSummary>(`${this.apiUrl}/summary`);
  }
}
