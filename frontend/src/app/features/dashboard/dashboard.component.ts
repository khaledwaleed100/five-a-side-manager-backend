import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerService, Player } from '../../core/services/player.service';
import { PlayerCardComponent } from '../../shared/components/player-card/player-card.component';
import { WeatherService, WeatherData } from '../../core/services/weather.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerCardComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  playerService = inject(PlayerService);
  weatherService = inject(WeatherService);

  weatherData = signal<WeatherData | null>(null);

  showAddForm = signal(false);
  isEditing = signal(false);
  editingPlayerId = signal<string | null>(null);
  
  newPlayer: Player = {
    name: '',
    position: 'MID',
    attributes: { speed: 50, shooting: 50, passing: 50, defending: 50, physical: 50, stamina: 50, goalkeeping: 50, positioning: 50, longPass: 50, shortPass: 50 }
  };

  ngOnInit() {
    this.playerService.getPlayers().subscribe();
    // Trigger sync just in case
    this.playerService.syncOfflinePlayers();

    // Fetch current weather
    this.weatherService.getWeather().subscribe({
      next: (data) => this.weatherData.set(data),
      error: (err: any) => console.error('Failed to load weather data', err)
    });
  }

  toggleAddForm() {
    this.isEditing.set(false);
    this.resetForm();
    this.showAddForm.update(v => {
      const next = !v;
      document.body.style.overflow = next ? 'hidden' : '';
      return next;
    });
  }

  addPlayer() {
    if (!this.newPlayer.name) return;
    this.playerService.createPlayer({ ...this.newPlayer }).subscribe({
      next: () => {
        this.showAddForm.set(false);
        document.body.style.overflow = '';
        this.resetForm();
      },
      error: () => {
        this.showAddForm.set(false);
        document.body.style.overflow = '';
        this.resetForm();
      }
    });
  }

  updatePlayer() {
    if (!this.newPlayer.name || !this.editingPlayerId()) return;
    this.playerService.updatePlayer(this.editingPlayerId()!, { ...this.newPlayer }).subscribe({
      next: () => {
        this.showAddForm.set(false);
        document.body.style.overflow = '';
        this.isEditing.set(false);
        this.editingPlayerId.set(null);
        this.resetForm();
      }
    });
  }

  editPlayer = (player: Player) => {
    this.isEditing.set(true);
    this.showAddForm.set(true);
    document.body.style.overflow = 'hidden';
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
      attributes: { speed: 50, shooting: 50, passing: 50, defending: 50, physical: 50, stamina: 50, goalkeeping: 50, positioning: 50, longPass: 50, shortPass: 50 }
    };
  }

  getTopPlayers() {
    const players = [...this.playerService.players()];
    return players.sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0)).slice(0, 5);
  }
}
