import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PollService, PollStatus, PollType } from '../../../core/services/poll.service';

/**
 * Entry point to polls from the Matches screen.
 *  - Everyone: a "Vote now" banner when an open poll is waiting for their vote.
 *  - Managers: progress toward the next weekly (3 matches) / monthly (12 matches) poll
 *    and the button that opens it for the other logged-in users.
 */
@Component({
  selector: 'app-poll-hub-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (polls.pendingVotes() > 0) {
      <a routerLink="/vote" id="vote-now-banner"
         class="block mb-6 p-4 rounded-3xl bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-xl shadow-rose-500/30 active:scale-[0.98] transition-transform animate-slide-up">
        <div class="flex items-center gap-3">
          <span class="text-3xl animate-float">🗳️</span>
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-black uppercase tracking-widest opacity-80">Voting is open</p>
            <p class="font-black text-lg leading-tight">Cast your vote now</p>
          </div>
          <span class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>
          </span>
        </div>
      </a>
    }

    @if (showManagerCard()) {
      <section class="mb-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm p-5 animate-slide-up" aria-labelledby="poll-hub-title">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xl">🏆</span>
          <h2 id="poll-hub-title" class="text-lg font-black text-gray-900 dark:text-white">Player polls</h2>
        </div>

        <div class="space-y-5">
          @for (t of types; track t.type) {
            @if (status(); as s) {
              <div>
                <div class="flex items-baseline justify-between mb-1.5">
                  <p class="text-sm font-black text-gray-800 dark:text-gray-100">{{ t.label }}</p>
                  <p class="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums">{{ s[t.type].completed }}/{{ s[t.type].required }} matches</p>
                </div>
                <div class="h-2.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden" role="progressbar"
                     [attr.aria-valuenow]="s[t.type].completed" aria-valuemin="0" [attr.aria-valuemax]="s[t.type].required">
                  <div class="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-[width] duration-700"
                       [style.width.%]="(s[t.type].completed / s[t.type].required) * 100"></div>
                </div>

                @if (s[t.type].activePollId) {
                  <a routerLink="/vote" [id]="'open-' + t.type + '-poll'"
                     class="mt-3 w-full min-h-[48px] rounded-2xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                    <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full rounded-full bg-white opacity-70 animate-ping"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-white"></span></span>
                    Poll is live — view results
                  </a>
                } @else {
                  <button type="button" [id]="'start-' + t.type + '-poll'" (click)="start(t.type)"
                          [disabled]="!s[t.type].canGenerate || creating() !== null"
                          class="mt-3 w-full min-h-[48px] rounded-2xl font-black text-sm active:scale-95 transition-all disabled:cursor-not-allowed"
                          [ngClass]="s[t.type].canGenerate
                            ? 'bg-gradient-to-r from-accent-light to-rose-600 text-white shadow-lg shadow-rose-500/30'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500'">
                    @if (creating() === t.type) { Building poll… }
                    @else if (s[t.type].canGenerate) { 🗳️ Start {{ t.short }} poll }
                    @else { {{ s[t.type].required - s[t.type].completed }} more {{ s[t.type].required - s[t.type].completed === 1 ? 'match' : 'matches' }} to unlock }
                  </button>
                }
              </div>
            }
          }
        </div>

        @if (error()) {
          <p class="mt-4 text-xs font-bold text-red-600 dark:text-red-400" role="alert">{{ error() }}</p>
        }
      </section>
    }
  `
})
export class PollHubCardComponent implements OnInit {
  polls = inject(PollService);
  private router = inject(Router);

  readonly types: { type: PollType; label: string; short: string }[] = [
    { type: 'weekly', label: 'Player of the Week', short: 'weekly' },
    { type: 'monthly', label: 'Player of the Month', short: 'monthly' }
  ];

  status = signal<PollStatus | null>(null);
  creating = signal<PollType | null>(null);
  error = signal('');

  /** Hide the manager block for accounts that have never completed a match (pure voters). */
  showManagerCard = computed(() => {
    const s = this.status();
    return !!s && (s.weekly.pending > 0 || s.monthly.pending > 0 || !!s.weekly.activePollId || !!s.monthly.activePollId);
  });

  ngOnInit(): void {
    this.polls.refresh().catch(() => undefined);
    this.loadStatus();
  }

  private loadStatus(): void {
    this.polls.getStatus().then(s => this.status.set(s)).catch(() => undefined);
  }

  async start(type: PollType): Promise<void> {
    this.error.set('');
    this.creating.set(type);
    try {
      await this.polls.generate(type);
      try { navigator.vibrate?.([15, 40, 25]); } catch { /* ignore */ }
      await this.router.navigate(['/vote']);
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Could not start the poll.');
      this.loadStatus();
    } finally {
      this.creating.set(null);
    }
  }
}
