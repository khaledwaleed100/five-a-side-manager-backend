import { ChangeDetectionStrategy, Component, Input, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PollService, PollStatus, PollType, PollTypeStatus } from '../../../core/services/poll.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Entry point to polls.
 *  - Everyone: a "Vote now" banner when an open poll is waiting for their vote (Matches screen only).
 *  - Managers: progress toward the next weekly (3 matches) / monthly (12 matches) poll
 *    and the button that opens it for the other logged-in users.
 *  - Admins: always see the panel, and can open a poll early ("Start now") with at least one rated match.
 *
 * Used on the Matches screen (context="matches") and at the top of the Vote screen (context="vote").
 */
@Component({
  selector: 'app-poll-hub-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (context === 'matches' && polls.pendingVotes() > 0) {
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
      <section class="poll-admin-card mb-6 rounded-3xl p-5 animate-slide-up" aria-labelledby="poll-hub-title">
        <div class="flex items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-2">
            <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-lg shadow-md">🏆</span>
            <div>
              <h2 id="poll-hub-title" class="text-base font-black text-gray-900 dark:text-white leading-tight">
                {{ context === 'vote' ? 'Start a vote' : 'Player polls' }}
              </h2>
              <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Members vote from their Vote tab</p>
            </div>
          </div>
          @if (isAdmin()) {
            <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Admin</span>
          }
        </div>

        @if (status(); as s) {
          <div class="grid gap-4 sm:grid-cols-2">
            @for (t of types; track t.type) {
              <div class="rounded-2xl p-3.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
                <div class="flex items-baseline justify-between mb-1.5">
                  <p class="text-sm font-black text-gray-800 dark:text-gray-100">{{ t.label }}</p>
                  <p class="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums">{{ s[t.type].completed }}/{{ s[t.type].required }} matches</p>
                </div>
                <div class="h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden" role="progressbar"
                     [attr.aria-valuenow]="s[t.type].completed" aria-valuemin="0" [attr.aria-valuemax]="s[t.type].required">
                  <div class="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-[width] duration-700"
                       [style.width.%]="(s[t.type].completed / s[t.type].required) * 100"></div>
                </div>

                @if (s[t.type].activePollId) {
                  @if (context === 'vote') {
                    <p class="mt-3 min-h-[44px] rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center gap-2">
                      <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-70 animate-ping"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
                      Live — members are voting below
                    </p>
                  } @else {
                    <a routerLink="/vote" [id]="'open-' + t.type + '-poll'"
                       class="mt-3 w-full min-h-[44px] rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full rounded-full bg-white opacity-70 animate-ping"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-white"></span></span>
                      Poll is live — view results
                    </a>
                  }
                } @else if (s[t.type].canGenerate) {
                  <button type="button" [id]="'start-' + t.type + '-poll'" (click)="start(t.type, false)" [disabled]="creating() !== null"
                          class="mt-3 w-full min-h-[44px] rounded-xl font-black text-sm text-white bg-gradient-to-r from-accent-light to-rose-600 shadow-lg shadow-rose-500/30 active:scale-95 transition-all disabled:opacity-60">
                    {{ creating() === t.type ? 'Opening poll…' : '🗳️ Start ' + t.short + ' poll' }}
                  </button>
                } @else if (s[t.type].canForce) {
                  @if (confirmType() === t.type) {
                    <div class="mt-3 flex gap-2 animate-scale-in">
                      <button type="button" (click)="confirmType.set(null)"
                              class="flex-1 min-h-[44px] rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-600 dark:text-gray-300 active:scale-95 transition-transform">Cancel</button>
                      <button type="button" [id]="'confirm-force-' + t.type" (click)="start(t.type, true)" [disabled]="creating() !== null"
                              class="flex-[1.6] min-h-[44px] rounded-xl font-black text-xs text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-md shadow-orange-500/30 active:scale-95 transition-transform disabled:opacity-60">
                        {{ creating() === t.type ? 'Opening poll…' : 'Yes, open it now' }}
                      </button>
                    </div>
                    <p class="mt-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      Uses {{ s[t.type].pending }} {{ s[t.type].pending === 1 ? 'match' : 'matches' }} instead of {{ s[t.type].required }}.
                    </p>
                  } @else {
                    <button type="button" [id]="'force-' + t.type + '-poll'" (click)="confirmType.set(t.type)" [disabled]="creating() !== null"
                            class="mt-3 w-full min-h-[44px] rounded-xl font-black text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-orange-500/25 active:scale-95 transition-all disabled:opacity-60">
                      ⚡ Start now ({{ s[t.type].pending }} {{ s[t.type].pending === 1 ? 'match' : 'matches' }})
                    </button>
                  }
                } @else {
                  <button type="button" disabled
                          class="mt-3 w-full min-h-[44px] rounded-xl font-bold text-xs bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed">
                    {{ lockedLabel(s[t.type]) }}
                  </button>
                }
              </div>
            }
          </div>
        }

        @if (success()) {
          <p class="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in" role="status">{{ success() }}</p>
        }
        @if (error()) {
          <p class="mt-4 text-xs font-bold text-red-600 dark:text-red-400" role="alert">{{ error() }}</p>
        }
      </section>
    }
  `
})
export class PollHubCardComponent implements OnInit {
  polls = inject(PollService);
  private auth = inject(AuthService);
  private router = inject(Router);

  /** Where the card is rendered. On the Vote page the "Vote now" banner is redundant and we don't navigate. */
  @Input() context: 'matches' | 'vote' = 'matches';

  readonly types: { type: PollType; label: string; short: string }[] = [
    { type: 'weekly', label: 'Player of the Week', short: 'weekly' },
    { type: 'monthly', label: 'Player of the Month', short: 'monthly' }
  ];

  status = signal<PollStatus | null>(null);
  creating = signal<PollType | null>(null);
  confirmType = signal<PollType | null>(null);
  error = signal('');
  success = signal('');

  isAdmin = computed(() => !!this.auth.currentUser()?.isAdmin || !!this.status()?.isAdmin);

  /** Admins always see the panel; other accounts only once they have matches to poll (pure voters never see it). */
  showManagerCard = computed(() => {
    const s = this.status();
    if (!s) return false;
    if (this.isAdmin()) return true;
    return s.weekly.pending > 0 || s.monthly.pending > 0 || !!s.weekly.activePollId || !!s.monthly.activePollId;
  });

  ngOnInit(): void {
    if (this.context === 'matches') this.polls.refresh().catch(() => undefined);
    this.loadStatus();
  }

  /** Changes when one of *my* polls opens or closes (from any screen) -> status must be re-read. */
  private myActiveKey = computed(() =>
    this.polls.polls().filter(p => p.isOwner && p.isActive).map(p => p._id).sort().join(','));
  private lastKey: string | null = null;

  constructor() {
    effect(() => {
      const key = this.myActiveKey();
      if (this.lastKey !== null && key !== this.lastKey) this.loadStatus();
      this.lastKey = key;
    });
  }

  lockedLabel(t: PollTypeStatus): string {
    if (t.pending === 0) return 'Complete a match & enter ratings to unlock';
    const left = t.required - t.completed;
    return `${left} more ${left === 1 ? 'match' : 'matches'} to unlock`;
  }

  private loadStatus(): void {
    this.polls.getStatus().then(s => this.status.set(s)).catch(() => undefined);
  }

  async start(type: PollType, force: boolean): Promise<void> {
    this.error.set('');
    this.success.set('');
    this.creating.set(type);
    try {
      await this.polls.generate(type, force);
      try { navigator.vibrate?.([15, 40, 25]); } catch { /* ignore */ }
      this.confirmType.set(null);
      this.success.set('Poll is live! Members will see it on their Vote tab.');
      this.loadStatus();
      if (this.context === 'matches') await this.router.navigate(['/vote']);
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Could not start the poll.');
      this.loadStatus();
    } finally {
      this.creating.set(null);
    }
  }
}
