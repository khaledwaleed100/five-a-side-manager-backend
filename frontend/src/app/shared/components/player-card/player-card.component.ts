import { Component, Input, signal } from '@angular/core';
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
  @Input() mousePos: { x: number, y: number } = { x: 0, y: 0 };

  isFlipped = signal(false);

  toggleFlip() {
    this.isFlipped.update(v => !v);
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

  getPositionColor(): string {
    switch (this.player.position) {
      case 'GK': return 'bg-yellow-500';
      case 'DEF': return 'bg-blue-500';
      case 'MID': return 'bg-green-500';
      case 'FWD': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  getPositionBorderColor(): string {
    switch (this.player.position) {
      case 'GK': return 'border-yellow-500 text-yellow-700 dark:text-yellow-400';
      case 'DEF': return 'border-blue-500 text-blue-700 dark:text-blue-400';
      case 'MID': return 'border-green-500 text-green-700 dark:text-green-400';
      case 'FWD': return 'border-red-500 text-red-700 dark:text-red-400';
      default: return 'border-gray-500 text-gray-700 dark:text-gray-400';
    }
  }

  getMagneticStyle(el: HTMLElement): any {
    if (this.isExporting) return {};
    
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = this.mousePos.x - centerX;
    const dy = this.mousePos.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const maxDist = 200;
    if (distance < maxDist) {
      const force = (maxDist - distance) / maxDist;
      const strength = 15; // px
      const moveX = (dx / distance) * force * strength;
      const moveY = (dy / distance) * force * strength;
      const rotate = (dx / distance) * force * 5;
      
      return {
        transform: `translate3d(${moveX}px, ${moveY}px, 0) rotate(${rotate}deg)`,
        transition: 'transform 0.1s ease-out',
        zIndex: 50
      };
    }
    
    return {
      transition: 'transform 0.5s ease-out'
    };
  }
}
