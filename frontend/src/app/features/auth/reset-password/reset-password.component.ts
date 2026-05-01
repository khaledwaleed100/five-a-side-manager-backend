import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div>
          <div class="flex justify-center">
            <svg class="w-12 h-12 text-accent-light dark:text-accent-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below.
          </p>
        </div>

        <div *ngIf="successMsg()" class="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 text-center">
          <p>{{ successMsg() }}</p>
          <a routerLink="/login" class="inline-block mt-2 font-bold hover:underline">Proceed to Login</a>
        </div>

        <div *ngIf="errorMsg()" class="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          {{ errorMsg() }}
        </div>

        <form *ngIf="!successMsg()" class="mt-8 space-y-6" (ngSubmit)="onSubmit()">
          <div>
            <label for="password" class="sr-only">New Password</label>
            <input id="password" name="password" type="password" required [(ngModel)]="password"
                   class="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:border-transparent transition-all sm:text-sm" 
                   placeholder="New Password">
          </div>
          <div>
            <label for="confirmPassword" class="sr-only">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required [(ngModel)]="confirmPassword"
                   class="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:border-transparent transition-all sm:text-sm" 
                   placeholder="Confirm New Password">
          </div>

          <div>
            <button type="submit" [disabled]="isLoading() || !password || !confirmPassword"
                    class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-accent-light dark:bg-accent-dark hover:bg-red-700 dark:hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-light transition-all disabled:opacity-50 hover:-translate-y-0.5 shadow-md">
              {{ isLoading() ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  
  token = '';
  password = '';
  confirmPassword = '';
  isLoading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.errorMsg.set('Invalid or missing reset token.');
    }
  }

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.errorMsg.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.successMsg.set('Your password has been reset successfully.');
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMsg.set(err.error?.message || 'Failed to reset password.');
      }
    });
  }
}
