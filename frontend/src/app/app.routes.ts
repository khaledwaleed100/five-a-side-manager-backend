import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MatchesComponent } from './features/matches/matches.component';
import { MatchDetailComponent } from './features/match-detail/match-detail.component';
import { FeedbackComponent } from './features/feedback/feedback.component';
import { AdminDashboardComponent } from './features/admin-dashboard/admin-dashboard.component';
import { NotesComponent } from './features/notes/notes.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  { path: 'matches', component: MatchesComponent, canActivate: [authGuard] },
  { path: 'matches/:id', component: MatchDetailComponent, canActivate: [authGuard] },
  { path: 'players', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'feedback', component: FeedbackComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'notes', component: NotesComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/matches', pathMatch: 'full' },
  { path: '**', redirectTo: '/matches' }
];
