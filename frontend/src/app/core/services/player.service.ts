import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, catchError, tap } from 'rxjs';
import { OfflineSyncService, OfflinePlayer } from './offline-sync.service';
import { AuthService } from './auth.service';

import { environment } from '../../../environments/environment';

export interface Player {
  _id?: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  avatarUrl?: string | null;
  attributes: {
    speed: number;
    shooting: number;
    passing: number;
    defending: number;
    physical: number;
    stamina: number;
    goalkeeping: number;
    positioning: number;
    longPass: number;
    shortPass: number;
  };
  overallRating?: number;
  performanceTrend?: 'hot' | 'stable' | 'cold';
  aiReport?: string | null;
  aiReportGeneratedAt?: string | null;
  stats?: {
    matchesPlayed: number;
    goals: number;
    assists: number;
    mvpAwards: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private http = inject(HttpClient);
  private offlineSync = inject(OfflineSyncService);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/players`;

  players = signal<Player[]>([]);

  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.apiUrl).pipe(
      tap(data => this.players.set(data)),
      catchError(() => of([]))
    );
  }

  createPlayer(player: Player): Observable<Player> {
    return this.http.post<Player>(this.apiUrl, player).pipe(
      tap(newPlayer => {
        this.players.update(players => [...players, newPlayer]);
      }),
      catchError(err => {
        if (err.status === 0 || err.status === 504) {
          const user = this.authService.currentUser();
          if (user) {
            const offlinePlayer: OfflinePlayer = {
              userId: user._id,
              ...player,
              overallRating: this.calculateRating(player.attributes),
              syncStatus: 'pending'
            };
            this.offlineSync.savePlayer(offlinePlayer);
            this.players.update(players => [...players, { ...player, _id: 'temp-' + Date.now() }]);
          }
        }
        throw err;
      })
    );
  }

  updatePlayer(id: string, player: Partial<Player>): Observable<Player> {
    return this.http.put<Player>(`${this.apiUrl}/${id}`, player).pipe(
      tap(updatedPlayer => {
        this.players.update(players => players.map(p => p._id === id ? updatedPlayer : p));
      })
    );
  }

  deletePlayer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.players.update(players => players.filter(p => p._id !== id));
      })
    );
  }

  uploadAvatar(id: string, file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<{ avatarUrl: string }>(`${this.apiUrl}/${id}/avatar`, formData).pipe(
      tap(res => {
        this.players.update(players =>
          players.map(p => p._id === id ? { ...p, avatarUrl: res.avatarUrl } : p)
        );
      })
    );
  }

  getAiReport(id: string): Observable<{ report: string; cached: boolean }> {
    return this.http.get<{ report: string; cached: boolean }>(`${this.apiUrl}/${id}/ai-report`);
  }

  async syncOfflinePlayers() {
    const pending = await this.offlineSync.getPendingPlayers();
    if (pending.length === 0) return;

    for (const player of pending) {
      try {
        const { id, userId, syncStatus, overallRating, ...playerData } = player;
        await this.http.post<Player>(this.apiUrl, playerData).toPromise();
        if (id) {
          await this.offlineSync.markAsSynced(id);
        }
      } catch (error) {
        console.error('Failed to sync player', player.name);
      }
    }
    await this.offlineSync.clearSyncedPlayers();
    this.getPlayers().subscribe();
  }

  private calculateRating(attrs: any): number {
    return Math.floor(
      (attrs.speed + attrs.shooting + attrs.passing + attrs.defending +
        attrs.physical + attrs.stamina + attrs.goalkeeping +
        attrs.positioning + attrs.longPass + attrs.shortPass) / 10
    );
  }
}
