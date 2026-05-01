import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-2xl mx-auto mt-12 bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Send Feedback</h2>
      
      <div *ngIf="successMessage()" class="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
        {{ successMessage() }}
      </div>
      
      <div *ngIf="errorMessage()" class="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
        {{ errorMessage() }}
      </div>

      <form (ngSubmit)="submitFeedback()" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message or Feature Request</label>
          <textarea [(ngModel)]="message" name="message" rows="5" required
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-light outline-none resize-none"
                    placeholder="I think it would be cool if..."></textarea>
        </div>
        <button type="submit" [disabled]="!message || isLoading()"
                class="px-8 py-3 bg-accent-light dark:bg-accent-dark text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition-colors disabled:opacity-50">
          {{ isLoading() ? 'Sending...' : 'Submit Feedback' }}
        </button>
      </form>
    </div>
  `
})
export class FeedbackComponent {
  private http = inject(HttpClient);
  
  message = '';
  successMessage = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  submitFeedback() {
    if (!this.message) return;
    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.http.post(`${environment.apiUrl}/api/feedback`, { message: this.message }, { withCredentials: true })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.successMessage.set('Thank you! Your feedback has been sent to the admin.');
          this.message = '';
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Failed to send feedback. Please try again.');
        }
      });
  }
}
