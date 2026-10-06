import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PwaService } from '../../../core/services/pwa.service';
import { PollService } from '../../../core/services/poll.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  pwaService = inject(PwaService);
  pollService = inject(PollService);
  isDarkMode = signal(false);
  private pollsLive = false;

  constructor() {
    // While logged in, keep polls fresh app-wide so the Vote badge lights up as soon as
    // the admin opens a poll. PollService pauses automatically when the tab is hidden.
    effect(() => {
      const authed = this.authService.isAuthenticated();
      if (authed && !this.pollsLive) {
        this.pollsLive = true;
        this.pollService.refresh().catch(() => undefined);
        this.pollService.startLive();
      } else if (!authed && this.pollsLive) {
        this.pollsLive = false;
        this.pollService.stopLive();
      }
    });
  }

  ngOnDestroy() {
    if (this.pollsLive) this.pollService.stopLive();
  }

  ngOnInit() {
    // Check system preference or localStorage
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
    } else {
      this.isDarkMode.set(false);
      document.documentElement.classList.remove('dark');
    }
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  logout() {
    this.authService.logout();
  }

  showProfileModal = signal(false);
  profileForm = { name: '', password: '' };
  isUpdating = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  toggleProfile() {
    if (this.showProfileModal()) {
      this.closeProfile();
    } else {
      const user = this.authService.currentUser();
      if (user) {
        this.profileForm = { name: user.name || '', password: '' };
        this.showProfileModal.set(true);
        this.successMsg.set('');
        this.errorMsg.set('');
      }
    }
  }

  closeProfile() {
    this.showProfileModal.set(false);
  }

  updateProfile() {
    this.isUpdating.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');
    
    this.authService.updateProfile(this.profileForm).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.successMsg.set('Profile updated successfully');
        this.profileForm.password = ''; // clear password field
        setTimeout(() => this.closeProfile(), 1500);
      },
      error: (err: any) => {
        this.isUpdating.set(false);
        this.errorMsg.set(err.error?.message || 'Update failed');
      }
    });
  }
}
