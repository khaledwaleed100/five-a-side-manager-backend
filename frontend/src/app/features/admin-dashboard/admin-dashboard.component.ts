import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">Manage users and view feedback</p>
        </div>
      </div>

      <div *ngIf="isLoading()" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-light dark:border-accent-dark mx-auto"></div>
      </div>

      <div *ngIf="!isLoading()">
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 class="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Users</h3>
            <p class="text-4xl font-black text-gray-900 dark:text-white">{{ stats()?.users || 0 }}</p>
          </div>
          <div class="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 class="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Players</h3>
            <p class="text-4xl font-black text-gray-900 dark:text-white">{{ stats()?.players || 0 }}</p>
          </div>
          <div class="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 class="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Feedback Received</h3>
            <p class="text-4xl font-black text-gray-900 dark:text-white">{{ stats()?.feedback || 0 }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Users List -->
          <div class="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">Registered Users</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead class="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th class="px-6 py-4 font-semibold text-gray-900 dark:text-white">Email</th>
                    <th class="px-6 py-4 font-semibold text-gray-900 dark:text-white">Joined</th>
                    <th class="px-6 py-4 font-semibold text-gray-900 dark:text-white">Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let user of users()" class="border-b border-gray-200 dark:border-gray-700">
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ user.email }}</td>
                    <td class="px-6 py-4">{{ user.createdAt | date:'mediumDate' }}</td>
                    <td class="px-6 py-4">
                      <span *ngIf="user.isAdmin" class="bg-accent-light/10 text-accent-light px-2 py-1 rounded text-xs font-bold">Admin</span>
                      <span *ngIf="!user.isAdmin" class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-bold">User</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Feedback List -->
          <div class="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">User Feedback</h2>
            </div>
            <div class="p-6 space-y-4">
              <div *ngIf="feedbacks().length === 0" class="text-center text-gray-500 py-8">
                No feedback received yet.
              </div>
              <div *ngFor="let fb of feedbacks()" class="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-start mb-2">
                  <span class="font-semibold text-gray-900 dark:text-white text-sm">{{ fb.userId?.email || 'Unknown User' }}</span>
                  <span class="text-xs text-gray-500">{{ fb.createdAt | date:'short' }}</span>
                </div>
                <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ fb.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  users = signal<any[]>([]);
  stats = signal<any>(null);
  feedbacks = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadAdminData();
  }

  loadAdminData() {
    this.isLoading.set(true);
    
    // Check stats to see if user is admin
    this.http.get(`${this.apiUrl}/api/admin/stats`, { withCredentials: true }).subscribe({
      next: (statsData: any) => {
        this.stats.set(statsData);
        
        this.http.get(`${this.apiUrl}/api/admin/users`, { withCredentials: true }).subscribe((usersData: any) => {
          this.users.set(usersData);
        });
        
        this.http.get(`${this.apiUrl}/api/admin/feedback`, { withCredentials: true }).subscribe((fbData: any) => {
          this.feedbacks.set(fbData);
          this.isLoading.set(false);
        });
      },
      error: (err) => {
        console.error('Admin error:', err);
        this.router.navigate(['/matches']); // Redirect non-admins
      }
    });
  }
}
