import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto mt-12 bg-surface-light dark:bg-surface-dark p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Admin Notes</h2>
      
      <div *ngIf="successMessage()" class="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
        {{ successMessage() }}
      </div>
      
      <div *ngIf="errorMessage()" class="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
        {{ errorMessage() }}
      </div>

      <form (ngSubmit)="submitNote()" class="space-y-6 mb-8">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Note</label>
          <textarea [(ngModel)]="content" name="content" rows="4" required
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-light outline-none resize-none"
                    placeholder="Write down a task, idea, or reminder..."></textarea>
        </div>
        <button type="submit" [disabled]="!content || isLoading()"
                class="px-8 py-3 bg-accent-light dark:bg-accent-dark text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition-colors disabled:opacity-50">
          {{ isLoading() ? 'Saving...' : 'Save Note' }}
        </button>
      </form>

      <div class="space-y-4">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Notes</h3>
        
        <div *ngIf="notes().length === 0 && !isFetching()" class="text-center py-8 text-gray-500">
          You haven't created any notes yet.
        </div>
        
        <div *ngIf="isFetching()" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-light mx-auto"></div>
        </div>

        <div *ngFor="let note of notes()" class="p-5 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 relative group">
          <p class="text-gray-800 dark:text-gray-200 whitespace-pre-wrap pr-8">{{ note.content }}</p>
          <div class="flex justify-between items-center mt-4 text-xs text-gray-500">
            <span>{{ note.createdAt | date:'medium' }}</span>
          </div>
          <button (click)="deleteNote(note._id)" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Note">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
    </div>
  `
})
export class NotesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  
  content = '';
  successMessage = signal('');
  errorMessage = signal('');
  isLoading = signal(false);
  isFetching = signal(true);
  notes = signal<any[]>([]);

  ngOnInit() {
    this.fetchNotes();
  }

  fetchNotes() {
    this.isFetching.set(true);
    this.http.get(`${this.apiUrl}/api/notes`, { withCredentials: true })
      .subscribe({
        next: (data: any) => {
          this.notes.set(data);
          this.isFetching.set(false);
        },
        error: () => {
          this.isFetching.set(false);
          this.router.navigate(['/matches']); // Redirect if not admin or error
        }
      });
  }

  submitNote() {
    if (!this.content) return;
    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.http.post(`${this.apiUrl}/api/notes`, { content: this.content }, { withCredentials: true })
      .subscribe({
        next: (newNote: any) => {
          this.isLoading.set(false);
          this.successMessage.set('Note saved successfully.');
          this.content = '';
          this.notes.update(current => [newNote, ...current]);
          
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Failed to save note. Please try again.');
        }
      });
  }

  deleteNote(id: string) {
    if(!confirm('Are you sure you want to delete this note?')) return;
    
    this.http.delete(`${this.apiUrl}/api/notes/${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.notes.update(current => current.filter(note => note._id !== id));
        },
        error: () => {
          this.errorMessage.set('Failed to delete note.');
        }
      });
  }
}
