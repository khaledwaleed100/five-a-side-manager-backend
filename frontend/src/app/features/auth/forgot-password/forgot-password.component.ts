import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        <div>
          <div class="flex justify-center">
            <svg class="w-12 h-12 text-accent-light dark:text-accent-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
          </div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Forgot Password
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your email and we will send you a reset link.
          </p>
        </div>

        <div *ngIf="successMsg()" class="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
          {{ successMsg() }}
        </div>

        <div *ngIf="errorMsg()" class="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          {{ errorMsg() }}
        </div>

        <form *ngIf="!successMsg()" class="mt-8 space-y-6" (ngSubmit)="onSubmit()">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input id="email-address" name="email" type="email" required [(ngModel)]="email"
                   class="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:border-transparent transition-all sm:text-sm" 
                   placeholder="Email address (must end with @five.com)">
          </div>

          <div>
            <button type="submit" [disabled]="isLoading() || !email"
                    class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-accent-light dark:bg-accent-dark hover:bg-red-700 dark:hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-light transition-all disabled:opacity-50 hover:-translate-y-0.5 shadow-md">
              {{ isLoading() ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </div>
        </form>

        <div class="text-center mt-4">
          <a routerLink="/login" class="font-medium text-accent-light dark:text-accent-dark hover:text-red-500 transition-colors">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  authService = inject(AuthService);
  email = '';
  isLoading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  onSubmit() {
    this.isLoading.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    this.authService.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.successMsg.set('Reset link has been generated. Please check the backend console to simulate the email receipt.');
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMsg.set(err.error?.message || 'Failed to send reset link.');
      }
    });
  }
}
