import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatchService, Match } from '../../core/services/match.service';
import { PlayerService, Player } from '../../core/services/player.service';
import { PlayerAvgPipe } from '../../shared/pipes/player-avg.pipe';
import * as htmlToImage from 'html-to-image';

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PlayerAvgPipe],
  templateUrl: './match-detail.component.html',
  styleUrl: './match-detail.component.css'
})
export class MatchDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService);
  private playerService = inject(PlayerService);

  matchId = '';
  match = signal<Match | null>(null);
  allPlayers = signal<Player[]>([]);
  isLoading = signal(true);
  isGenerating = signal(false);
  isExporting = signal(false);
  searchTerm = signal('');

  weather = { condition: 'Loading...', description: 'Fetching weather', temp: '--°C', icon: 'sun' };

  teamAStats = computed(() => this.calculateTeamStats(this.match()?.teamA || []));
  teamBStats = computed(() => this.calculateTeamStats(this.match()?.teamB || []));

  @ViewChild('exportTemplate') exportTemplate!: ElementRef;

  // Players not in the roster
  availablePlayers = computed(() => {
    const currentRosterIds = new Set(this.match()?.roster?.map(p => p._id) || []);
    return this.allPlayers()
      .filter(p => !currentRosterIds.has(p._id))
      .filter(p => p.name.toLowerCase().includes(this.searchTerm().toLowerCase()));
  });

  ngOnInit() {
    this.matchId = this.route.snapshot.paramMap.get('id') || '';
    if (this.matchId) {
      this.loadData();
    }
    this.fetchWeather();
  }

  async fetchWeather() {
    try {
     
      let lat = 31.034081;
      let lon = 40.468231;
      
      // Try to get actual location
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch (e) {
          console.log('Using default location for weather');
        }
      }

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await res.json();
      
      const temp = Math.round(data.current_weather.temperature);
      const code = data.current_weather.weathercode;
      
      // Simple weather code mapping (WMO codes)
      let condition = 'Clear Skies';
      let icon = 'sun';
      if (code >= 1 && code <= 3) { condition = 'Partly Cloudy'; icon = 'cloud-sun'; }
      if (code >= 45 && code <= 48) { condition = 'Foggy'; icon = 'cloud'; }
      if (code >= 51 && code <= 67) { condition = 'Rainy'; icon = 'cloud-rain'; }
      if (code >= 71 && code <= 77) { condition = 'Snowy'; icon = 'cloud-snow'; }
      if (code >= 95) { condition = 'Thunderstorm'; icon = 'cloud-lightning'; }

      this.weather = { condition, description: 'Current Conditions', temp: `${temp}°C`, icon };
    } catch (err) {
      this.weather = { condition: 'Weather Unavailable', description: 'Offline', temp: '--°C', icon: 'cloud' };
    }
  }

  // Calculate tactical positions on the pitch (percentages)
  // Team A defends left (GK near 5%), attacks right.
  // Team B defends right (GK near 95%), attacks left.
  getPositionStyle(player: Player, team: 'A' | 'B', index: number, totalInPos: number) {
    const isTeamA = team === 'A';
    let x = 50;
    
    if (player.position === 'GK') x = isTeamA ? 6 : 94;
    else if (player.position === 'DEF') x = isTeamA ? 18 : 82;
    else if (player.position === 'MID') x = isTeamA ? 30 : 70;
    else if (player.position === 'FWD') x = isTeamA ? 40 : 60; 

    // Find the player's index specifically within their position group
    const teamArray = isTeamA ? this.match()?.teamA || [] : this.match()?.teamB || [];
    const posGroup = teamArray.filter(p => p.position === player.position);
    const idxInGroup = posGroup.findIndex(p => p._id === player._id);

    // Spread vertically across the middle 80% of the pitch to prevent clipping edges
    let y = 50;
    if (totalInPos > 1) {
      const step = 80 / totalInPos;
      y = 10 + step * idxInGroup + (step / 2);
    }

    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
      position: 'absolute'
    };
  }

  getPlayersByPosition(team: Player[], position: string) {
    return team.filter(p => p.position === position);
  }

  isPlayerInTeam(player: Player, team: Player[]) {
    return team.some(p => p._id === player._id);
  }

  assignPlayer(player: Player, team: 'A' | 'B' | 'Unassigned') {
    if (!this.match()) return;
    
    const currentA = this.match()!.teamA || [];
    const currentB = this.match()!.teamB || [];

    let teamA = currentA.filter(p => p._id !== player._id);
    let teamB = currentB.filter(p => p._id !== player._id);
    
    if (team === 'A') {
      teamA.push(player);
    } else if (team === 'B') {
      teamB.push(player);
    }
    
    this.matchService.updateMatch(this.matchId, { 
      teamA: teamA.map(p => p._id) as any,
      teamB: teamB.map(p => p._id) as any
    }).subscribe({
      next: (updated) => {
        this.match.set(updated);
      }
    });
  }

  loadData() {
    this.isLoading.set(true);
    // Fetch match and all players in parallel
    this.matchService.getMatch(this.matchId).subscribe({
      next: (m) => {
        this.match.set(m);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.playerService.getPlayers().subscribe({
      next: (players) => this.allPlayers.set(players)
    });
  }

  addToRoster(player: Player) {
    if (!this.match()) return;
    const currentRoster = this.match()?.roster || [];
    const updatedRoster = [...currentRoster, player];
    
    this.matchService.updateMatch(this.matchId, { roster: updatedRoster.map(p => p._id) as any }).subscribe({
      next: (updated) => this.match.set(updated)
    });
  }

  removeFromRoster(playerId: string) {
    if (!this.match()) return;
    const updatedRoster = (this.match()?.roster || []).filter(p => p._id !== playerId);
    
    this.matchService.updateMatch(this.matchId, { roster: updatedRoster.map(p => p._id) as any }).subscribe({
      next: (updated) => this.match.set(updated)
    });
  }

  generateTeams() {
    if (!this.matchId) return;
    this.isGenerating.set(true);
    this.matchService.generateTeams(this.matchId).subscribe({
      next: (updated) => {
        this.match.set(updated);
        this.isGenerating.set(false);
      },
      error: () => this.isGenerating.set(false)
    });
  }

  async exportImage() {
    if (!this.exportTemplate) return;
    
    this.isExporting.set(true);
    try {
      // Small delay to ensure Angular updates the DOM bindings inside the template
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await htmlToImage.toJpeg(this.exportTemplate.nativeElement, {
        quality: 0.95,
        backgroundColor: '#0f172a',
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `match-${this.match()?.place.replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating graphic:', err);
    } finally {
      this.isExporting.set(false);
    }
  }

  private calculateTeamStats(players: any[]) {
    if (!players || players.length === 0) {
      return { speed: 0, shooting: 0, passing: 0, defending: 0, physical: 0 };
    }
    const sum = players.reduce((acc, p) => {
      acc.speed += p.attributes?.speed || 50;
      acc.shooting += p.attributes?.shooting || 50;
      acc.passing += p.attributes?.passing || 50;
      acc.defending += p.attributes?.defending || 50;
      acc.physical += p.attributes?.physical || 50;
      return acc;
    }, { speed: 0, shooting: 0, passing: 0, defending: 0, physical: 0 });

    return {
      speed: Math.round(sum.speed / players.length),
      shooting: Math.round(sum.shooting / players.length),
      passing: Math.round(sum.passing / players.length),
      defending: Math.round(sum.defending / players.length),
      physical: Math.round(sum.physical / players.length)
    };
  }
}
