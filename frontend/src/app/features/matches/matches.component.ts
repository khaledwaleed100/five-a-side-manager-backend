import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatchService, Match } from '../../core/services/match.service';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container mx-auto px-4 py-8 animate-fade-in relative">
      <!-- Decorative Background Elements -->
      <div class="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-accent-light/5 to-transparent dark:from-accent-dark/10 pointer-events-none -z-10 rounded-3xl"></div>

      <!-- Hero Section -->
      <div class="relative w-full mb-8 bg-surface-light dark:bg-surface-dark p-8 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row justify-between items-center">
        <!-- Abstract Pattern Background -->
        <svg class="absolute inset-0 w-full h-full text-gray-50 dark:text-gray-900/50 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="90" cy="10" r="40" opacity="0.4"></circle>
          <path d="M-10 110 L110 -10 L110 110 Z" opacity="0.1"></path>
        </svg>

        <div class="relative z-10 mb-6 md:mb-0">
          <h1 class="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Match Hub</h1>
          <p class="text-gray-600 dark:text-gray-400">Schedule, manage, and review all your 5-a-side fixtures.</p>
        </div>
        
        <div class="relative z-10 flex items-center gap-8">
          <div class="text-center hidden sm:block">
            <p class="text-3xl font-black text-gray-800 dark:text-gray-200">{{ matches().length }}</p>
            <p class="text-[10px] uppercase tracking-wider font-bold text-gray-500">Total Matches</p>
          </div>
          <button (click)="toggleAddForm()" 
                  class="px-8 py-3 bg-accent-light dark:bg-accent-dark text-white font-bold rounded-xl shadow-lg shadow-accent-light/30 dark:shadow-accent-dark/30 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            {{ showAddForm() ? 'Cancel Creation' : '+ Create Match' }}
          </button>
        </div>
      </div>

      <!-- Add Match Form -->
      <div *ngIf="showAddForm()" class="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-xl mb-8 animate-slide-up border border-gray-100 dark:border-gray-800">
        <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">New Match Details</h2>
        <form (ngSubmit)="createMatch()" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Place/Venue</label>
            <input [(ngModel)]="newMatch.place" name="place" type="text" required
                   class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition-all">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input [(ngModel)]="newMatch.date" name="date" type="date" required
                   class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition-all">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
            <input [(ngModel)]="newMatch.time" name="time" type="time" required
                   class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark outline-none transition-all">
          </div>
          <div class="md:col-span-3 flex justify-end mt-2">
            <button type="submit" 
                    [disabled]="!newMatch.place || !newMatch.date || !newMatch.time"
                    class="px-8 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 transition-all">
              Save Match
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="flex justify-center py-12">
        <svg class="w-10 h-10 animate-spin text-accent-light dark:text-accent-dark" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Matches Grid Header & Filters -->
      <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4" *ngIf="!isLoading()">
        <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full sm:w-auto">
          <button (click)="activeFilter.set('ALL')" [ngClass]="{'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white': activeFilter() === 'ALL', 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300': activeFilter() !== 'ALL'}" class="flex-1 sm:px-6 py-2 rounded-lg font-medium text-sm transition-all">All Matches</button>
          <button (click)="activeFilter.set('UPCOMING')" [ngClass]="{'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white': activeFilter() === 'UPCOMING', 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300': activeFilter() !== 'UPCOMING'}" class="flex-1 sm:px-6 py-2 rounded-lg font-medium text-sm transition-all">Upcoming</button>
          <button (click)="activeFilter.set('PAST')" [ngClass]="{'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white': activeFilter() === 'PAST', 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300': activeFilter() !== 'PAST'}" class="flex-1 sm:px-6 py-2 rounded-lg font-medium text-sm transition-all">Past</button>
        </div>
      </div>

      <!-- Matches Grid -->
      <div *ngIf="!isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let match of filteredMatches" 
             class="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col h-full group">
          
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-accent-light dark:text-accent-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {{ match.place }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {{ match.date | date:'mediumDate' }} at {{ match.time }}
              </p>
            </div>
            <button (click)="deleteMatch(match._id!, $event)" class="text-gray-400 hover:text-red-500 transition-colors p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>

          <div class="mt-2 flex items-center justify-between">
            <div class="text-sm font-medium text-gray-600 dark:text-gray-300">
              <span class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{{ match.roster.length }} Players Confirmed</span>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
            <a [routerLink]="['/matches', match._id]" 
               class="block w-full text-center py-2 bg-gray-100 dark:bg-gray-800 hover:bg-accent-light dark:hover:bg-accent-dark text-gray-700 dark:text-gray-200 hover:text-white font-medium rounded-lg transition-colors">
              Manage Match
            </a>
          </div>
        </div>

        <div *ngIf="filteredMatches.length === 0" class="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-surface-light dark:bg-surface-dark rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <p class="text-lg">No matches found for this filter.</p>
          <button *ngIf="matches().length === 0" (click)="showAddForm.set(true)" class="mt-4 text-accent-light dark:text-accent-dark font-medium hover:underline">Schedule one now</button>
        </div>
      </div>
    </div>
  `
})
export class MatchesComponent implements OnInit {
  matchService = inject(MatchService);

  matches = signal<Match[]>([]);
  isLoading = signal(true);
  showAddForm = signal(false);
  activeFilter = signal<'ALL' | 'UPCOMING' | 'PAST'>('ALL');

  newMatch: Partial<Match> = {
    place: '',
    date: '',
    time: ''
  };

  ngOnInit() {
    this.loadMatches();
  }

  loadMatches() {
    this.isLoading.set(true);
    this.matchService.getMatches().subscribe({
      next: (data: Match[]) => {
        // Sort by date descending
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.matches.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  get filteredMatches() {
    const all = this.matches();
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (this.activeFilter() === 'UPCOMING') {
      return all.filter(m => new Date(m.date) >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    if (this.activeFilter() === 'PAST') {
      return all.filter(m => new Date(m.date) < today);
    }
    return all;
  }

  toggleAddForm() {
    this.showAddForm.update(v => !v);
  }

  createMatch() {
    this.matchService.createMatch(this.newMatch).subscribe({
      next: (created: Match) => {
        this.matches.update(m => [created, ...m]);
        this.showAddForm.set(false);
        this.newMatch = { place: '', date: '', time: '' };
      }
    });
  }

  deleteMatch(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this match?')) {
      this.matchService.deleteMatch(id).subscribe({
        next: () => {
          this.matches.update(m => m.filter(match => match._id !== id));
        }
      });
    }
  }
}
