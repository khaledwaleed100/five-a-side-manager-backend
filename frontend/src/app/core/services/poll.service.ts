import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PollType = 'weekly' | 'monthly';

export interface PollCandidate {
  _id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  avatarUrl: string | null;
  overallRating?: number;
  avgRating: number;
  goals: number;
  assists: number;
  matches: number;
  votes: number;
  percent: number;
}

export interface Poll {
  _id: string;
  title: string;
  type: PollType;
  isActive: boolean;
  createdAt: string;
  closedAt: string | null;
  isOwner: boolean;
  hasVoted: boolean;
  myVote: string | null;
  totalVotes: number;
  winnerId: string | null;
  candidates: PollCandidate[];
}

export interface PollTypeStatus {
  required: number;
  completed: number;
  pending: number;
  canGenerate: boolean;
  activePollId: string | null;
}

export type PollStatus = Record<PollType, PollTypeStatus>;

/** Short-poll cadence. Kept gentle: phones on mobile data, free-tier server. */
const LIVE_INTERVAL_MS = 20_000;
const MAX_BACKOFF_MS = 120_000;

/**
 * PollService is the single source of truth for polls on the client.
 *
 *  - `polls` is a signal store, so every screen (nav badge, vote page, matches banner) stays in sync.
 *  - Live updates use visibility-aware short polling: nothing is requested while the phone is
 *    locked or the tab is in the background, and an immediate refresh happens on return.
 *  - Votes are applied optimistically (instant feedback) and rolled back if the server rejects them.
 */
@Injectable({ providedIn: 'root' })
export class PollService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/polls`;

  readonly polls = signal<Poll[]>([]);
  readonly loaded = signal(false);
  readonly lastUpdated = signal<number | null>(null);
  readonly connectionIssue = signal(false);

  /** Open polls this user has not voted in yet — drives the nav badge. */
  readonly pendingVotes = computed(() => this.polls().filter(p => p.isActive && !p.hasVoted).length);

  private inflight: Promise<void> | null = null;
  private pendingVoteIds = new Set<string>();

  private liveUsers = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private delay = LIVE_INTERVAL_MS;

  // ── Reads ───────────────────────────────────────────────────────────────
  refresh(): Promise<void> {
    if (this.inflight) return this.inflight;

    this.inflight = firstValueFrom(this.http.get<Poll[]>(this.api))
      .then(fresh => {
        // Never let a stale response erase an optimistic vote that is still in flight.
        const local = new Map(this.polls().map(p => [p._id, p]));
        this.polls.set(fresh.map(p => (this.pendingVoteIds.has(p._id) && local.get(p._id)) || p));
        this.loaded.set(true);
        this.lastUpdated.set(Date.now());
        this.connectionIssue.set(false);
      })
      .catch(err => {
        this.connectionIssue.set(true);
        throw err;
      })
      .finally(() => { this.inflight = null; });

    return this.inflight;
  }

  getStatus(): Promise<PollStatus> {
    return firstValueFrom(this.http.get<PollStatus>(`${this.api}/status`));
  }

  // ── Session ─────────────────────────────────────────────────────────────
  /** Drops cached polls (called on login/logout so accounts on a shared phone never see each other's vote state). */
  reset(): void {
    this.polls.set([]);
    this.loaded.set(false);
    this.lastUpdated.set(null);
    this.connectionIssue.set(false);
    this.pendingVoteIds.clear();
  }

  // ── Live refresh (visibility-aware) ─────────────────────────────────────
  startLive(): void {
    if (++this.liveUsers === 1) {
      document.addEventListener('visibilitychange', this.onVisibility);
      this.delay = LIVE_INTERVAL_MS;
      this.schedule();
    }
  }

  stopLive(): void {
    if (this.liveUsers > 0 && --this.liveUsers === 0) {
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.clearTimer();
    }
  }

  private schedule(): void {
    this.clearTimer();
    if (this.liveUsers > 0) this.timer = setTimeout(this.tick, this.delay);
  }

  private clearTimer(): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  private tick = (): void => {
    // Hidden tab / locked phone: don't spend battery or data. onVisibility resumes us.
    if (document.hidden) return;
    this.refresh()
      .then(() => { this.delay = LIVE_INTERVAL_MS; })
      .catch(() => { this.delay = Math.min(this.delay * 2, MAX_BACKOFF_MS); })
      .finally(() => this.schedule());
  };

  private onVisibility = (): void => {
    if (!document.hidden && this.liveUsers > 0) {
      this.clearTimer();
      this.tick();
    }
  };

  // ── Writes ──────────────────────────────────────────────────────────────
  async vote(pollId: string, playerId: string): Promise<void> {
    const before = this.polls();
    this.pendingVoteIds.add(pollId);
    this.polls.set(before.map(p => (p._id === pollId ? this.withVote(p, playerId) : p)));

    try {
      const confirmed = await firstValueFrom(this.http.post<Poll>(`${this.api}/${pollId}/vote`, { playerId }));
      this.replace(confirmed);
    } catch (err) {
      this.pendingVoteIds.delete(pollId);
      this.polls.set(before);
      // 409 = already voted elsewhere (e.g. other phone): pull the truth from the server.
      this.refresh().catch(() => undefined);
      throw err;
    } finally {
      this.pendingVoteIds.delete(pollId);
    }
  }

  async generate(type: PollType): Promise<Poll> {
    const poll = await firstValueFrom(this.http.post<Poll>(`${this.api}/generate`, { type }));
    this.polls.update(list => [poll, ...list.filter(p => p._id !== poll._id)]);
    return poll;
  }

  async close(pollId: string): Promise<void> {
    const closed = await firstValueFrom(this.http.post<Poll>(`${this.api}/${pollId}/close`, {}));
    this.replace(closed);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  private replace(poll: Poll): void {
    this.polls.update(list => list.map(p => (p._id === poll._id ? poll : p)));
  }

  private withVote(poll: Poll, playerId: string): Poll {
    const total = poll.totalVotes + 1;
    return {
      ...poll,
      hasVoted: true,
      myVote: playerId,
      totalVotes: total,
      candidates: poll.candidates.map(c => {
        const votes = c._id === playerId ? c.votes + 1 : c.votes;
        return { ...c, votes, percent: Math.round((votes / total) * 100) };
      })
    };
  }
}
