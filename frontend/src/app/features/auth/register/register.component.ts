import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  confirmPassword = '';
  error = signal('');
  isLoading = signal(false);

  onSubmit() {
    if (!this.email || !this.password || !this.confirmPassword) return;
    if (!this.email.endsWith('@five.com')) {
      this.error.set('Email must belong to the @five.com domain');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    this.authService.register(this.email, this.password).subscribe({
      next: () => {
        // Auto login after register
        this.authService.login(this.email, this.password).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.isLoading.set(false);
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Registration failed.');
      }
    });
  }
}
