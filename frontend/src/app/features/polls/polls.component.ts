import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Poll, PollCandidate, PollService } from '../../core/services/poll.service';

interface Pick { pollId: string; playerId: string; }

/**
 * Mobile-first voting screen.
 *
 * Interaction model (one thumb, no accidental votes):
 *   1. Tap a big player row  -> row lifts + haptic tick + sticky "Confirm" bar slides up
 *   2. Tap Confirm           -> vote is applied instantly (optimistic), results bars animate in
 * Live results come from visibility-aware polling in PollService.
 */
@Component({
  selector: 'app-polls',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="max-w-2xl mx-auto px-3 sm:px-4 pb-52 sm:pb-16 animate-fade-in" aria-labelledby="vote-heading">

      <!-- Header -->
      <header class="flex items-end justify-between gap-3 mb-5 px-1">
        <div>
          <h1 id="vote-heading" class="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Vote</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Pick the standout player. One vote each.</p>
        </div>
        <button type="button" id="refresh-polls" (click)="manualRefresh()" [disabled]="refreshing()"
                class="shrink-0 h-11 pl-3 pr-4 rounded-full bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 shadow-sm flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 active:scale-95 transition-transform">
          <span class="relative flex h-2.5 w-2.5">
            <span class="absolute inline-flex h-full w-full rounded-full opacity-60"
                  [class.animate-ping]="!polls.connectionIssue()"
                  [class.bg-emerald-400]="!polls.connectionIssue()" [class.bg-amber-400]="polls.connectionIssue()"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5"
                  [class.bg-emerald-500]="!polls.connectionIssue()" [class.bg-amber-500]="polls.connectionIssue()"></span>
          </span>
          <span>{{ polls.connectionIssue() ? 'Reconnecting…' : updatedAgo() }}</span>
          <svg class="w-4 h-4" [class.animate-spin]="refreshing()" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h5M20 20v-5h-5M5.6 15A8 8 0 0018.4 9M18.4 9L20 9M5.6 15L4 15"/></svg>
        </button>
      </header>

      <!-- Cold start hint (free hosting sleeps after inactivity) -->
      @if (!polls.loaded() && slow()) {
        <div class="mb-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-800 dark:text-amber-200 animate-slide-up" role="status">
          <p class="font-bold">Waking the server up ⚡</p>
          <p class="text-xs mt-0.5 opacity-80">It naps when nobody is around. This can take up to a minute — your vote still counts.</p>
        </div>
      }

      @if (errorMsg()) {
        <div class="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm font-semibold text-red-700 dark:text-red-300 animate-slide-up" role="alert">
          {{ errorMsg() }}
        </div>
      }

      <!-- Skeletons -->
      @if (!polls.loaded()) {
        <div class="space-y-3" aria-hidden="true">
          @for (i of [1,2,3,4]; track i) { <div class="skeleton h-[76px] rounded-2xl"></div> }
        </div>
      } @else if (polls.polls().length === 0) {
        <div class="text-center py-16 px-6 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60">
          <div class="text-5xl mb-3 animate-float">🗳️</div>
          <h2 class="text-lg font-black text-gray-900 dark:text-white">No poll open right now</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">When the manager finishes the week's matches, the poll shows up here.</p>
        </div>
      }

      <!-- Polls -->
      @for (poll of polls.polls(); track poll._id) {
        <article class="mb-8 animate-slide-up" [attr.aria-label]="poll.title">

          <div class="relative overflow-hidden rounded-3xl p-5 mb-3 text-white shadow-xl"
               [ngClass]="poll.isActive ? 'bg-gradient-to-br from-rose-600 via-red-600 to-orange-500' : 'bg-gradient-to-br from-slate-700 to-slate-900'">
            <div class="absolute -right-6 -top-6 text-[110px] opacity-15 select-none leading-none" aria-hidden="true">🏆</div>
            <div class="relative flex items-center gap-2 mb-2">
              <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/20 backdrop-blur">
                {{ poll.isActive ? '● Live' : 'Closed' }}
              </span>
              <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10">{{ poll.type }}</span>
            </div>
            <h2 class="relative text-2xl font-black tracking-tight">{{ poll.title }}</h2>
            <p class="relative text-xs font-semibold opacity-80 mt-1">
              {{ poll.totalVotes }} {{ poll.totalVotes === 1 ? 'vote' : 'votes' }} · top {{ poll.candidates.length }} by match rating
            </p>
          </div>

          @if (!poll.isActive && winnerOf(poll); as w) {
            <div class="mb-3 p-4 rounded-2xl bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/20 border border-yellow-300/60 dark:border-yellow-700/40 flex items-center gap-3 animate-pop-in">
              <span class="text-3xl">👑</span>
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest text-yellow-700 dark:text-yellow-400">Winner</p>
                <p class="font-black text-lg text-gray-900 dark:text-white truncate">{{ w.name }}</p>
              </div>
              <span class="ml-auto text-sm font-black text-yellow-700 dark:text-yellow-300">{{ w.votes }} 🗳️</span>
            </div>
          }

          @if (poll.isActive && !poll.hasVoted) {
            <p class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1 mb-2">Tap a player, then confirm</p>
          }

          <ul class="space-y-2.5" role="radiogroup" [attr.aria-label]="poll.title + ' candidates'">
            @for (c of poll.candidates; track c._id; let i = $index) {
              <li>
                <button type="button" role="radio"
                        [id]="'candidate-' + c._id"
                        [attr.aria-checked]="isSelected(poll, c) || poll.myVote === c._id"
                        [disabled]="!canVote(poll) || voting()"
                        (click)="select(poll, c)"
                        class="vote-card w-full text-left relative overflow-hidden rounded-2xl border-2 min-h-[76px] px-3.5 py-3 flex items-center gap-3 bg-white dark:bg-slate-900"
                        [class.selected]="isSelected(poll, c)"
                        [class.mine]="poll.myVote === c._id"
                        [class.winner]="poll.winnerId === c._id">

                  <!-- Result fill (only after voting / when closed) -->
                  @if (showResults(poll)) {
                    <span class="result-fill absolute inset-y-0 left-0" [style.width.%]="c.percent" aria-hidden="true"></span>
                  }

                  <span class="relative z-10 w-6 text-center text-sm font-black text-gray-400 dark:text-gray-500">{{ i + 1 }}</span>

                  <span class="relative z-10 shrink-0 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-sm shadow-md bg-gradient-to-br"
                        [ngClass]="posGradient(c.position)">
                    @if (c.avatarUrl) {
                      <img [src]="c.avatarUrl" [alt]="c.name" class="w-full h-full object-cover" loading="lazy" decoding="async">
                    } @else { {{ initials(c.name) }} }
                  </span>

                  <span class="relative z-10 min-w-0 flex-1">
                    <span class="flex items-center gap-1.5">
                      <span class="font-black text-[17px] leading-tight text-gray-900 dark:text-white truncate">{{ c.name }}</span>
                      @if (poll.winnerId === c._id) { <span aria-label="winner">👑</span> }
                      @if (poll.myVote === c._id) {
                        <span class="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">You</span>
                      }
                    </span>
                    <span class="flex items-center gap-2 mt-1 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      <span class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800">{{ c.position }}</span>
                      <span>⚽ {{ c.goals }}</span><span>🅰️ {{ c.assists }}</span>
                    </span>
                  </span>

                  <span class="relative z-10 shrink-0 text-right">
                    @if (showResults(poll)) {
                      <span class="block text-2xl font-black tabular-nums text-gray-900 dark:text-white leading-none">{{ c.percent }}<span class="text-sm">%</span></span>
                      <span class="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-1">{{ c.votes }} {{ c.votes === 1 ? 'vote' : 'votes' }}</span>
                    } @else {
                      <span class="block text-2xl font-black tabular-nums text-amber-500 leading-none">{{ c.avgRating.toFixed(1) }}</span>
                      <span class="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">rating</span>
                    }
                  </span>

                  @if (isSelected(poll, c)) {
                    <span class="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-accent-light dark:bg-accent-dark text-white flex items-center justify-center animate-pop-in" aria-hidden="true">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg>
                    </span>
                  }
                </button>
              </li>
            }
          </ul>

          @if (showResults(poll) && poll.isActive) {
            <p class="text-xs text-center font-semibold text-gray-500 dark:text-gray-400 mt-3">
              ✅ Your vote is locked in. Results update live.
            </p>
          }

          <!-- Manager-only control -->
          @if (poll.isOwner && poll.isActive) {
            <div class="mt-4">
              @if (closingId() !== poll._id) {
                <button type="button" [id]="'close-poll-' + poll._id" (click)="closingId.set(poll._id)"
                        class="w-full min-h-[52px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 text-sm font-black text-gray-600 dark:text-gray-300 active:scale-[0.98] transition-transform">
                  🏁 End poll &amp; crown winner
                </button>
              } @else {
                <div class="flex gap-2 animate-scale-in">
                  <button type="button" (click)="closingId.set(null)"
                          class="flex-1 min-h-[52px] rounded-2xl bg-gray-100 dark:bg-slate-800 text-sm font-bold text-gray-700 dark:text-gray-200 active:scale-95 transition-transform">Keep open</button>
                  <button type="button" [id]="'confirm-close-' + poll._id" (click)="closePoll(poll)" [disabled]="closing()"
                          class="flex-[1.4] min-h-[52px] rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-black active:scale-95 transition-transform disabled:opacity-50">
                    {{ closing() ? 'Closing…' : 'Yes, end it' }}
                  </button>
                </div>
              }
            </div>
          }
        </article>
      }
    </section>

    <!-- Sticky confirm bar: sits above the mobile tab bar, thumb-reachable -->
    @if (picked(); as pick) {
      <div class="vote-bar" role="region" aria-label="Confirm your vote">
        <div class="max-w-2xl mx-auto flex items-center gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Your pick</p>
            <p class="font-black text-lg text-gray-900 dark:text-white truncate">{{ pick.name }}</p>
          </div>
          <button type="button" id="cancel-pick" (click)="pick$.set(null)" [disabled]="voting()" aria-label="Clear selection"
                  class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-500 flex items-center justify-center active:scale-90 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <button type="button" id="confirm-vote" (click)="confirm()" [disabled]="voting()"
                  class="h-12 px-6 rounded-2xl bg-gradient-to-r from-accent-light to-rose-600 dark:from-accent-dark dark:to-rose-500 text-white font-black text-[15px] shadow-lg shadow-rose-500/30 active:scale-95 transition-transform disabled:opacity-60 flex items-center gap-2">
            @if (voting()) { <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> }
            Confirm vote
          </button>
        </div>
      </div>
    }

    @if (toast()) {
      <div class="vote-toast" role="status">{{ toast() }}</div>
    }
  `
})
export class PollsComponent implements OnInit, OnDestroy {
  polls = inject(PollService);

  pick$ = signal<Pick | null>(null);
  voting = signal(false);
  refreshing = signal(false);
  closing = signal(false);
  closingId = signal<string | null>(null);
  errorMsg = signal('');
  toast = signal('');
  slow = signal(false);
  private now = signal(Date.now());

  private slowTimer?: ReturnType<typeof setTimeout>;
  private tickTimer?: ReturnType<typeof setInterval>;
  private toastTimer?: ReturnType<typeof setTimeout>;

  updatedAgo = computed(() => {
    const t = this.polls.lastUpdated();
    if (!t) return 'Loading…';
    const s = Math.max(0, Math.round((this.now() - t) / 1000));
    return s < 5 ? 'Live' : s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`;
  });

  picked = computed(() => {
    const pick = this.pick$();
    if (!pick) return null;
    const poll = this.polls.polls().find(p => p._id === pick.pollId);
    if (!poll || !this.canVote(poll)) return null;
    return poll.candidates.find(c => c._id === pick.playerId) ?? null;
  });

  ngOnInit(): void {
    this.polls.refresh().catch(() => this.errorMsg.set('Could not load polls. Pull down or tap refresh to retry.'));
    this.polls.startLive();
    this.slowTimer = setTimeout(() => this.slow.set(true), 4000);
    this.tickTimer = setInterval(() => this.now.set(Date.now()), 5000);
  }

  ngOnDestroy(): void {
    this.polls.stopLive();
    clearTimeout(this.slowTimer);
    clearTimeout(this.toastTimer);
    clearInterval(this.tickTimer);
  }

  // ── View helpers ──────────────────────────────────────────────────────
  canVote(poll: Poll): boolean { return poll.isActive && !poll.hasVoted; }
  showResults(poll: Poll): boolean { return poll.hasVoted || !poll.isActive; }
  isSelected(poll: Poll, c: PollCandidate): boolean {
    const p = this.pick$();
    return !!p && p.pollId === poll._id && p.playerId === c._id && this.canVote(poll);
  }
  winnerOf(poll: Poll): PollCandidate | undefined {
    return poll.candidates.find(c => c._id === poll.winnerId);
  }
  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  }
  posGradient(pos: string): string {
    switch (pos) {
      case 'FWD': return 'from-rose-500 to-red-600';
      case 'MID': return 'from-emerald-500 to-green-600';
      case 'DEF': return 'from-blue-500 to-indigo-600';
      default: return 'from-amber-400 to-orange-500';
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────
  select(poll: Poll, c: PollCandidate): void {
    if (!this.canVote(poll)) return;
    this.errorMsg.set('');
    this.haptic(10);
    this.pick$.set({ pollId: poll._id, playerId: c._id });
  }

  async confirm(): Promise<void> {
    const pick = this.pick$();
    if (!pick || this.voting()) return;

    this.voting.set(true);
    this.errorMsg.set('');
    try {
      await this.polls.vote(pick.pollId, pick.playerId);
      this.pick$.set(null);
      this.haptic([15, 40, 25]);
      this.showToast('Vote locked in 🎉');
    } catch (err: any) {
      this.pick$.set(null);
      this.errorMsg.set(err?.error?.message || 'Your vote did not go through. Please try again.');
    } finally {
      this.voting.set(false);
    }
  }

  async manualRefresh(): Promise<void> {
    this.refreshing.set(true);
    this.errorMsg.set('');
    try { await this.polls.refresh(); }
    catch { this.errorMsg.set('Still can\'t reach the server. We\'ll keep trying.'); }
    finally { this.refreshing.set(false); }
  }

  async closePoll(poll: Poll): Promise<void> {
    this.closing.set(true);
    try {
      await this.polls.close(poll._id);
      this.closingId.set(null);
      this.haptic([20, 50, 20]);
      this.showToast('Winner crowned 👑');
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message || 'Could not close the poll.');
    } finally {
      this.closing.set(false);
    }
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2200);
  }

  private haptic(pattern: number | number[]): void {
    try { navigator.vibrate?.(pattern); } catch { /* unsupported (iOS Safari) — silently ignore */ }
  }
}
