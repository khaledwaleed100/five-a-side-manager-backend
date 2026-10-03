# Five-A-Side Manager: Architecture & Development Plan

This document outlines the step-by-step plan to refactor the application to adhere to SOLID principles, fix current issues, deploy successfully, and implement the "Team of the Week" feature.

## Phase 1: Diagnostics & Bug Fixing
- **Goal**: Resolve issues preventing the app from running locally and fix UI/logic bugs in the cards and pitch components.
- **Tasks**:
  - Analyze local run errors (Backend / Frontend).
  - Inspect the "Cards" component for data/UI faults.
  - Inspect the "Pitch" component (alignment, interactivity, data mapping).
  
## Phase 2: SOLID Principles Refactoring
- **Goal**: Restructure the codebase to improve maintainability and follow the 5 SOLID principles.
- **Tasks**:
  - **Single Responsibility Principle (SRP)**: Ensure classes/components have only one reason to change. Separate business logic from controllers and UI components.
  - **Open/Closed Principle (OCP)**: Refactor modules to be open for extension but closed for modification.
  - **Liskov Substitution Principle (LSP)**: Ensure subclasses/interfaces are interchangeable.
  - **Interface Segregation Principle (ISP)**: Create specific interfaces rather than general-purpose ones (especially in TypeScript).
  - **Dependency Inversion Principle (DIP)**: Depend on abstractions rather than concrete implementations (e.g., Dependency Injection in Angular and Node services).

## Phase 3: Deployment & Infrastructure
- **Goal**: Address concerns about the Render deployment quota.
- **Notes on Render**: If you are using Render's Free tier, the web service will spin down (sleep) after 15 minutes of inactivity. When a new request comes in, it can take 30-60 seconds to spin back up (cold start). Free instances also have a limit of 750 free hours per month (which is enough to run one service 24/7).

## Phase 4: Match Ratings, Team of the Week, & Polling System
- **Goal**: Implement a smooth flow for entering match stats, generating player ratings, and allowing user voting for Team of the Week.
- **Tasks**:
  - **Match Stats Entry**: Ensure the post-match stats entry UI is extremely smooth and efficient.
  - **Rating System (SOLID - SRP)**: Create a `RatingService` on the backend to automatically calculate player ratings per match (based on goals, assists, etc.), and aggregate them for Weekly (3 matches) and Monthly (12 matches) statistics.
  - **Poll Generation**: Add a button for admins to automatically generate a "Team of the Week Poll" at the end of the 3 matches. The backend will select the top-rated players as candidates.
  - **Voting UI**: Build a feature for logged-in users to view active polls and cast their votes for the Team of the Week.

### Phase 4 — Implementation Status (poll system)

| Piece | Where | SOLID role |
|---|---|---|
| Match rating (1-10) | `backend/services/ratingService.js` | SRP: only computes ratings |
| Ranking, winner, API shape | `backend/services/pollService.js` | SRP: poll business rules, no Express objects (unit-tested) |
| HTTP layer | `backend/controllers/pollController.js` | Thin: validate -> call service -> respond |
| Persistence | `backend/models/Poll.js` | Stores a *snapshot* of candidate stats so results never shift |
| Client store | `frontend/src/app/core/services/poll.service.ts` | Single source of truth (signals); screens depend on it, not on HTTP |
| Voting screen | `frontend/src/app/features/polls/polls.component.ts` | UI only |
| Entry card / manager button | `frontend/src/app/shared/components/poll-hub-card/` | UI only |

**API** (all require login): `GET /api/polls`, `GET /api/polls/status`, `POST /api/polls/generate {type}`, `POST /api/polls/:id/vote {playerId}`, `POST /api/polls/:id/close`.

**Rules**
- Weekly poll unlocks after **3** completed matches not yet used by a weekly poll; monthly after **12** (own counter, so the two cycles never interfere).
- Candidates = top 5 by average match rating (goal + assist contributions break ties).
- One vote per user, enforced **atomically** in one Mongo update (double-taps / two phones cannot double-vote).
- Only the manager who created a poll can close it; closing crowns the winner (ties -> higher rating).
- Voters never see who voted for whom - only their own vote and the totals.

### Phase 5 — Phone-first Polling UX

**Why phone-first matters here:** voters open the link from a chat message, one-handed, often on mobile data, often after the free-tier server has gone to sleep.

1. **Thumb-zone navigation** - on `<640px` the top links move into a bottom tab bar (Matches · Vote · Players · ...), with a red badge when a poll is waiting for the user's vote. iPhone home-indicator safe-area respected.
2. **Two-step voting, zero accidental votes** - tap a 76px player row (haptic tick, row lifts) -> sticky *Confirm vote* bar slides up above the tab bar -> confirm.
3. **Instant feedback** - vote is applied optimistically; results bars animate in immediately and roll back only if the server rejects it.
4. **Live results without draining battery/data** - short polling every **20 s**, only while the vote screen is open **and the app is visible**; refresh fires immediately when the phone is unlocked / tab regains focus; exponential backoff (max 2 min) on errors. No WebSockets: they add cost/complexity on Render free tier and 20 s is plenty for a friends' poll.
5. **Cold-start honesty** - if the first load takes >4 s the screen says *"Waking the server up"* instead of looking broken. Recommended: ping `/health` every 10 min with a free uptime monitor on voting nights.
6. **Rate-limit safety** - polls have their own limiter (120 req/min/IP). The global limiter (100 req/15 min/IP) would have locked friends out because everyone on the same Wi-Fi shares one IP.
7. **Privacy on shared phones** - poll cache is wiped on login/logout.

**Manager flow (the "admin button"):** *Matches* screen -> **Player polls** card shows progress `2/3 matches`. At 3/3 the **Start weekly poll** button unlocks -> one tap builds the poll and opens the live screen -> **End poll & crown winner** when everyone has voted.

**Known limitation:** `GET /api/polls` currently shows open polls from every manager account. Fine for one friends' group; add a group/league id to `Poll` + `User` before onboarding multiple independent groups.
