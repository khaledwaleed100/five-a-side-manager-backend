import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerService, Player } from '../../core/services/player.service';
import { PlayerCardComponent } from '../../shared/components/player-card/player-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerCardComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  playerService = inject(PlayerService);

  showAddForm = signal(false);
  isEditing = signal(false);
  editingPlayerId = signal<string | null>(null);
  
  newPlayer: Player = {
    name: '',
    position: 'MID',
    attributes: { speed: 50, shooting: 50, passing: 50, defending: 50, physical: 50 }
  };

  ngOnInit() {
    this.playerService.getPlayers().subscribe();
    // Trigger sync just in case
    this.playerService.syncOfflinePlayers();
  }

  toggleAddForm() {
    this.isEditing.set(false);
    this.resetForm();
    this.showAddForm.update(v => !v);
  }

  addPlayer() {
    if (!this.newPlayer.name) return;
    this.playerService.createPlayer({ ...this.newPlayer }).subscribe({
      next: () => {
        this.showAddForm.set(false);
        this.resetForm();
      },
      error: () => {
        this.showAddForm.set(false);
        this.resetForm();
      }
    });
  }

  updatePlayer() {
    if (!this.newPlayer.name || !this.editingPlayerId()) return;
    this.playerService.updatePlayer(this.editingPlayerId()!, { ...this.newPlayer }).subscribe({
      next: () => {
        this.showAddForm.set(false);
        this.isEditing.set(false);
        this.editingPlayerId.set(null);
        this.resetForm();
      }
    });
  }

  editPlayer = (player: Player) => {
    this.isEditing.set(true);
    this.showAddForm.set(true);
    this.editingPlayerId.set(player._id || null);
    this.newPlayer = JSON.parse(JSON.stringify(player)); // deep copy to avoid direct binding mutations
  }

  deletePlayer = (id: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      this.playerService.deletePlayer(id).subscribe();
    }
  }

  resetForm() {
    this.newPlayer = {
      name: '',
      position: 'MID',
      attributes: { speed: 50, shooting: 50, passing: 50, defending: 50, physical: 50 }
    };
  }

  getTopPlayers() {
    const players = [...this.playerService.players()];
    return players.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0)).slice(0, 5);
  }
}
