import { Component, Input, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../../core/services/player.service';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.css']
})
export class PlayerCardComponent {
  @Input() player!: Player;
  @Input() showDelete = false;
  @Input() showEdit = false;
  @Input() isExporting = false;
  @Input() deleteCallback?: (id: string) => void;
  @Input() editCallback?: (player: Player) => void;
  // Keep for backwards compat (unused now)
  @Input() mousePos: { x: number, y: number } = { x: 0, y: 0 };

  isExpanded = signal(false);

  toggleExpand() {
    this.isExpanded.update(v => !v);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    if (this.player._id && this.deleteCallback) {
      this.deleteCallback(this.player._id);
    }
  }

  onEdit(event: Event) {
    event.stopPropagation();
    if (this.editCallback) {
      this.editCallback(this.player);
    }
  }

  getOverallRating(): number {
    if (this.player.overallRating) return this.player.overallRating;
    const attrs = this.player.attributes;
    return Math.floor((attrs.speed + attrs.shooting + attrs.passing + attrs.defending + attrs.physical) / 5);
  }

  getPositionBg(): string {
    switch (this.player.position) {
      case 'GK':  return 'bg-yellow-500';
      case 'DEF': return 'bg-blue-500';
      case 'MID': return 'bg-green-500';
      case 'FWD': return 'bg-red-500';
      default:    return 'bg-gray-500';
    }
  }

  getPositionBorderColor(): string {
    switch (this.player.position) {
      case 'GK':  return 'border-yellow-400';
      case 'DEF': return 'border-blue-400';
      case 'MID': return 'border-green-400';
      case 'FWD': return 'border-red-400';
      default:    return 'border-gray-400';
    }
  }

  getPositionChipColor(): string {
    switch (this.player.position) {
      case 'GK':  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'DEF': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MID': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'FWD': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  }

  getOvrBadgeColor(): string {
    const ovr = this.getOverallRating();
    if (ovr >= 80) return 'bg-purple-600';
    if (ovr >= 70) return 'bg-yellow-500';
    if (ovr >= 55) return 'bg-gray-500';
    return 'bg-orange-700';
  }

  getTopStats(): { label: string; value: number; color: string }[] {
    const a = this.player.attributes;
    return [
      { label: 'PAC', value: a.speed,     color: 'bg-blue-400' },
      { label: 'SHO', value: a.shooting,  color: 'bg-red-400' },
      { label: 'PAS', value: a.passing,   color: 'bg-green-400' },
      { label: 'DEF', value: a.defending, color: 'bg-indigo-400' },
      { label: 'PHY', value: a.physical,  color: 'bg-orange-400' },
    ];
  }

  getAllStats(): { label: string; value: number; color: string }[] {
    const a = this.player.attributes;
    return [
      { label: 'PAC', value: a.speed,        color: 'bg-blue-400' },
      { label: 'SHO', value: a.shooting,     color: 'bg-red-400' },
      { label: 'PAS', value: a.passing,      color: 'bg-green-400' },
      { label: 'DEF', value: a.defending,    color: 'bg-indigo-400' },
      { label: 'PHY', value: a.physical,     color: 'bg-orange-400' },
      { label: 'STA', value: a.stamina,      color: 'bg-teal-400' },
      { label: 'GK',  value: a.goalkeeping, color: 'bg-yellow-400' },
      { label: 'POS', value: a.positioning,  color: 'bg-pink-400' },
      { label: 'LP',  value: a.longPass,     color: 'bg-cyan-400' },
      { label: 'SP',  value: a.shortPass,    color: 'bg-lime-400' },
    ];
  }
}
