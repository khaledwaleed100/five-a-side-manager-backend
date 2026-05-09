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
            Reset Password
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {{ getStepDescription() }}
          </p>
        </div>

        <div *ngIf="successMsg()" class="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 text-sm">
          {{ successMsg() }}
        </div>

        <div *ngIf="errorMsg()" class="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-sm">
          {{ errorMsg() }}
        </div>

        <!-- Step 1: Email -->
        <form *ngIf="step === 1 && !successMsg()" class="mt-8 space-y-6" (ngSubmit)="onGetQuestion()">
          <div>
            <label for="email-address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input id="email-address" name="email" type="email" required [(ngModel)]="email"
                   class="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:border-transparent transition-all sm:text-sm" 
                   placeholder="manager@five.com">
          </div>
          <div>
            <button type="submit" [disabled]="isLoading() || !email"
                    class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-accent-light dark:bg-accent-dark hover:bg-red-700 dark:hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-light transition-all disabled:opacity-50 hover:-translate-y-0.5 shadow-md">
              {{ isLoading() ? 'Loading...' : 'Get Security Question' }}
            </button>
          </div>
        </form>

        <!-- Step 2: Answer -->
        <form *ngIf="step === 2 && !successMsg()" class="mt-8 space-y-6" (ngSubmit)="onVerifyAnswer()">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question:</label>
            <div class="px-4 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-800 dark:text-gray-200 text-sm italic border border-gray-200 dark:border-gray-700">
              {{ securityQuestion }}
            </div>
          </div>
          <div>
            <label for="security-answer" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Answer</label>
            <input id="security-answer" name="answer" type="text" required [(ngModel)]="securityAnswer"
                   class="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:border-transparent transition-all sm:text-sm" 
                   placeholder="Type your answer...">
          </div>
          <div>
            <button type="submit" [disabled]="isLoading() || !securityAnswer"
                    class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-accent-light dark:bg-accent-dark hover:bg-red-700 dark:hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-light transition-all disabled:opacity-50 hover:-translate-y-0.5 shadow-md">
              {{ isLoading() ? 'Verifying...' : 'Verify Answer' }}
            </button>
          </div>
        </form>

        <!-- Step 3: New Password -->
        <form *ngIf="step === 3 && !successMsg()" class="mt-8 space-y-6" (ngSubmit)="onResetPassword()">
          <div>
            <label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
            <input id="new-password" name="password" type="password" required minlength="6" [(ngModel)]="newPassword"
                   class="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-light dark:focus:ring-accent-dark focus:border-transparent transition-all sm:text-sm" 
                   placeholder="••••••••">
          </div>
          <div>
            <button type="submit" [disabled]="isLoading() || !newPassword"
                    class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-accent-light dark:bg-accent-dark hover:bg-red-700 dark:hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-light transition-all disabled:opacity-50 hover:-translate-y-0.5 shadow-md">
              {{ isLoading() ? 'Resetting...' : 'Set New Password' }}
            </button>
          </div>
        </form>

        <div class="text-center mt-4" *ngIf="step > 1 && !successMsg()">
          <button type="button" (click)="resetFlow()" class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            Start Over
          </button>
        </div>

        <div class="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
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
  
  step = 1; // 1: Email, 2: Answer, 3: New Password
  
  email = '';
  securityQuestion = '';
  securityAnswer = '';
  resetToken = '';
  newPassword = '';

  isLoading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  getStepDescription(): string {
    if (this.successMsg()) return 'Password successfully updated!';
    switch (this.step) {
      case 1: return 'Enter your email to retrieve your security question.';
      case 2: return 'Answer your security question to continue.';
      case 3: return 'Create a new, strong password.';
      default: return '';
    }
  }

  resetFlow() {
    this.step = 1;
    this.securityQuestion = '';
    this.securityAnswer = '';
    this.resetToken = '';
    this.newPassword = '';
    this.errorMsg.set('');
    this.successMsg.set('');
  }

  onGetQuestion() {
    if (!this.email) return;
    this.isLoading.set(true);
    this.errorMsg.set('');

    this.authService.getSecurityQuestion(this.email).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.securityQuestion = res.securityQuestion;
        this.step = 2;
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMsg.set(err.error?.message || 'Failed to retrieve question. User may not exist.');
      }
    });
  }

  onVerifyAnswer() {
    if (!this.securityAnswer) return;
    this.isLoading.set(true);
    this.errorMsg.set('');

    this.authService.verifySecurityAnswer(this.email, this.securityAnswer).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.resetToken = res.resetToken;
        this.step = 3;
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMsg.set(err.error?.message || 'Incorrect answer. Please try again.');
      }
    });
  }

  onResetPassword() {
    if (!this.newPassword) return;
    this.isLoading.set(true);
    this.errorMsg.set('');

    this.authService.resetPasswordWithToken(this.email, this.resetToken, this.newPassword).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.successMsg.set('Your password has been reset successfully. You can now login.');
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMsg.set(err.error?.message || 'Failed to reset password.');
      }
    });
  }
}
