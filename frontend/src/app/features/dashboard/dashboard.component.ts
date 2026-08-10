import {
  Component, inject, OnInit, signal, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerService, Player } from '../../core/services/player.service';
import { PlayerCardComponent } from '../../shared/components/player-card/player-card.component';
import { StatTierSelectorComponent } from '../../shared/components/stat-tier-selector/stat-tier-selector.component';
import { WeatherService, WeatherData } from '../../core/services/weather.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PlayerCardComponent, StatTierSelectorComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  playerService = inject(PlayerService);
  weatherService = inject(WeatherService);

  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  weatherData = signal<WeatherData | null>(null);
  isLoading = signal(true);
  isDeletingAll = signal(false);

  showAddForm = signal(false);
  isEditing = signal(false);
  editingPlayerId = signal<string | null>(null);

  // Avatar upload state
  avatarFile = signal<File | null>(null);
  avatarPreviewUrl = signal<string | null>(null);
  isUploadingAvatar = signal(false);

  newPlayer: Player = this.blankPlayer();

  readonly ATTRS: { key: keyof Player['attributes']; label: string }[] = [
    { key: 'speed',       label: 'Speed / Pace' },
    { key: 'shooting',    label: 'Shooting' },
    { key: 'passing',     label: 'Passing' },
    { key: 'defending',   label: 'Defending' },
    { key: 'physical',    label: 'Physical' },
    { key: 'stamina',     label: 'Stamina' },
    { key: 'goalkeeping', label: 'Goalkeeping' },
    { key: 'positioning', label: 'Positioning' },
    { key: 'longPass',    label: 'Long Pass' },
    { key: 'shortPass',   label: 'Short Pass' },
  ];

  ngOnInit() {
    this.playerService.getPlayers().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false),
    });
    this.playerService.syncOfflinePlayers();

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
      next: (created) => {
        // Upload avatar if selected
        if (this.avatarFile() && created._id) {
          this.isUploadingAvatar.set(true);
          this.playerService.uploadAvatar(created._id, this.avatarFile()!).subscribe({
            next: () => this.isUploadingAvatar.set(false),
            error: () => this.isUploadingAvatar.set(false),
          });
        }
        this.closeForm();
      },
      error: () => this.closeForm()
    });
  }

  updatePlayer() {
    if (!this.newPlayer.name || !this.editingPlayerId()) return;
    this.playerService.updatePlayer(this.editingPlayerId()!, { ...this.newPlayer }).subscribe({
      next: (updated) => {
        if (this.avatarFile() && updated._id) {
          this.isUploadingAvatar.set(true);
          this.playerService.uploadAvatar(updated._id, this.avatarFile()!).subscribe({
            next: () => this.isUploadingAvatar.set(false),
            error: () => this.isUploadingAvatar.set(false),
          });
        }
        this.closeForm();
      }
    });
  }

  editPlayer = (player: Player) => {
    this.isEditing.set(true);
    this.showAddForm.set(true);
    document.body.style.overflow = 'hidden';
    this.editingPlayerId.set(player._id || null);
    this.newPlayer = JSON.parse(JSON.stringify(player));
    // Show existing avatar as preview
    this.avatarPreviewUrl.set(player.avatarUrl || null);
    this.avatarFile.set(null);
  }

  deletePlayer = (id: string) => {
    if (confirm('Delete this player?')) {
      this.playerService.deletePlayer(id).subscribe();
    }
  }

  deleteAllPlayers() {
    if (!confirm(`Delete ALL ${this.playerService.players().length} players? This cannot be undone.`)) return;
    this.isDeletingAll.set(true);
    this.playerService.deleteAllPlayers().subscribe({
      next: () => this.isDeletingAll.set(false),
      error: () => this.isDeletingAll.set(false),
    });
  }

  onAttrChange(key: keyof Player['attributes'], value: number) {
    (this.newPlayer.attributes as any)[key] = value;
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.avatarFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreviewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onAvatarDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    this.avatarFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreviewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  clearAvatar() {
    this.avatarFile.set(null);
    this.avatarPreviewUrl.set(null);
    if (this.avatarInput?.nativeElement) {
      this.avatarInput.nativeElement.value = '';
    }
  }

  getStaggerDelay(i: number): string {
    return `${i * 50}ms`;
  }

  getTopPlayers() {
    return [...this.playerService.players()]
      .sort((a, b) => (b.overallRating || 0) - (a.overallRating || 0))
      .slice(0, 5);
  }

  private closeForm() {
    this.showAddForm.set(false);
    document.body.style.overflow = '';
    this.isEditing.set(false);
    this.editingPlayerId.set(null);
    this.resetForm();
  }

  private resetForm() {
    this.newPlayer = this.blankPlayer();
    this.avatarFile.set(null);
    this.avatarPreviewUrl.set(null);
  }

  private blankPlayer(): Player {
    return {
      name: '',
      position: 'MID',
      attributes: {
        speed: 60, shooting: 60, passing: 60, defending: 60,
        physical: 60, stamina: 60, goalkeeping: 60, positioning: 60,
        longPass: 60, shortPass: 60
      }
    };
  }
}
