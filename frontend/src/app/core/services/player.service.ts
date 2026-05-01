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
  attributes: {
    speed: number;
    shooting: number;
    passing: number;
    defending: number;
    physical: number;
  };
  overallRating?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private http = inject(HttpClient);
  private offlineSync = inject(OfflineSyncService);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/players`;

  players = signal<Player[]>([]);

  getPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.apiUrl).pipe(
      tap(data => this.players.set(data)),
      catchError(() => {
        // Fallback to offline data if needed or just return empty for now
        return of([]);
      })
    );
  }

  createPlayer(player: Player): Observable<Player> {
    // Try to save online first
    return this.http.post<Player>(this.apiUrl, player).pipe(
      tap(newPlayer => {
        this.players.update(players => [...players, newPlayer]);
      }),
      catchError(err => {
        // Fallback to offline saving
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
            // Add optimistic UI update
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

  async syncOfflinePlayers() {
    const pending = await this.offlineSync.getPendingPlayers();
    if (pending.length === 0) return;

    for (const player of pending) {
      try {
        const { id, userId, syncStatus, overallRating, ...playerData } = player;
        const res = await this.http.post<Player>(this.apiUrl, playerData).toPromise();
        if (id) {
          await this.offlineSync.markAsSynced(id);
        }
      } catch (error) {
        console.error('Failed to sync player', player.name);
      }
    }
    await this.offlineSync.clearSyncedPlayers();
    this.getPlayers().subscribe(); // Refresh list
  }

  private calculateRating(attrs: any): number {
    return Math.floor((attrs.speed + attrs.shooting + attrs.passing + attrs.defending + attrs.physical) / 5);
  }
}
