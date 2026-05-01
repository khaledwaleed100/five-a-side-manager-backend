import { Pipe, PipeTransform } from '@angular/core';
import { Player } from '../../core/services/player.service';

@Pipe({
  name: 'playerAvg',
  standalone: true
})
export class PlayerAvgPipe implements PipeTransform {
  transform(players: Player[] | undefined): number {
    if (!players || players.length === 0) return 0;
    const sum = players.reduce((acc, p) => acc + (p.overallRating || 0), 0);
    return Math.round(sum / players.length);
  }
}
