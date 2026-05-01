import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface OfflinePlayer {
  id?: number;
  userId: string;
  name: string;
  position: string;
  attributes: {
    speed: number;
    shooting: number;
    passing: number;
    defending: number;
    physical: number;
  };
  overallRating: number;
  syncStatus: 'synced' | 'pending';
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService extends Dexie {
  players!: Table<OfflinePlayer, number>;

  constructor() {
    super('FiveASideDB');
    this.version(1).stores({
      players: '++id, userId, syncStatus'
    });
  }

  async savePlayer(player: OfflinePlayer) {
    return await this.players.add(player);
  }

  async getPendingPlayers() {
    return await this.players.where('syncStatus').equals('pending').toArray();
  }

  async markAsSynced(id: number) {
    return await this.players.update(id, { syncStatus: 'synced' });
  }

  async clearSyncedPlayers() {
    return await this.players.where('syncStatus').equals('synced').delete();
  }
}
